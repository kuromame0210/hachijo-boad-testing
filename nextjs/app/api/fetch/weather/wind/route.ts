import { NextResponse } from "next/server"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { WeatherNormalizedItem } from "@/lib/schema/weather"
import { fetchJson } from "@/lib/http/fetchJson"
import { HACHIJO_TOWN_OFFICE } from "@/lib/geo/points"

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

const HORIZONS = [
  { key: "TODAY", offsetHours: 0 },
  { key: "PLUS_24H", offsetHours: 24 },
  { key: "PLUS_72H", offsetHours: 72 },
  { key: "PLUS_7D", offsetHours: 168 },
] as const

type OpenMeteoResponse = {
  hourly?: {
    time?: string[]
    windspeed_10m?: number[]
    windgusts_10m?: number[]
    winddirection_10m?: number[]
  }
}

function closestIndex(times: string[], target: Date) {
  let bestIndex = 0
  let bestDiff = Number.POSITIVE_INFINITY
  for (let i = 0; i < times.length; i += 1) {
    const diff = Math.abs(new Date(times[i]).getTime() - target.getTime())
    if (diff < bestDiff) {
      bestDiff = diff
      bestIndex = i
    }
  }
  return bestIndex
}

export async function GET() {
  const sources = [{ name: "Open-Meteo Forecast", url: "https://open-meteo.com/en/docs" }]
  const url = `${OPEN_METEO_URL}?latitude=${HACHIJO_TOWN_OFFICE.lat}&longitude=${HACHIJO_TOWN_OFFICE.lon}&hourly=windspeed_10m,windgusts_10m,winddirection_10m&timezone=Asia%2FTokyo`

  try {
    const { data } = await fetchJson<OpenMeteoResponse>(url)
    const times = data.hourly?.time ?? []
    const speeds = data.hourly?.windspeed_10m ?? []
    const gusts = data.hourly?.windgusts_10m ?? []
    const directions = data.hourly?.winddirection_10m ?? []

    const warnings: string[] = []
    if (!times.length) warnings.push("hourly.time が空です")

    const now = new Date()
    const extracted = HORIZONS.map(({ key, offsetHours }) => {
      const target = new Date(now.getTime() + offsetHours * 60 * 60 * 1000)
      const index = times.length ? closestIndex(times, target) : -1
      return {
        horizon: key,
        index,
        time: index >= 0 ? times[index] : undefined,
        windSpeedMs: index >= 0 ? speeds[index] : undefined,
        windGustMs: index >= 0 ? gusts[index] : undefined,
        windDirectionDeg: index >= 0 ? directions[index] : undefined,
      }
    })

    const normalized: WeatherNormalizedItem[] = extracted.map((entry) => ({
      service: "WEATHER_WIND",
      horizon: entry.horizon,
      point: "HACHIJO_CENTER",
      windSpeedMs: entry.windSpeedMs,
      windGustMs: entry.windGustMs,
      windDirectionDeg: entry.windDirectionDeg,
      time: entry.time,
      sourceUrls: ["https://open-meteo.com/en/docs"],
    }))

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: data,
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
