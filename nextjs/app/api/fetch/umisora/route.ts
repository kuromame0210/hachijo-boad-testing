import { NextResponse } from "next/server"
import { load } from "cheerio"
import type { Element } from "domhandler"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { TransportNormalizedItem } from "@/lib/schema/transport"
import { fetchText } from "@/lib/http/fetchText"

const UMISORA_URL = "https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/"

function mapStatus(text: string | undefined) {
  if (!text) return "UNKNOWN" as const
  if (text.includes("欠航") || text.includes("運休")) return "CANCELLED" as const
  if (text.includes("就航")) return "ON_TIME" as const
  if (text.includes("条件")) return "SUSPENDED" as const
  if (text.includes("運航")) return "ON_TIME" as const
  return "UNKNOWN" as const
}

export async function GET() {
  const sources = [{ name: "うみそら便 青ヶ島", url: UMISORA_URL }]

  try {
    const { data: html } = await fetchText(UMISORA_URL)
    const $ = load(html)

    const warnings: string[] = []
    const detailSection = $(".info__detail#aogashima")
    const tables = detailSection
      .find(".info__detail-table")
      .filter((_, el) => $(el).parents(".info__detail-sp").length === 0)
      .toArray()
    if (!detailSection.length || !tables.length) {
      warnings.push("運航状況テーブルが見つかりませんでした")
    }

    const updateMatch = html.match(/\d{4}年\d{1,2}月\d{1,2}日[^\n]{0,20}現在/)
    const updatedAtText = updateMatch ? updateMatch[0] : undefined

    const extractedTables = tables.map((table) => {
      const tableEl = $(table)
      const companyCells = tableEl.find(".info__detail-company:not(.th)").toArray()
      const genreCells = tableEl.find(".info__detail-genre:not(.th)").toArray()
      const fnCells = tableEl.find(".info__detail-fn:not(.th)").toArray()
      const depTimeCells = tableEl.find(".info__detail-departure:not(.th)").toArray()
      const depPlaceCells = tableEl.find(".info__detail-to:not(.th)").toArray()
      const arrTimeCells = tableEl.find(".info__detail-arrival:not(.th)").toArray()
      const arrPlaceCells = tableEl.find(".info__detail-from:not(.th)").toArray()
      const statusCells = tableEl.find(".info__detail-status:not(.th)").toArray()
      const noteCells = tableEl.find(".info__detail-info-remark:not(.th)").toArray()

      const rowCount = Math.max(
        companyCells.length,
        genreCells.length,
        fnCells.length,
        depTimeCells.length,
        depPlaceCells.length,
        arrTimeCells.length,
        arrPlaceCells.length,
        statusCells.length
      )

      const rows = Array.from({ length: rowCount }, (_, index) => {
        const pickText = (cells: Element[]) => {
          const cell = cells[index]
          if (!cell) return ""
          const text = $(cell).text().trim().replace(/\s+/g, " ")
          if (text) return text
          const imgAlt = $(cell).find("img").attr("alt")
          return imgAlt ? imgAlt.trim() : ""
        }

        const pickStatus = (cells: Element[]) => {
          const cell = cells[index]
          if (!cell) return ""
          const img = $(cell).find("img").first()
          const alt = img.attr("alt")?.trim()
          if (alt && alt !== "テキスト") return alt
          const src = img.attr("src") ?? ""
          if (src.includes("icon_circle")) return "運航"
          if (src.includes("icon_cross")) return "欠航・運休"
          if (src.includes("icon_caution")) return "条件付"
          const text = $(cell).text().trim().replace(/\s+/g, " ")
          return text
        }

        return {
          company: pickText(companyCells),
          genre: pickText(genreCells),
          flight: pickText(fnCells),
          depTime: pickText(depTimeCells),
          depPlace: pickText(depPlaceCells),
          arrTime: pickText(arrTimeCells),
          arrPlace: pickText(arrPlaceCells),
          status: pickStatus(statusCells),
          note: pickText(noteCells),
        }
      })

      return { rows }
    })

    const filteredRows = extractedTables.flatMap((table) =>
      table.rows.filter((row) =>
        `${row.depPlace} ${row.arrPlace}`.includes("八丈島") &&
        `${row.depPlace} ${row.arrPlace}`.includes("青ヶ島")
      )
    )

    const normalized: TransportNormalizedItem[] = filteredRows.map((row) => {
      const titleParts = [row.company, row.genre, row.flight].filter(Boolean)
      return {
        service: "UMISORA_AOGASHIMA",
        title: titleParts.length ? titleParts.join(" / ") : "UMISORA",
        status: mapStatus(row.status),
        statusText: row.status || undefined,
        depPlanned: row.depTime || undefined,
        arrPlanned: row.arrTime || undefined,
        port: [row.depPlace, row.arrPlace].filter(Boolean).join(" / ") || undefined,
        note: row.note || updatedAtText,
        sourceUrls: [UMISORA_URL],
      }
    })

    if (!filteredRows.length) {
      warnings.push("八丈島⇄青ヶ島の行が見つかりませんでした")
    }

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: html,
        extracted: {
          updatedAtText,
          tables: extractedTables,
          filteredRows,
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
