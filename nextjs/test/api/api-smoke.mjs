import path from "node:path"

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000"
const logsDir = path.resolve(process.cwd(), "./test/logs")
const reportPath = path.resolve(
  logsDir,
  process.env.API_SMOKE_REPORT ?? "api-test-results.md"
)

const endpoints = [
  "/api/fetch/tokaikisen",
  "/api/fetch/umisora",
  "/api/fetch/weather/wind",
  "/api/fetch/weather/wave",
  "/api/fetch/weather/typhoon",
]

function stringifyRaw(raw) {
  if (raw === null || raw === undefined) return ""
  if (typeof raw === "string") return raw
  try {
    return JSON.stringify(raw, null, 2)
  } catch {
    return "[unserializable raw]"
  }
}

async function checkEndpoint(endpoint) {
  const url = `${baseUrl}${endpoint}`
  try {
    const response = await fetch(url, { cache: "no-store" })
    const status = response.status
    const data = await response.json()
    const ok = data?.ok === true
    const warningsList = Array.isArray(data?.warnings) ? data.warnings : []
    const warnings = warningsList.length
    const normalizedLength = Array.isArray(data?.normalized) ? data.normalized.length : 0
    const errorMessage = data?.error?.message
    const rawSnippet =
      !ok || warnings > 0 ? stringifyRaw(data?.raw).slice(0, 800) : ""
    const coverage = buildCoverage(endpoint, data, warningsList)
    return {
      endpoint,
      status,
      ok,
      warnings,
      warningsList,
      normalizedLength,
      errorMessage,
      rawSnippet,
      coverage,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      endpoint,
      status: "ERR",
      ok: false,
      warnings: 0,
      warningsList: [],
      normalizedLength: 0,
      errorMessage: message,
      rawSnippet: "",
      coverage: { type: "unknown" },
    }
  }
}

function pad(value, length) {
  return String(value).padEnd(length)
}

function buildCoverage(endpoint, data, warningsList) {
  const normalized = Array.isArray(data?.normalized) ? data.normalized : []
  const has = (predicate) => normalized.some(predicate)
  const hasNumber = (value) => typeof value === "number" && Number.isFinite(value)

  if (endpoint.includes("/api/fetch/tokaikisen") || endpoint.includes("/api/fetch/umisora")) {
    return {
      type: "transport",
      status: has((item) => Boolean(item?.status)),
      depPlanned: has((item) => Boolean(item?.depPlanned)),
      arrPlanned: has((item) => Boolean(item?.arrPlanned)),
      estimated: has((item) => Boolean(item?.depEstimated || item?.arrEstimated)),
      delayMinutes: has((item) => hasNumber(item?.delayMinutes)),
      note: has((item) => Boolean(item?.note)),
      fetchedAt: Boolean(data?.fetchedAt),
    }
  }

  if (endpoint.includes("/api/fetch/weather/wave")) {
    return {
      type: "weather_wave",
      waveHeightM: has((item) => hasNumber(item?.waveHeightM)),
      wavePeriodS: has((item) => hasNumber(item?.wavePeriodS)),
      swellDirectionDeg: has((item) => hasNumber(item?.swellDirectionDeg)),
      time: has((item) => Boolean(item?.time)),
      fetchedAt: Boolean(data?.fetchedAt),
    }
  }

  if (endpoint.includes("/api/fetch/weather/wind")) {
    return {
      type: "weather_wind",
      windSpeedMs: has((item) => hasNumber(item?.windSpeedMs)),
      windGustMs: has((item) => hasNumber(item?.windGustMs)),
      windDirectionDeg: has((item) => hasNumber(item?.windDirectionDeg)),
      time: has((item) => Boolean(item?.time)),
      fetchedAt: Boolean(data?.fetchedAt),
    }
  }

  if (endpoint.includes("/api/fetch/weather/typhoon")) {
    return {
      type: "weather_typhoon",
      typhoonPresent: normalized.length > 0,
      typhoonName: has((item) => Boolean(item?.typhoonName)),
      typhoonId: has((item) => Boolean(item?.typhoonId)),
      typhoonDistanceKm: has((item) => hasNumber(item?.typhoonDistanceKm)),
      noTyphoonWarning: warningsList.some((warning) => warning.includes("台風情報")),
      fetchedAt: Boolean(data?.fetchedAt),
    }
  }

  return { type: "unknown" }
}

async function main() {
  const results = []
  for (const endpoint of endpoints) {
    results.push(await checkEndpoint(endpoint))
  }

  const headers = [
    pad("endpoint", 32),
    pad("status", 8),
    pad("ok", 6),
    pad("warnings", 10),
    pad("normalized", 11),
    "error",
  ]
  console.log(headers.join(" "))
  console.log("-".repeat(90))

  let hasFailure = false
  for (const result of results) {
    if (!result.ok) hasFailure = true
    console.log(
      [
        pad(result.endpoint, 32),
        pad(result.status, 8),
        pad(result.ok, 6),
        pad(result.warnings, 10),
        pad(result.normalizedLength, 11),
        result.errorMessage ?? "",
      ].join(" ")
    )
  }

  if (hasFailure) {
    process.exitCode = 1
  }

  const timestamp = new Date().toISOString()
  const lines = [
    "# API Smoke Test Results",
    "",
    `- timestamp: ${timestamp}`,
    `- baseUrl: ${baseUrl}`,
    "",
    "| endpoint | status | ok | warnings | normalized | error |",
    "| --- | --- | --- | --- | --- | --- |",
  ]

  for (const result of results) {
    lines.push(
      `| ${result.endpoint} | ${result.status} | ${result.ok} | ${result.warnings} | ${result.normalizedLength} | ${result.errorMessage ?? ""} |`
    )
  }

  const withRaw = results.filter((result) => result.rawSnippet)
  if (withRaw.length) {
    lines.push("", "## Raw Snippets (failed or warnings)", "")
    for (const result of withRaw) {
      lines.push(`### ${result.endpoint}`, "", "```text", result.rawSnippet, "```", "")
    }
  }

  try {
    const { mkdirSync, writeFileSync } = await import("node:fs")
    mkdirSync(logsDir, { recursive: true })
    writeFileSync(reportPath, lines.join("\n"), "utf8")
    const jsonPath = path.resolve(logsDir, "api-test-results.json")
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          timestamp,
          baseUrl,
          results: results.map((result) => ({
            endpoint: result.endpoint,
            status: result.status,
            ok: result.ok,
            warnings: result.warnings,
            warningsList: result.warningsList,
            normalizedLength: result.normalizedLength,
            errorMessage: result.errorMessage ?? null,
            coverage: result.coverage,
          })),
        },
        null,
        2
      ),
      "utf8"
    )
  } catch (error) {
    console.error("Failed to write report:", error)
  }
}

main()
