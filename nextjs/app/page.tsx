"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RawViewer from "@/lib/components/RawViewer"
import DebugHeader from "@/lib/components/DebugHeader"
import type { DebugEnvelope } from "@/lib/debug/debugEnvelope"
import type { TransportNormalizedItem } from "@/lib/schema/transport"

const TAB_DEFS = [
  {
    key: "ana",
    label: "ANA",
    endpoint: "/api/fetch/ana",
    sources: [
      {
        name: "ODPT 出発",
        url: "https://api.odpt.org/api/v4/odpt:FlightInformationDeparture?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY",
      },
      {
        name: "ODPT 到着",
        url: "https://api.odpt.org/api/v4/odpt:FlightInformationArrival?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY",
      },
    ],
  },
  {
    key: "tokaikisen",
    label: "東海汽船",
    endpoint: "/api/fetch/tokaikisen",
    sources: [
      {
        name: "運航状況",
        url: "https://www.tokaikisen.co.jp/schedule/",
      },
      {
        name: "時刻表",
        url: "https://www.tokaikisen.co.jp/boarding/timetable/",
      },
    ],
  },
  {
    key: "umisora",
    label: "青ヶ島",
    endpoint: "/api/fetch/umisora",
    sources: [
      {
        name: "うみそら便 青ヶ島",
        url: "https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/",
      },
      {
        name: "伊豆諸島開発（参照）",
        url: "https://izu-syotou.jp/route01/",
      },
    ],
  },
  {
    key: "heli",
    label: "ヘリ",
    endpoint: "/api/fetch/umisora",
    sources: [
      {
        name: "うみそら便 青ヶ島",
        url: "https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/",
      },
      {
        name: "東京愛らんどシャトル（参照）",
        url: "https://tohoair-tal.jp/",
      },
      {
        name: "愛らんどシャトル時刻表（参照）",
        url: "https://tohoair-tal.jp/ext/timetable.html",
      },
    ],
  },
  {
    key: "business-hours",
    label: "営業日",
    endpoint: "/api/fetch/business-hours",
    sources: [
      {
        name: "Googleマップ 八丈ストア",
        url: "https://maps.app.goo.gl/z3mKL3S91tcQUxRM9",
      },
      {
        name: "Places API Place Details",
        url: "https://developers.google.com/maps/documentation/places/web-service/place-details",
      },
    ],
  },
]

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(TAB_DEFS[0].key)
  const [dataByTab, setDataByTab] = useState<
    Record<string, DebugEnvelope<TransportNormalizedItem> | null>
  >({})
  const [loadingTab, setLoadingTab] = useState<string | null>(null)
  const [loadingAll, setLoadingAll] = useState(false)

  const activeDef = TAB_DEFS.find((tab) => tab.key === activeTab) ?? TAB_DEFS[0]
  const activeData = dataByTab[activeDef.key]
  const normalizedItems = (activeData?.normalized ?? []) as TransportNormalizedItem[]
  const summaryItems = [
    {
      label: "運航ステータス",
      ok: normalizedItems.some((item) => Boolean(item.status)),
    },
    {
      label: "出発予定時刻",
      ok: normalizedItems.some((item) => Boolean(item.depPlanned)),
    },
    {
      label: "到着予定時刻",
      ok: normalizedItems.some((item) => Boolean(item.arrPlanned)),
    },
    {
      label: "遅延",
      ok: normalizedItems.some((item) => typeof item.delayMinutes === "number"),
    },
    {
      label: "見込み時刻",
      ok: normalizedItems.some((item) => Boolean(item.depEstimated || item.arrEstimated)),
    },
    {
      label: "備考",
      ok: normalizedItems.some((item) => Boolean(item.note)),
    },
    {
      label: "取得時刻",
      ok: Boolean(activeData?.fetchedAt),
    },
  ]

  const loadSaved = useCallback(async (keys: string[]) => {
    try {
      const params = new URLSearchParams({ keys: keys.join(",") })
      const response = await fetch(`/api/debug/read-report?${params.toString()}`, {
        cache: "no-store",
      })
      if (!response.ok) return {}
      const data = (await response.json()) as {
        ok: boolean
        records?: Record<string, { payload: DebugEnvelope<TransportNormalizedItem> }>
      }
      return data.records ?? {}
    } catch {
      return {}
    }
  }, [])

  const persistResult = async (
    key: string,
    endpoint: string,
    payload: DebugEnvelope<TransportNormalizedItem>
  ) => {
    try {
      await fetch("/api/debug/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, endpoint, payload }),
      })
    } catch {
      // ignore persistence errors in debug UI
    }
  }

  const handleRefresh = async () => {
    setLoadingTab(activeDef.key)
    try {
      const response = await fetch(activeDef.endpoint, { cache: "no-store" })
      const payload = (await response.json()) as DebugEnvelope<TransportNormalizedItem>
      setDataByTab((prev) => ({ ...prev, [activeDef.key]: payload }))
      await persistResult(activeDef.key, activeDef.endpoint, payload)
      const records = await loadSaved([activeDef.key])
      if (records[activeDef.key]?.payload) {
        setDataByTab((prev) => ({ ...prev, [activeDef.key]: records[activeDef.key].payload }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      const fallback: DebugEnvelope<TransportNormalizedItem> = {
        ok: false,
        fetchedAt: new Date().toISOString(),
        sources: activeDef.sources,
        raw: null,
        error: { message },
      }
      setDataByTab((prev) => ({ ...prev, [activeDef.key]: fallback }))
      await persistResult(activeDef.key, activeDef.endpoint, fallback)
      const records = await loadSaved([activeDef.key])
      if (records[activeDef.key]?.payload) {
        setDataByTab((prev) => ({ ...prev, [activeDef.key]: records[activeDef.key].payload }))
      }
    } finally {
      setLoadingTab(null)
    }
  }

  const handleRefreshAll = async () => {
    setLoadingAll(true)
    try {
      const results = await Promise.all(
        TAB_DEFS.map(async (tab) => {
          try {
            const response = await fetch(tab.endpoint, { cache: "no-store" })
            const payload = (await response.json()) as DebugEnvelope<TransportNormalizedItem>
            await persistResult(tab.key, tab.endpoint, payload)
            return [tab.key, payload] as const
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            const payload = {
              ok: false,
              fetchedAt: new Date().toISOString(),
              sources: tab.sources,
              raw: null,
              error: { message },
            } as DebugEnvelope<TransportNormalizedItem>
            await persistResult(tab.key, tab.endpoint, payload)
            return [
              tab.key,
              payload,
            ] as const
          }
        })
      )
      setDataByTab((prev) => {
        const next = { ...prev }
        for (const [key, payload] of results) {
          next[key] = payload
        }
        return next
      })
      const records = await loadSaved(TAB_DEFS.map((tab) => tab.key))
      if (Object.keys(records).length) {
        setDataByTab((prev) => {
          const next = { ...prev }
          for (const [key, record] of Object.entries(records)) {
            next[key] = record.payload
          }
          return next
        })
      }
    } finally {
      setLoadingAll(false)
    }
  }

  useEffect(() => {
    if (dataByTab[activeDef.key]) return
    let cancelled = false
    loadSaved([activeDef.key]).then((records) => {
      if (cancelled) return
      const record = records[activeDef.key]?.payload
      if (record) {
        setDataByTab((prev) => ({ ...prev, [activeDef.key]: record }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeDef.key, dataByTab, loadSaved])

  return (
    <div className="page">
      <DebugHeader
        title="交通 運航情報"
        eyebrow="技術検証"
        actions={
          <div className="header-actions">
            <button type="button" onClick={() => router.push("/pc-mock")}>
              PCモックへ
            </button>
            <button type="button" onClick={handleRefreshAll} disabled={loadingAll}>
              {loadingAll ? "Refreshing all..." : "Refresh all"}
            </button>
            <button type="button" onClick={handleRefresh} disabled={loadingTab === activeDef.key || loadingAll}>
              {loadingTab === activeDef.key ? "Refreshing..." : "Refresh"}
            </button>
          </div>
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
              <table className="data-table">
                <thead>
                  <tr>
                    <th>title</th>
                    <th>status</th>
                    <th>depPlanned</th>
                    <th>arrPlanned</th>
                    <th>depEstimated</th>
                    <th>arrEstimated</th>
                    <th>delay</th>
                    <th>port</th>
                    <th>note</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedItems.map((item, index) => (
                    <tr key={`${item.title}-${index}`}>
                      <td>{item.title}</td>
                      <td>{item.status ?? "-"}</td>
                      <td>{item.depPlanned ?? "-"}</td>
                      <td>{item.arrPlanned ?? "-"}</td>
                      <td>{item.depEstimated ?? "-"}</td>
                      <td>{item.arrEstimated ?? "-"}</td>
                      <td>{item.delayMinutes ?? "-"}</td>
                      <td>{item.port ?? "-"}</td>
                      <td>{item.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
