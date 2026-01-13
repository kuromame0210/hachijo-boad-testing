import { NextResponse } from "next/server"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { TransportNormalizedItem } from "@/lib/schema/transport"
import { fetchJson } from "@/lib/http/fetchJson"

const PLACE_ID = "ChIJRZf7Z0H1FzUR0r3rVd7YH6c"
const PLACE_URL = `https://places.googleapis.com/v1/places/${PLACE_ID}`
const FIELD_MASK = "id,displayName,currentOpeningHours,regularOpeningHours"

const SOURCES = [
  {
    name: "Googleマップ 八丈ストア",
    url: "https://maps.app.goo.gl/z3mKL3S91tcQUxRM9",
  },
  {
    name: "Places API Place Details",
    url: "https://developers.google.com/maps/documentation/places/web-service/place-details",
  },
]

type OpeningHours = {
  openNow?: boolean
  weekdayDescriptions?: string[]
  periods?: Array<{
    open?: { day?: number; hour?: number; minute?: number }
    close?: { day?: number; hour?: number; minute?: number }
  }>
}

type PlaceResponse = {
  id?: string
  displayName?: { text?: string }
  currentOpeningHours?: OpeningHours
  regularOpeningHours?: OpeningHours
}

const WEEKDAYS_JA = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"]

function findTodayHours(weekdayDescriptions: string[] | undefined) {
  if (!weekdayDescriptions?.length) return undefined
  const todayLabel = WEEKDAYS_JA[new Date().getDay()]
  return weekdayDescriptions.find((line) => line.startsWith(todayLabel))
}

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      buildDebugEnvelope({
        ok: false,
        fetchedAt: new Date().toISOString(),
        sources: SOURCES,
        raw: null,
        error: { message: "GOOGLE_MAPS_API_KEY is not set" },
      })
    )
  }

  const url = `${PLACE_URL}?languageCode=ja`

  try {
    const { data } = await fetchJson<PlaceResponse>(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    })

    const current = data.currentOpeningHours
    const regular = data.regularOpeningHours
    const todayLine = findTodayHours(current?.weekdayDescriptions ?? regular?.weekdayDescriptions)
    const weekdayDescriptions = regular?.weekdayDescriptions ?? []

    let specialNote: string | undefined
    if (current?.weekdayDescriptions && regular?.weekdayDescriptions) {
      const currentJson = JSON.stringify(current.weekdayDescriptions)
      const regularJson = JSON.stringify(regular.weekdayDescriptions)
      if (currentJson !== regularJson) {
        specialNote = "本日は特別営業時間の可能性があります"
      }
    } else if (current?.weekdayDescriptions && !regular?.weekdayDescriptions) {
      specialNote = "特別営業時間情報が提供されています"
    }

    const normalized: TransportNormalizedItem[] = []
    normalized.push({
      service: "BUSINESS_HOURS",
      title: "本日の営業時間",
      status:
        typeof current?.openNow === "boolean"
          ? current.openNow
            ? "OPEN"
            : "CLOSED"
          : "UNKNOWN",
      note: todayLine ?? "UNKNOWN",
      sourceUrls: [SOURCES[0].url],
    })

    if (weekdayDescriptions.length) {
      normalized.push({
        service: "BUSINESS_HOURS",
        title: "通常営業時間",
        note: weekdayDescriptions.join(" / "),
        sourceUrls: [SOURCES[0].url],
      })
    }

    if (specialNote) {
      normalized.push({
        service: "BUSINESS_HOURS",
        title: "特別営業時間",
        note: specialNote,
        sourceUrls: [SOURCES[0].url],
      })
    }

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources: SOURCES,
        raw: data,
        extracted: {
          todayLine,
          openNow: current?.openNow,
          weekdayDescriptions,
          specialNote,
        },
        normalized,
      })
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      buildDebugEnvelope({
        ok: false,
        fetchedAt: new Date().toISOString(),
        sources: SOURCES,
        raw: null,
        error: { message },
      })
    )
  }
}
