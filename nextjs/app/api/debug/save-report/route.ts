import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

type SaveReportPayload = {
  key: string
  endpoint: string
  payload: unknown
}

const LOG_DIR = path.resolve(process.cwd(), "test/logs/live")
const TABLE_NAME = process.env.DEBUG_REPORTS_TABLE ?? "hachijo_debug_reports"
const hasSupabaseConfig = Boolean(
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
)

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

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
    if (hasSupabaseConfig) {
      const client = createSupabaseClient()
      if (client) {
        const { error } = await client
          .from(TABLE_NAME)
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
      }
    }

    await mkdir(LOG_DIR, { recursive: true })
    const filePath = path.join(LOG_DIR, `${body.key}.json`)
    await writeFile(filePath, JSON.stringify(record, null, 2), "utf8")

    return NextResponse.json({ ok: true, storage: "file" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
