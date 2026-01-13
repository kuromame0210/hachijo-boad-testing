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
  coverage?: {
    type: string
    [key: string]: boolean | string | number | null | undefined
  }
}

type ApiTestReport = {
  timestamp: string
  baseUrl: string
  results: ApiResult[]
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

export default async function TestPage() {
  const report = await loadReport()
  const requiredItems = [
    {
      title: "交通（ANA/東海汽船/うみそら便）",
      items: [
        "運航ステータス",
        "出発予定時刻",
        "到着予定時刻",
        "遅延（数値がある場合）",
        "見込み時刻（あれば）",
        "備考",
        "最終更新時刻",
      ],
    },
    {
      title: "Weather（波）",
      items: ["波高", "周期", "うねり向き", "時刻"],
    },
    {
      title: "Weather（風）",
      items: ["平均風速", "最大瞬間風速", "風向", "時刻"],
    },
    {
      title: "Weather（台風）",
      items: ["台風ID/名称/距離（あれば）", "台風なしの判定"],
    },
    {
      title: "営業日（Google Places）",
      items: ["本日の営業時間", "曜日ごとの通常営業時間", "特別営業時間/例外日（あれば）"],
    },
  ]

  const coverageRows = report?.results.flatMap((result) => {
    const coverage = result.coverage
    if (!coverage || !coverage.type || coverage.type === "unknown") return []
    const rowBase = {
      endpoint: result.endpoint,
      type: coverage.type,
    }
    return Object.entries(coverage)
      .filter(([key]) => key !== "type")
      .map(([key, value]) => ({
        ...rowBase,
        field: key,
        ok: Boolean(value),
      }))
  })

  return (
    <div className="page">
      <DebugHeader title="API Test Results" eyebrow="技術検証" />

      {!report ? (
        <div className="alert alert--warning">
          テスト結果が見つかりません。`node test/api/api-smoke.mjs` を実行してください。
        </div>
      ) : (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">サマリー</h2>
              <div className="panel-links">
                <span>timestamp: {report.timestamp}</span>
                <span>baseUrl: {report.baseUrl}</span>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <div className="pane">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>endpoint</th>
                    <th>status</th>
                    <th>ok</th>
                    <th>warnings</th>
                    <th>normalized</th>
                    <th>error</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((result) => (
                    <tr key={result.endpoint}>
                      <td>{result.endpoint}</td>
                      <td>{result.status}</td>
                      <td>{String(result.ok)}</td>
                      <td>{result.warnings}</td>
                      <td>{result.normalizedLength}</td>
                      <td>{result.errorMessage ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pane">
              <h3>Warnings</h3>
              {report.results.every((result) => result.warningsList.length === 0) ? (
                <p>警告はありません。</p>
              ) : (
                report.results.map((result) =>
                  result.warningsList.length ? (
                    <div key={result.endpoint} className="warning-block">
                      <h4>{result.endpoint}</h4>
                      <ul>
                        {result.warningsList.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )
              )}
            </div>
          </div>
          <div className="panel-body">
            <div className="pane">
              <h3>必須項目一覧</h3>
              {requiredItems.map((group) => (
                <div key={group.title} className="warning-block">
                  <h4>{group.title}</h4>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pane">
              <h3>項目カバレッジ</h3>
              {coverageRows && coverageRows.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>endpoint</th>
                      <th>type</th>
                      <th>field</th>
                      <th>ok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageRows.map((row, index) => (
                      <tr key={`${row.endpoint}-${row.field}-${index}`}>
                        <td>{row.endpoint}</td>
                        <td>{row.type}</td>
                        <td>{row.field}</td>
                        <td>{row.ok ? "OK" : "NG"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>項目カバレッジはまだありません。</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
