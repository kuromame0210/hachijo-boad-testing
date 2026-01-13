import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY

export const DEBUG_REPORTS_TABLE =
  process.env.DEBUG_REPORTS_TABLE ?? "hachijo_debug_reports"

export function getSupabaseConfig() {
  return {
    hasUrl: Boolean(SUPABASE_URL),
    hasKey: Boolean(SUPABASE_KEY),
    table: DEBUG_REPORTS_TABLE,
  }
}

export function getSupabaseServer() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  })
}
