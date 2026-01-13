"use client"

import { useState } from "react"
import RawViewer from "@/lib/components/RawViewer"
import DebugHeader from "@/lib/components/DebugHeader"
import type { DebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { WeatherNormalizedItem } from "@/lib/schema/weather"

const TAB_DEFS = [
  {
    key: "wave",
    label: "波",
    endpoint: "/api/fetch/weather/wave",
    sources: [
      {
        name: "Open-Meteo Marine",
        url: "https://open-meteo.com/en/docs/marine-weather-api",
      },
    ],
  },
  {
    key: "wind",
    label: "風",
    endpoint: "/api/fetch/weather/wind",
    sources: [
      {
        name: "Open-Meteo Forecast",
        url: "https://open-meteo.com/en/docs",
      },
    ],
  },
  {
    key: "typhoon",
    label: "台風",
    endpoint: "/api/fetch/weather/typhoon",
    sources: [
      {
        name: "気象庁XML 技術資料",
        url: "https://xml.kishou.go.jp/tec_material.html",
      },
      {
        name: "気象庁 電文仕様（PDF）",
        url: "https://www.data.jma.go.jp/suishin/shiyou/pdf/no11902",
      },
      {
        name: "防災気象情報（地図）",
        url: "https://www.jma.go.jp/bosai/map.html",
      },
    ],
  },
]

export default function WeatherPage() {
  const [activeTab, setActiveTab] = useState(TAB_DEFS[0].key)
  const [dataByTab, setDataByTab] = useState<
    Record<string, DebugEnvelope<WeatherNormalizedItem> | null>
  >({})
  const [loadingTab, setLoadingTab] = useState<string | null>(null)

  const activeDef = TAB_DEFS.find((tab) => tab.key === activeTab) ?? TAB_DEFS[0]
  const activeData = dataByTab[activeDef.key]
  const normalizedItems = (activeData?.normalized ?? []) as WeatherNormalizedItem[]

  const waveItems = normalizedItems.filter((item) => item.service === "WEATHER_WAVE")
  const windItems = normalizedItems.filter((item) => item.service === "WEATHER_WIND")
  const typhoonItems = normalizedItems.filter((item) => item.service === "WEATHER_TYPHOON")
  const summaryItems = [
    {
      label: "波: 波高",
      ok: waveItems.some((item) => typeof item.waveHeightM === "number"),
    },
    {
      label: "波: 周期",
      ok: waveItems.some((item) => typeof item.wavePeriodS === "number"),
    },
    {
      label: "波: うねり向き",
      ok: waveItems.some((item) => typeof item.swellDirectionDeg === "number"),
    },
    {
      label: "波: 時刻",
      ok: waveItems.some((item) => Boolean(item.time)),
    },
    {
      label: "風: 平均風速",
      ok: windItems.some((item) => typeof item.windSpeedMs === "number"),
    },
    {
      label: "風: 最大瞬間風速",
      ok: windItems.some((item) => typeof item.windGustMs === "number"),
    },
    {
      label: "風: 風向",
      ok: windItems.some((item) => typeof item.windDirectionDeg === "number"),
    },
    {
      label: "風: 時刻",
      ok: windItems.some((item) => Boolean(item.time)),
    },
    {
      label: "台風: 情報有無",
      ok: typhoonItems.length > 0 || (activeData?.warnings ?? []).some((w) => w.includes("台風情報")),
    },
    {
      label: "取得時刻",
      ok: Boolean(activeData?.fetchedAt),
    },
  ]

  const handleRefresh = async () => {
    setLoadingTab(activeDef.key)
    try {
      const response = await fetch(activeDef.endpoint, { cache: "no-store" })
      const payload = (await response.json()) as DebugEnvelope<WeatherNormalizedItem>
      setDataByTab((prev) => ({ ...prev, [activeDef.key]: payload }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setDataByTab((prev) => ({
        ...prev,
        [activeDef.key]: {
          ok: false,
          fetchedAt: new Date().toISOString(),
          sources: activeDef.sources,
          raw: null,
          error: { message },
        },
      }))
    } finally {
      setLoadingTab(null)
    }
  }

  return (
    <div className="page">
      <DebugHeader
        title="Weather"
        eyebrow="技術検証"
        actions={
          <button type="button" onClick={handleRefresh} disabled={loadingTab === activeDef.key}>
            {loadingTab === activeDef.key ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="tabs">
        {TAB_DEFS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? "tab tab--active" : "tab"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{activeDef.label}</h2>
            <div className="panel-links">
              {activeDef.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
              ))}
            </div>
          </div>
          <div className="panel-meta">
            <span className="badge">fetchedAt</span>
            <span>{activeData?.fetchedAt ?? "-"}</span>
          </div>
        </div>

        <div className="summary-grid">
          {summaryItems.map((item) => (
            <div key={item.label} className="summary-item">
              <span className="summary-label">{item.label}</span>
              <span className={item.ok ? "summary-status summary-status--ok" : "summary-status summary-status--ng"}>
                {item.ok ? "OK" : "NG"}
              </span>
            </div>
          ))}
        </div>

        {activeData?.error?.message && (
          <div className="alert alert--error">{activeData.error.message}</div>
        )}

        {activeData?.warnings && activeData.warnings.length > 0 && (
          <div className="alert alert--warning">
            {activeData.warnings.join(" / ")}
          </div>
        )}

        <div className="panel-body">
          <div className="pane">
            <h3>Normalized</h3>
            {normalizedItems.length ? (
              <>
                {waveItems.length > 0 && (
                  <>
                    <h4>Wave</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>horizon</th>
                          <th>port</th>
                          <th>waveHeightM</th>
                          <th>wavePeriodS</th>
                          <th>swellDirectionDeg</th>
                          <th>time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waveItems.map((item, index) => (
                          <tr key={`${item.horizon}-${item.port}-${index}`}>
                            <td>{item.horizon}</td>
                            <td>{item.port ?? "-"}</td>
                            <td>{item.waveHeightM ?? "-"}</td>
                            <td>{item.wavePeriodS ?? "-"}</td>
                            <td>{item.swellDirectionDeg ?? "-"}</td>
                            <td>{item.time ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {windItems.length > 0 && (
                  <>
                    <h4>Wind</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>horizon</th>
                          <th>windSpeedMs</th>
                          <th>windGustMs</th>
                          <th>windDirectionDeg</th>
                          <th>time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {windItems.map((item, index) => (
                          <tr key={`${item.horizon}-${index}`}>
                            <td>{item.horizon}</td>
                            <td>{item.windSpeedMs ?? "-"}</td>
                            <td>{item.windGustMs ?? "-"}</td>
                            <td>{item.windDirectionDeg ?? "-"}</td>
                            <td>{item.time ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {typhoonItems.length > 0 && (
                  <>
                    <h4>Typhoon</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>horizon</th>
                          <th>typhoonId</th>
                          <th>typhoonName</th>
                          <th>typhoonDistanceKm</th>
                          <th>time</th>
                          <th>note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typhoonItems.map((item, index) => (
                          <tr key={`${item.typhoonId ?? "typhoon"}-${index}`}>
                            <td>{item.horizon}</td>
                            <td>{item.typhoonId ?? "-"}</td>
                            <td>{item.typhoonName ?? "-"}</td>
                            <td>{item.typhoonDistanceKm ?? "-"}</td>
                            <td>{item.time ?? "-"}</td>
                            <td>{item.note ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            ) : (
              <p>normalized が空です。</p>
            )}
            <h3>Normalized (raw)</h3>
            <pre>
              <code>{JSON.stringify(normalizedItems, null, 2)}</code>
            </pre>
            <h3>Extracted</h3>
            <pre>
              <code>{JSON.stringify(activeData?.extracted ?? null, null, 2)}</code>
            </pre>
          </div>
          <div className="pane">
            <RawViewer raw={activeData?.raw ?? null} />
          </div>
        </div>
      </section>
    </div>
  )
}
