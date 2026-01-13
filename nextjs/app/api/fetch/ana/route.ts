import { NextResponse } from "next/server"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { TransportNormalizedItem } from "@/lib/schema/transport"
import { fetchJson } from "@/lib/http/fetchJson"

const DEPARTURE_URL =
  "https://api.odpt.org/api/v4/odpt:FlightInformationDeparture?odpt:operator=odpt.Operator:ANA&acl:consumerKey="
const ARRIVAL_URL =
  "https://api.odpt.org/api/v4/odpt:FlightInformationArrival?odpt:operator=odpt.Operator:ANA&acl:consumerKey="

const TARGET_DEPARTURES = ["ANA1891", "ANA1893", "ANA1895"]
const TARGET_ARRIVALS = ["ANA1892", "ANA1894", "ANA1896"]

type OdptItem = Record<string, unknown>

function getString(item: OdptItem, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }
  return undefined
}

function getNumber(item: OdptItem, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
  }
  return undefined
}

function mapStatus(value?: string) {
  if (!value) return "UNKNOWN" as const
  const normalized = value.toLowerCase()
  if (normalized.includes("cancel")) return "CANCELLED" as const
  if (normalized.includes("delay")) return "DELAYED" as const
  if (normalized.includes("suspend")) return "SUSPENDED" as const
  if (normalized.includes("on_time") || normalized.includes("on-time")) return "ON_TIME" as const
  return "UNKNOWN" as const
}

function normalizeItem(
  item: OdptItem,
  direction: "OUTBOUND" | "INBOUND",
  sourceUrl: string
): TransportNormalizedItem {
  const flightNumber = getString(item, [
    "odpt:flightNumber",
    "odpt:flightNumberText",
    "odpt:flightNumberName",
  ])
  const status = mapStatus(
    getString(item, ["odpt:flightStatus", "odpt:flightStatusText", "odpt:status"])
  )

  return {
    service: "ANA",
    direction,
    title: flightNumber ?? (getString(item, ["@id", "dc:title"]) ?? "UNKNOWN"),
    status,
    depPlanned: getString(item, [
      "odpt:scheduledDepartureTime",
      "odpt:scheduledDepartureTimeText",
    ]),
    arrPlanned: getString(item, [
      "odpt:scheduledArrivalTime",
      "odpt:scheduledArrivalTimeText",
    ]),
    depEstimated: getString(item, [
      "odpt:estimatedDepartureTime",
      "odpt:estimatedDepartureTimeText",
    ]),
    arrEstimated: getString(item, [
      "odpt:estimatedArrivalTime",
      "odpt:estimatedArrivalTimeText",
    ]),
    delayMinutes: getNumber(item, ["odpt:delay", "odpt:delayMinutes"]),
    note: getString(item, ["odpt:note", "odpt:remarks", "odpt:remark"]),
    sourceUrls: [sourceUrl],
  }
}

export async function GET() {
  const consumerKey = process.env.ODPT_CONSUMER_KEY
  const sources = [
    { name: "ODPT 出発", url: `${DEPARTURE_URL}YOUR_KEY` },
    { name: "ODPT 到着", url: `${ARRIVAL_URL}YOUR_KEY` },
  ]

  if (!consumerKey) {
    return NextResponse.json(
      buildDebugEnvelope({
        ok: false,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: null,
        error: { message: "ODPT_CONSUMER_KEY is not set" },
      })
    )
  }

  const departureUrl = `${DEPARTURE_URL}${consumerKey}`
  const arrivalUrl = `${ARRIVAL_URL}${consumerKey}`

  try {
    const [departureRes, arrivalRes] = await Promise.all([
      fetchJson<OdptItem[]>(departureUrl),
      fetchJson<OdptItem[]>(arrivalUrl),
    ])

    const departures = departureRes.data.filter((item) => {
      const flightNumber = getString(item, [
        "odpt:flightNumber",
        "odpt:flightNumberText",
        "odpt:flightNumberName",
      ])
      return flightNumber ? TARGET_DEPARTURES.includes(flightNumber) : false
    })

    const arrivals = arrivalRes.data.filter((item) => {
      const flightNumber = getString(item, [
        "odpt:flightNumber",
        "odpt:flightNumberText",
        "odpt:flightNumberName",
      ])
      return flightNumber ? TARGET_ARRIVALS.includes(flightNumber) : false
    })

    const normalized: TransportNormalizedItem[] = [
      ...departures.map((item) => normalizeItem(item, "OUTBOUND", departureUrl)),
      ...arrivals.map((item) => normalizeItem(item, "INBOUND", arrivalUrl)),
    ]

    const warnings: string[] = []
    if (departures.length === 0) warnings.push("No target departures found")
    if (arrivals.length === 0) warnings.push("No target arrivals found")

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: {
          departures: departureRes.data,
          arrivals: arrivalRes.data,
        },
        extracted: {
          departures,
          arrivals,
        },
        normalized,
        warnings: warnings.length ? warnings : undefined,
      })
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      buildDebugEnvelope({
        ok: false,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: null,
        error: { message },
      })
    )
  }
}
