const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000"

const endpoints = [
  "/api/fetch/tokaikisen",
  "/api/fetch/umisora",
  "/api/fetch/weather/typhoon",
]

async function fetchWarnings(endpoint) {
  const url = `${baseUrl}${endpoint}`
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  return {
    endpoint,
    ok: data?.ok === true,
    warnings: data?.warnings ?? [],
    error: data?.error?.message ?? null,
  }
}

async function main() {
  for (const endpoint of endpoints) {
    const result = await fetchWarnings(endpoint)
    console.log(`== ${result.endpoint} ==`)
    console.log("ok:", result.ok)
    console.log("warnings:", Array.isArray(result.warnings) ? result.warnings : [])
    console.log("error:", result.error)
    console.log("")
  }
}

main()
