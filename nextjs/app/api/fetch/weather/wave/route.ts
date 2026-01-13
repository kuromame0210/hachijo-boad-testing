import { NextResponse } from "next/server"
import { buildDebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { WeatherNormalizedItem } from "@/lib/schema/weather"
import { fetchJson } from "@/lib/http/fetchJson"
import { SOKODO_BEACH, YAENE_PORT } from "@/lib/geo/points"

const OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

const HORIZONS = [
  { key: "TODAY", offsetHours: 0 },
  { key: "PLUS_24H", offsetHours: 24 },
  { key: "PLUS_72H", offsetHours: 72 },
  { key: "PLUS_7D", offsetHours: 168 },
] as const

type MarineResponse = {
  hourly?: {
    time?: string[]
    wave_height?: number[]
    wave_period?: number[]
    swell_wave_direction?: number[]
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

async function fetchWaveForPort(port: "底土" | "八重根", lat: number, lon: number) {
  const url = `${OPEN_METEO_MARINE_URL}?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,swell_wave_direction&timezone=Asia%2FTokyo`
  const { data } = await fetchJson<MarineResponse>(url)

  const times = data.hourly?.time ?? []
  const waveHeights = data.hourly?.wave_height ?? []
  const wavePeriods = data.hourly?.wave_period ?? []
  const swellDirections = data.hourly?.swell_wave_direction ?? []

  const now = new Date()
  const extracted = HORIZONS.map(({ key, offsetHours }) => {
    const target = new Date(now.getTime() + offsetHours * 60 * 60 * 1000)
    const index = times.length ? closestIndex(times, target) : -1
    return {
      horizon: key,
      port,
      index,
      time: index >= 0 ? times[index] : undefined,
      waveHeightM: index >= 0 ? waveHeights[index] : undefined,
      wavePeriodS: index >= 0 ? wavePeriods[index] : undefined,
      swellDirectionDeg: index >= 0 ? swellDirections[index] : undefined,
    }
  })

  return { raw: data, extracted }
}

export async function GET() {
  const sources = [
    {
      name: "Open-Meteo Marine",
      url: "https://open-meteo.com/en/docs/marine-weather-api",
    },
  ]

  try {
    const [sokodo, yaene] = await Promise.all([
      fetchWaveForPort("底土", SOKODO_BEACH.lat, SOKODO_BEACH.lon),
      fetchWaveForPort("八重根", YAENE_PORT.lat, YAENE_PORT.lon),
    ])

    const normalized: WeatherNormalizedItem[] = [...sokodo.extracted, ...yaene.extracted].map(
      (entry) => ({
        service: "WEATHER_WAVE",
        horizon: entry.horizon,
        port: entry.port,
        waveHeightM: entry.waveHeightM,
        wavePeriodS: entry.wavePeriodS,
        swellDirectionDeg: entry.swellDirectionDeg,
        time: entry.time,
        sourceUrls: ["https://open-meteo.com/en/docs/marine-weather-api"],
      })
    )

    const warnings = ["港ピンポイント観測ではなく近傍代表地点を使用"]

    return NextResponse.json(
      buildDebugEnvelope({
        ok: true,
        fetchedAt: new Date().toISOString(),
        sources,
        raw: {
          sokodo: sokodo.raw,
          yaene: yaene.raw,
        },
        extracted: {
          sokodo: sokodo.extracted,
          yaene: yaene.extracted,
        },
        normalized,
        warnings,
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
