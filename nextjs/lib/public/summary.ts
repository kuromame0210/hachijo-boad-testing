import { headers } from "next/headers"

export type DebugEnvelope<T> = {
  ok: boolean
  fetchedAt: string
  normalized?: T[]
  warnings?: string[]
  error?: {
    message: string
  }
}

export type StatusTone = "ok" | "warn" | "bad" | "muted"

export type StatusMeta = {
  code: string
  label: string
  tone: StatusTone
}

const STATUS_PRIORITY = [
  "CANCELLED",
  "SUSPENDED",
  "DELAYED",
  "UNKNOWN",
  "ON_TIME",
  "OPEN",
  "CLOSED",
] as const

export function pickPrimaryStatus(items: { status?: string }[]): StatusMeta {
  const codes = items.map((item) => item.status).filter(Boolean) as string[]
  const code =
    STATUS_PRIORITY.find((status) => codes.includes(status)) ??
    (codes[0] ?? "UNKNOWN")

  switch (code) {
    case "CANCELLED":
      return { code, label: "欠航", tone: "bad" }
    case "SUSPENDED":
      return { code, label: "条件付き", tone: "warn" }
    case "DELAYED":
      return { code, label: "遅延", tone: "warn" }
    case "ON_TIME":
      return { code, label: "運航", tone: "ok" }
    case "OPEN":
      return { code, label: "営業中", tone: "ok" }
    case "CLOSED":
      return { code, label: "休業", tone: "bad" }
    default:
      return { code: "UNKNOWN", label: "情報なし", tone: "muted" }
  }
}

export async function fetchEnvelope<T>(endpoint: string): Promise<DebugEnvelope<T> | null> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}${endpoint}`, { cache: "no-store" })
    if (response.ok) {
      return (await response.json()) as DebugEnvelope<T>
    }
  } catch {
    // fall through
  }
  try {
    const response = await fetch(endpoint, { cache: "no-store" })
    if (response.ok) {
      return (await response.json()) as DebugEnvelope<T>
    }
  } catch {
    // fall through
  }
  return null
}

function getBaseUrl() {
  const env =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.BASE_URL ??
    process.env.VERCEL_URL
  if (env) {
    return env.startsWith("http") ? env : `https://${env}`
  }
  const headerList = headers()
  const proto = headerList.get("x-forwarded-proto") ?? "http"
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}
