import { NextResponse } from "next/server"
import type { DebugEnvelope } from "@/lib/debug/debugEnvelope"

export const runtime = "nodejs"

const TARGETS = [
  { key: "tokaikisen", endpoint: "/api/fetch/tokaikisen" },
  { key: "umisora", endpoint: "/api/fetch/umisora" },
  { key: "wave", endpoint: "/api/fetch/weather/wave" },
  { key: "wind", endpoint: "/api/fetch/weather/wind" },
  { key: "typhoon", endpoint: "/api/fetch/weather/typhoon" },
] as const

type RefreshResult = {
  fetchOk: boolean
  saveOk: boolean
  fetchedAt?: string
  error?: string
}

function buildFailureEnvelope(message: string): DebugEnvelope {
  return {
    ok: false,
    fetchedAt: new Date().toISOString(),
    sources: [],
    raw: null,
    error: { message },
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const origin = new URL(request.url).origin
  const results: Record<string, RefreshResult> = {}

  await Promise.all(
    TARGETS.map(async (target) => {
      let payload: DebugEnvelope
      let fetchOk = false
      let saveOk = false
      try {
        const response = await fetch(`${origin}${target.endpoint}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`fetch failed: ${response.status}`)
        }
        payload = (await response.json()) as DebugEnvelope
        fetchOk = Boolean(payload.ok)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        payload = buildFailureEnvelope(message)
      }

      try {
        const saveResponse = await fetch(`${origin}/api/debug/save-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: target.key,
            endpoint: target.endpoint,
            payload,
          }),
        })
        saveOk = saveResponse.ok
      } catch {
        saveOk = false
      }

      results[target.key] = {
        fetchOk,
        saveOk,
        fetchedAt: payload.fetchedAt,
        error: payload.error?.message,
      }
    })
  )

  return NextResponse.json({
    ok: true,
    results,
    tookMs: Date.now() - startedAt,
  })
}
