import { NextResponse } from "next/server"
import { DEBUG_REPORTS_TABLE, getSupabaseServer } from "@/lib/db/supabaseServer"

type SaveReportPayload = {
  key: string
  endpoint: string
  payload: unknown
}

const hasSupabaseConfig = Boolean(getSupabaseServer())

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveReportPayload
    if (!body?.key || !body?.endpoint) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    const record = {
      savedAt: new Date().toISOString(),
      endpoint: body.endpoint,
      payload: body.payload,
    }
    if (!hasSupabaseConfig) {
      return NextResponse.json(
        { ok: false, error: "Supabase configuration is missing." },
        { status: 503 }
      )
    }

    const client = getSupabaseServer()
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "Supabase client is not available." },
        { status: 503 }
      )
    }

    const { error } = await client
      .from(DEBUG_REPORTS_TABLE)
      .upsert(
        {
          key: body.key,
          endpoint: body.endpoint,
          payload: record.payload,
          saved_at: record.savedAt,
        },
        { onConflict: "key" }
      )
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, storage: "supabase" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
