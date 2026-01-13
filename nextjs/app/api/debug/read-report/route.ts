import { NextResponse } from "next/server"
import { DEBUG_REPORTS_TABLE, getSupabaseConfig, getSupabaseServer } from "@/lib/db/supabaseServer"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const key = url.searchParams.get("key")
    const keysParam = url.searchParams.get("keys")
    const keys = keysParam ? keysParam.split(",").map((item) => item.trim()) : []
    if (key) keys.push(key)
    const uniqueKeys = Array.from(new Set(keys)).filter(Boolean)
    if (!uniqueKeys.length) {
      return NextResponse.json({ ok: false, error: "Missing key parameter." }, { status: 400 })
    }

    const client = getSupabaseServer()
    if (!client) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase configuration is missing.",
          details: getSupabaseConfig(),
        },
        { status: 503 }
      )
    }

    const { data, error } = await client
      .from(DEBUG_REPORTS_TABLE)
      .select("key,payload,saved_at")
      .in("key", uniqueKeys)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const records = (data ?? []).reduce<Record<string, { payload: unknown; savedAt: string }>>(
      (acc, row) => {
        acc[row.key] = {
          payload: row.payload,
          savedAt: row.saved_at,
        }
        return acc
      },
      {}
    )

    return NextResponse.json({ ok: true, records })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
