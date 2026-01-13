import path from "node:path"
import { mkdirSync, writeFileSync } from "node:fs"

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000"
const outputDir = path.resolve(process.cwd(), "./test/logs/html")

const targets = [
  { endpoint: "/api/fetch/tokaikisen", filename: "tokaikisen.html" },
  { endpoint: "/api/fetch/umisora", filename: "umisora.html" },
]

async function dumpHtml(endpoint, filename) {
  const url = `${baseUrl}${endpoint}`
  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()
  const raw = typeof data?.raw === "string" ? data.raw : ""
  return { endpoint, filename, ok: data?.ok === true, rawLength: raw.length, raw }
}

async function main() {
  mkdirSync(outputDir, { recursive: true })
  for (const target of targets) {
    const result = await dumpHtml(target.endpoint, target.filename)
    const filePath = path.join(outputDir, target.filename)
    writeFileSync(filePath, result.raw, "utf8")
    console.log(`== ${result.endpoint} ==`)
    console.log("ok:", result.ok)
    console.log("rawLength:", result.rawLength)
    console.log("saved:", filePath)
    console.log("")
  }
}

main()
