import { NextResponse } from "next/server"
import { load } from "cheerio"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { TransportNormalizedItem } from "@/lib/schema/transport"
import { fetchText } from "@/lib/http/fetchText"

const SCHEDULE_URL = "https://www.tokaikisen.co.jp/schedule/"
const TIMETABLE_URL = "https://www.tokaikisen.co.jp/boarding/timetable/"

function mapStatus(text: string | undefined) {
  if (!text) return "UNKNOWN" as const
  if (text.includes("欠航")) return "CANCELLED" as const
  if (text.includes("就航")) return "ON_TIME" as const
  if (text.includes("条件")) return "SUSPENDED" as const
  return "UNKNOWN" as const
}

export async function GET() {
  const sources = [
    { name: "運航状況", url: SCHEDULE_URL },
    { name: "時刻表", url: TIMETABLE_URL },
  ]

  try {
    const { data: html } = await fetchText(SCHEDULE_URL)
    const $ = load(html)

    const warnings: string[] = []
    const hachijojimaSection = $("#Hachijojima")
    if (!hachijojimaSection.length) {
      warnings.push("八丈島発着セクションが見つかりませんでした")
    }

    const tables = hachijojimaSection.find("table.stable").toArray()
    if (!tables.length) {
      warnings.push("運航状況テーブルが見つかりませんでした")
    }

    const extracted = tables.map((table) => {
      const tableEl = $(table)
      const tableTitle = tableEl
        .closest(".scheduleTable")
        .find(".scheduleTable__header .title")
        .first()
        .text()
        .trim()
      const rows = tableEl.find("tr").toArray()
      const headerCells = rows.length ? $(rows[0]).find("th,td").toArray() : []
      const headers = headerCells.map((cell) => $(cell).text().trim())
      const dataRows = rows.slice(1).map((row) =>
        $(row)
          .find("th,td")
          .toArray()
          .map((cell) => $(cell).text().trim())
      )
      return { title: tableTitle, headers, rows: dataRows }
    })

    const normalized: TransportNormalizedItem[] = []
    for (const table of extracted) {
      const indexOf = (keywords: string[]) =>
        table.headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)))

      const depTimeIndex = indexOf(["出航"])
      const depPortIndex = indexOf(["発地", "発", "行き先"])
      const shipIndex = indexOf(["船種", "船"])
      const arrPortIndex = indexOf(["到着", "到着港", "到着地", "着", "出帆港"])
      const statusIndex = indexOf(["運航", "状況"])
      const noteIndex = indexOf(["備考", "注意"])

      for (const cells of table.rows) {
        const depTime = depTimeIndex >= 0 ? cells[depTimeIndex] : undefined
        const depPort = depPortIndex >= 0 ? cells[depPortIndex] : undefined
        const shipType = shipIndex >= 0 ? cells[shipIndex] : undefined
        const arrPort = arrPortIndex >= 0 ? cells[arrPortIndex] : undefined
        const statusText = statusIndex >= 0 ? cells[statusIndex] : undefined
        const note = noteIndex >= 0 ? cells[noteIndex] : undefined

        const titleParts = [table.title, depPort, shipType, arrPort].filter(Boolean)

        normalized.push({
          service: "TOKAIKISEN",
          title: titleParts.length ? titleParts.join(" / ") : "TOKAIKISEN",
          status: mapStatus(statusText),
          statusText,
          depPlanned: depTime,
          port: arrPort ?? depPort,
          note,
          sourceUrls: [SCHEDULE_URL],
        })
      }
    }

    if (!normalized.length) {
      warnings.push("運航状況テーブルが空です")
    }

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: html,
        extracted,
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
