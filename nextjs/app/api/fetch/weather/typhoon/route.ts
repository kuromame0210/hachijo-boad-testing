import { NextResponse } from "next/server"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { WeatherNormalizedItem } from "@/lib/schema/weather"
import { fetchText } from "@/lib/http/fetchText"

const FEED_URL = "https://www.data.jma.go.jp/developer/xml/feed/extra.xml"

type FeedEntry = {
  id?: string
  title?: string
  updated?: string
  link?: string
}

function extractEntries(xml: string) {
  const entries: FeedEntry[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null
  while ((match = entryRegex.exec(xml))) {
    const block = match[1]
    const titleMatch = block.match(/<title>([^<]*)<\/title>/)
    const idMatch = block.match(/<id>([^<]*)<\/id>/)
    const updatedMatch = block.match(/<updated>([^<]*)<\/updated>/)
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/)
    entries.push({
      id: idMatch?.[1],
      title: titleMatch?.[1],
      updated: updatedMatch?.[1],
      link: linkMatch?.[1],
    })
  }
  return entries
}

export async function GET() {
  const sources = [{ name: "気象庁 防災情報XML", url: FEED_URL }]

  try {
    const { data: xml } = await fetchText(FEED_URL)
    const feedUpdated = xml.match(/<updated>([^<]*)<\/updated>/)?.[1]
    const entries = extractEntries(xml)
    const typhoonEntries = entries.filter((entry) => {
      const title = entry.title ?? ""
      return title.includes("台風") || title.toLowerCase().includes("typhoon")
    })

    const normalized: WeatherNormalizedItem[] = typhoonEntries.map((entry) => ({
      service: "WEATHER_TYPHOON",
      horizon: "TODAY",
      typhoonName: entry.title,
      time: entry.updated,
      note: entry.id,
      sourceUrls: [entry.link ?? FEED_URL],
    }))

    const warnings: string[] = []
    if (!typhoonEntries.length) warnings.push("台風情報が見つかりませんでした")

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: xml,
        extracted: {
          feedUpdated,
          entries: typhoonEntries,
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
