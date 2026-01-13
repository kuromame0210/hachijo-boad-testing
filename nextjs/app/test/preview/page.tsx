import { readFile } from "node:fs/promises"
import path from "node:path"
import DebugHeader from "@/lib/components/DebugHeader"

type ApiResult = {
  endpoint: string
  status: number | string
  ok: boolean
  warnings: number
  warningsList: string[]
  normalizedLength: number
  errorMessage: string | null
}

type ApiTestReport = {
  timestamp: string
  baseUrl: string
  results: ApiResult[]
}

type TransportItem = {
  service?: string
  title?: string
  status?: string
  depPlanned?: string
  arrPlanned?: string
  depEstimated?: string
  arrEstimated?: string
  delayMinutes?: number
  port?: string
  note?: string
}

type WeatherItem = {
  service?: string
  horizon?: string
  port?: string
  point?: string
  waveHeightM?: number
  wavePeriodS?: number
  swellDirectionDeg?: number
  windSpeedMs?: number
  windGustMs?: number
  windDirectionDeg?: number
  typhoonId?: string
  typhoonName?: string
  typhoonDistanceKm?: number
  time?: string
  note?: string
}

type DebugEnvelope<T> = {
  ok: boolean
  fetchedAt: string
  normalized?: T[]
}

const REPORT_PATH = path.resolve(process.cwd(), "test/logs/api-test-results.json")

async function loadReport(): Promise<ApiTestReport | null> {
  try {
    const content = await readFile(REPORT_PATH, "utf8")
    return JSON.parse(content) as ApiTestReport
  } catch {
    return null
  }
}

async function loadEndpoint<T>(endpoint: string): Promise<DebugEnvelope<T> | null> {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, { cache: "no-store" })
    if (!response.ok) return null
    return (await response.json()) as DebugEnvelope<T>
  } catch {
    return null
  }
}

export default async function TestPreviewPage() {
  const report = await loadReport()
  const transportData = await Promise.all([
    loadEndpoint<TransportItem>("/api/fetch/tokaikisen"),
    loadEndpoint<TransportItem>("/api/fetch/umisora"),
  ])
  const weatherData = await Promise.all([
    loadEndpoint<WeatherItem>("/api/fetch/weather/wind"),
    loadEndpoint<WeatherItem>("/api/fetch/weather/wave"),
    loadEndpoint<WeatherItem>("/api/fetch/weather/typhoon"),
  ])

  const transportItems = transportData.flatMap((entry) => entry?.normalized ?? []).slice(0, 10)
  const weatherItems = weatherData.flatMap((entry) => entry?.normalized ?? []).slice(0, 12)

  const allTransportItems = transportData.flatMap((entry) => entry?.normalized ?? [])
  const allWeatherItems = weatherData.flatMap((entry) => entry?.normalized ?? [])

  const pickValue = <T,>(
    items: T[],
    predicate: (item: T) => boolean,
    getter: (item: T) => string
  ) => {
    const found = items.find(predicate)
    return found ? getter(found) : "-"
  }

  const transportSample = {
    status: pickValue(
      allTransportItems,
      (item) => Boolean(item.status),
      (item) => item.status ?? "-"
    ),
    depPlanned: pickValue(
      allTransportItems,
      (item) => Boolean(item.depPlanned),
      (item) => item.depPlanned ?? "-"
    ),
    arrPlanned: pickValue(
      allTransportItems,
      (item) => Boolean(item.arrPlanned),
      (item) => item.arrPlanned ?? "-"
    ),
    delay: pickValue(
      allTransportItems,
      (item) => typeof item.delayMinutes === "number",
      (item) => String(item.delayMinutes)
    ),
    estimated: pickValue(
      allTransportItems,
      (item) => Boolean(item.depEstimated || item.arrEstimated),
      (item) => item.depEstimated ?? item.arrEstimated ?? "-"
    ),
    note: pickValue(
      allTransportItems,
      (item) => Boolean(item.note),
      (item) => item.note ?? "-"
    ),
    fetchedAt: pickValue(
      transportData,
      (item) => Boolean(item?.fetchedAt),
      (item) => item?.fetchedAt ?? "-"
    ),
  }

  const waveSample = {
    waveHeightM: pickValue(
      allWeatherItems,
      (item) => typeof item.waveHeightM === "number",
      (item) => String(item.waveHeightM)
    ),
    wavePeriodS: pickValue(
      allWeatherItems,
      (item) => typeof item.wavePeriodS === "number",
      (item) => String(item.wavePeriodS)
    ),
    swellDirectionDeg: pickValue(
      allWeatherItems,
      (item) => typeof item.swellDirectionDeg === "number",
      (item) => String(item.swellDirectionDeg)
    ),
    time: pickValue(
      allWeatherItems,
      (item) => Boolean(item.time),
      (item) => item.time ?? "-"
    ),
  }

  const windSample = {
    windSpeedMs: pickValue(
      allWeatherItems,
      (item) => typeof item.windSpeedMs === "number",
      (item) => String(item.windSpeedMs)
    ),
    windGustMs: pickValue(
      allWeatherItems,
      (item) => typeof item.windGustMs === "number",
      (item) => String(item.windGustMs)
    ),
    windDirectionDeg: pickValue(
      allWeatherItems,
      (item) => typeof item.windDirectionDeg === "number",
      (item) => String(item.windDirectionDeg)
    ),
    time: pickValue(
      allWeatherItems,
      (item) => Boolean(item.time),
      (item) => item.time ?? "-"
    ),
  }

  const typhoonSample = {
    name: pickValue(
      allWeatherItems,
      (item) => Boolean(item.typhoonName || item.typhoonId),
      (item) => item.typhoonName ?? item.typhoonId ?? "-"
    ),
    distance: pickValue(
      allWeatherItems,
      (item) => typeof item.typhoonDistanceKm === "number",
      (item) => String(item.typhoonDistanceKm)
    ),
    note:
      allWeatherItems.some((item) => item.service === "WEATHER_TYPHOON") &&
      allWeatherItems.some((item) => item.typhoonName || item.typhoonId)
        ? "-"
        : "台風なし",
  }

  const transportChecklist = [
    "運航ステータス",
    "出発予定時刻",
    "到着予定時刻",
    "遅延（数値がある場合）",
    "見込み時刻（あれば）",
    "備考",
    "最終更新時刻",
  ]
  const weatherChecklist = [
    "波: 波高 / 周期 / うねり向き / 時刻",
    "風: 平均風速 / 最大瞬間風速 / 風向 / 時刻",
    "台風: 台風ID/名称/距離（あれば） / 台風なし判定",
  ]

  return (
    <div className="page">
      <DebugHeader title="Test Preview" eyebrow="技術検証" />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">項目チェックリスト</h2>
            <div className="panel-links">
              <span>timestamp: {report?.timestamp ?? "-"}</span>
              <span>baseUrl: {report?.baseUrl ?? "-"}</span>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="pane">
            <h3>交通</h3>
            <ul className="summary-list">
              {transportChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pane">
            <h3>Weather</h3>
            <ul className="summary-list">
              {weatherChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">必須項目の実データ</h2>
          </div>
        </div>
        <div className="panel-body">
          <div className="pane">
            <h3>交通</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <th>運航ステータス</th>
                  <td>{transportSample.status}</td>
                </tr>
                <tr>
                  <th>出発予定時刻</th>
                  <td>{transportSample.depPlanned}</td>
                </tr>
                <tr>
                  <th>到着予定時刻</th>
                  <td>{transportSample.arrPlanned}</td>
                </tr>
                <tr>
                  <th>遅延</th>
                  <td>{transportSample.delay}</td>
                </tr>
                <tr>
                  <th>見込み時刻</th>
                  <td>{transportSample.estimated}</td>
                </tr>
                <tr>
                  <th>備考</th>
                  <td>{transportSample.note}</td>
                </tr>
                <tr>
                  <th>最終更新時刻</th>
                  <td>{transportSample.fetchedAt}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pane">
            <h3>Weather</h3>
            <table className="data-table">
              <tbody>
                <tr>
                  <th>波高</th>
                  <td>{waveSample.waveHeightM}</td>
                </tr>
                <tr>
                  <th>周期</th>
                  <td>{waveSample.wavePeriodS}</td>
                </tr>
                <tr>
                  <th>うねり向き</th>
                  <td>{waveSample.swellDirectionDeg}</td>
                </tr>
                <tr>
                  <th>波の時刻</th>
                  <td>{waveSample.time}</td>
                </tr>
                <tr>
                  <th>平均風速</th>
                  <td>{windSample.windSpeedMs}</td>
                </tr>
                <tr>
                  <th>最大瞬間風速</th>
                  <td>{windSample.windGustMs}</td>
                </tr>
                <tr>
                  <th>風向</th>
                  <td>{windSample.windDirectionDeg}</td>
                </tr>
                <tr>
                  <th>風の時刻</th>
                  <td>{windSample.time}</td>
                </tr>
                <tr>
                  <th>台風</th>
                  <td>{typhoonSample.name}</td>
                </tr>
                <tr>
                  <th>台風距離</th>
                  <td>{typhoonSample.distance}</td>
                </tr>
                <tr>
                  <th>台風判定</th>
                  <td>{typhoonSample.note}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">交通サンプル</h2>
            <div className="panel-links">
              <span>sample count: {transportItems.length}</span>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="pane">
            <table className="data-table">
              <thead>
                <tr>
                  <th>title</th>
                  <th>status</th>
                  <th>depPlanned</th>
                  <th>arrPlanned</th>
                  <th>estimated</th>
                  <th>delay</th>
                  <th>port</th>
                  <th>note</th>
                </tr>
              </thead>
              <tbody>
                {transportItems.map((item, index) => (
                  <tr key={`${item.title ?? "transport"}-${index}`}>
                    <td>{item.title ?? "-"}</td>
                    <td>{item.status ?? "-"}</td>
                    <td>{item.depPlanned ?? "-"}</td>
                    <td>{item.arrPlanned ?? "-"}</td>
                    <td>{item.depEstimated ?? item.arrEstimated ?? "-"}</td>
                    <td>{item.delayMinutes ?? "-"}</td>
                    <td>{item.port ?? "-"}</td>
                    <td>{item.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Weatherサンプル</h2>
            <div className="panel-links">
              <span>sample count: {weatherItems.length}</span>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="pane">
            <table className="data-table">
              <thead>
                <tr>
                  <th>service</th>
                  <th>horizon</th>
                  <th>point/port</th>
                  <th>waveHeightM</th>
                  <th>wavePeriodS</th>
                  <th>swellDirectionDeg</th>
                  <th>windSpeedMs</th>
                  <th>windGustMs</th>
                  <th>windDirectionDeg</th>
                  <th>typhoon</th>
                  <th>time</th>
                </tr>
              </thead>
              <tbody>
                {weatherItems.map((item, index) => (
                  <tr key={`${item.service ?? "weather"}-${index}`}>
                    <td>{item.service ?? "-"}</td>
                    <td>{item.horizon ?? "-"}</td>
                    <td>{item.port ?? item.point ?? "-"}</td>
                    <td>{item.waveHeightM ?? "-"}</td>
                    <td>{item.wavePeriodS ?? "-"}</td>
                    <td>{item.swellDirectionDeg ?? "-"}</td>
                    <td>{item.windSpeedMs ?? "-"}</td>
                    <td>{item.windGustMs ?? "-"}</td>
                    <td>{item.windDirectionDeg ?? "-"}</td>
                    <td>{item.typhoonName ?? item.typhoonId ?? "-"}</td>
                    <td>{item.time ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
