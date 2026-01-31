"use client"

import { useEffect, useState } from "react"
import styles from "./pc-mock.module.css"
import type { TransportNormalizedItem, TransportStatus } from "@/lib/schema/transport"

const flightStatuses = [
  { id: "ANA1891", label: "就航", tone: "ok" },
  { id: "ANA1893", label: "条件付き", tone: "warn" },
  { id: "ANA1895", label: "欠航", tone: "bad" },
]

const fallbackShipStatuses = [
  { id: "往路", label: "就航", tone: "ok" },
  { id: "復路", label: "条件付き", tone: "warn" },
]

const fallbackHeliStatuses = [
  { id: "八→青", label: "就航", tone: "ok" },
  { id: "青→八", label: "欠航", tone: "bad" },
  { id: "八→御", label: "条件付き", tone: "warn" },
  { id: "御→八", label: "就航", tone: "ok" },
]

function StatusDot({ tone }: { tone: "ok" | "warn" | "bad" }) {
  return <span className={`${styles.statusDot} ${styles[`statusDot${tone}`]}`} />
}

type StatusTone = "ok" | "warn" | "bad"

const STATUS_LABELS: Record<StatusTone, string> = {
  ok: "就航",
  warn: "条件付き",
  bad: "欠航",
}

function toneFromStatusText(statusText?: string, status?: TransportStatus): StatusTone | null {
  if (statusText) {
    if (statusText.includes("欠航") || statusText.includes("運休")) return "bad"
    if (statusText.includes("条件") || statusText.includes("調査") || statusText.includes("遅延"))
      return "warn"
    if (statusText.includes("運航") || statusText.includes("就航")) return "ok"
  }
  switch (status) {
    case "CANCELLED":
    case "CLOSED":
      return "bad"
    case "SUSPENDED":
    case "DELAYED":
      return "warn"
    case "ON_TIME":
    case "OPEN":
      return "ok"
    default:
      return null
  }
}

function extractPortsFromTitle(title?: string) {
  if (!title) return { depPort: undefined, arrPort: undefined }
  const parts = title.split(" / ")
  if (parts.length >= 4) {
    return { depPort: parts[1], arrPort: parts[3] }
  }
  return { depPort: undefined, arrPort: undefined }
}

function extractPortsFromPortField(port?: string) {
  if (!port) return { depPort: undefined, arrPort: undefined }
  const parts = port.split(" / ")
  if (parts.length >= 2) {
    return { depPort: parts[0], arrPort: parts[1] }
  }
  return { depPort: undefined, arrPort: undefined }
}

function pickShipByDirection(items: TransportNormalizedItem[], direction: "outbound" | "inbound") {
  const isOutbound = direction === "outbound"
  const byPort = items.find((item) => {
    const { depPort, arrPort } = extractPortsFromTitle(item.title)
    if (isOutbound) return Boolean(arrPort?.includes("八丈"))
    return Boolean(depPort?.includes("八丈"))
  })
  if (byPort) return byPort

  const keywords = isOutbound
    ? ["八丈島行き", "東京発", "竹芝発", "東京→", "東京-八丈", "東京～八丈"]
    : ["八丈島発", "八丈→", "八丈-東京", "八丈～東京"]
  return items.find((item) => keywords.some((word) => item.title.includes(word))) ?? null
}

function buildShipStatuses(items: TransportNormalizedItem[]) {
  const next = fallbackShipStatuses.map((item) => ({ ...item }))
  const outbound = pickShipByDirection(items, "outbound")
  const inbound = pickShipByDirection(items, "inbound")

  const applyItem = (index: number, item: TransportNormalizedItem | null) => {
    if (!item) return
    const tone = toneFromStatusText(item.statusText, item.status)
    if (!tone) return
    next[index] = {
      ...next[index],
      label: STATUS_LABELS[tone],
      tone,
    }
  }

  applyItem(0, outbound)
  applyItem(1, inbound)
  return next
}

function buildHeliStatuses(items: TransportNormalizedItem[]) {
  const next = fallbackHeliStatuses.map((item) => ({ ...item }))
  const applyItem = (index: number, item: TransportNormalizedItem | null) => {
    if (!item) return
    const tone = toneFromStatusText(item.statusText, item.status)
    if (!tone) return
    next[index] = {
      ...next[index],
      label: STATUS_LABELS[tone],
      tone,
    }
  }

  const outbound = items.find((item) => {
    const { depPort, arrPort } = extractPortsFromPortField(item.port)
    return Boolean(depPort?.includes("八丈")) && Boolean(arrPort?.includes("青ヶ島"))
  })
  const inbound = items.find((item) => {
    const { depPort, arrPort } = extractPortsFromPortField(item.port)
    return Boolean(depPort?.includes("青ヶ島")) && Boolean(arrPort?.includes("八丈"))
  })

  applyItem(0, outbound ?? null)
  applyItem(1, inbound ?? null)
  return next
}

export default function PcMockPage() {
  const [now, setNow] = useState(() => new Date())
  const [shipStatuses, setShipStatuses] = useState(fallbackShipStatuses)
  const [heliStatuses, setHeliStatuses] = useState(fallbackHeliStatuses)

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const timer = setInterval(tick, 30 * 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadShipStatuses = async () => {
      try {
        const response = await fetch("/api/debug/read-report?key=tokaikisen", {
          cache: "no-store",
        })
        if (!response.ok) return
        const data = (await response.json()) as {
          ok: boolean
          records?: Record<string, { payload?: { normalized?: TransportNormalizedItem[] } }>
        }
        const items = data.records?.tokaikisen?.payload?.normalized ?? []
        if (cancelled || items.length === 0) return
        setShipStatuses(buildShipStatuses(items))
      } catch {
        // keep fallback
      }
    }
    loadShipStatuses()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadHeliStatuses = async () => {
      try {
        const response = await fetch("/api/debug/read-report?key=umisora", {
          cache: "no-store",
        })
        if (!response.ok) return
        const data = (await response.json()) as {
          ok: boolean
          records?: Record<string, { payload?: { normalized?: TransportNormalizedItem[] } }>
        }
        const items = data.records?.umisora?.payload?.normalized ?? []
        if (cancelled || items.length === 0) return
        setHeliStatuses(buildHeliStatuses(items))
      } catch {
        // keep fallback
      }
    }
    loadHeliStatuses()
    return () => {
      cancelled = true
    }
  }, [])

  const dateLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(now)})`
  const timeLabel = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now)

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.topBar}>
          <div className={styles.topLeft} aria-hidden="true" />
          <div className={styles.brand}>
            <div className={styles.logo}>allo</div>
            <div className={styles.subtitle}>八丈島八丈島ライフロケット</div>
          </div>
          <div className={styles.topRight}>
            <div className={styles.dateBlock}>{dateLabel}</div>
            <div className={styles.headerClock} aria-label="現在時刻">
              {timeLabel}
            </div>
            <div className={styles.topActions}>
              <button className={styles.iconButton} type="button" aria-label="設定">
                <span className={styles.iconGear} />
                <span className={styles.iconLabel}>設定</span>
              </button>
              <button className={styles.iconButton} type="button" aria-label="メニュー">
                <span className={styles.iconMenu} />
                <span className={styles.iconLabel}>メニュー</span>
              </button>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <section className={`${styles.clockPanel} ${styles.fadeInOne}`}>
            <div className={styles.clockFace}>
              <div className={styles.clockRing} />
              <div className={styles.clockIsland} />
              <div className={styles.clockHandHour} />
              <div className={styles.clockHandMinute} />
              <div className={styles.clockHandSecond} />
            </div>
            <div className={styles.clockTime}>{timeLabel}</div>
          </section>

          <section className={`${styles.infoPanel} ${styles.fadeInTwo}`}>
            <div className={styles.panelHeader}>生活情報</div>
            <div className={styles.infoGrid}>
              <div className={styles.dailyStack}>
                <div className={styles.infoItem}>
                  <div className={styles.iconSlot}>ごみ</div>
                  <div>
                    <div className={styles.infoTitle}>燃やせるゴミ</div>
                    <div className={styles.infoValue}>回収日</div>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.iconSlot}>波</div>
                  <div>
                    <div className={styles.infoTitle}>波浪</div>
                    <div className={styles.infoValue}>2.5m</div>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.iconSlot}>風</div>
                  <div>
                    <div className={styles.infoTitle}>風速</div>
                    <div className={styles.infoValue}>8m/s 北東</div>
                  </div>
                </div>
              </div>

              <div className={styles.transportCard}>
                <div className={styles.cardTitle}>飛行機・橘丸</div>
                <div className={styles.transportSplit}>
                  <div className={styles.transportBlock}>
                    <div className={styles.cardSectionTitle}>東京羽田ー八丈島 (ANA)</div>
                    <div className={styles.statusList}>
                      {flightStatuses.map((item) => (
                        <div key={item.id} className={styles.statusRow}>
                          <StatusDot tone={item.tone} />
                          <span className={styles.statusId}>{item.id}</span>
                          <span className={`${styles.statusLabel} ${styles[`statusLabel${item.tone}`]}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.transportBlock}>
                    <div className={styles.cardSectionTitle}>東京竹芝ー八丈島 (橘丸)</div>
                    <div className={styles.statusList}>
                      {shipStatuses.map((item) => (
                        <div key={item.id} className={styles.statusRow}>
                          <StatusDot tone={item.tone} />
                          <span className={styles.statusId}>{item.id}</span>
                          <span className={`${styles.statusLabel} ${styles[`statusLabel${item.tone}`]}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.transportCard}>
                <div className={styles.cardTitle}>アイランドシャトル</div>
                <div className={styles.heliIcons}>
                  <div className={styles.iconSlotSmall}>ヘリ</div>
                  <div className={styles.iconSlotSmall}>ヘリ</div>
                  <div className={styles.iconSlotSmall}>ヘリ</div>
                  <div className={styles.iconSlotSmall}>ヘリ</div>
                </div>
                <div className={styles.heliStatusGrid}>
                  {heliStatuses.map((item) => (
                    <div key={item.id} className={styles.statusRow}>
                      <StatusDot tone={item.tone} />
                      <span className={styles.statusId}>{item.id}</span>
                      <span className={`${styles.statusLabel} ${styles[`statusLabel${item.tone}`]}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <section className={`${styles.banner} ${styles.fadeInThree}`}>
          <div className={styles.bannerArt}>イラスト</div>
          <div className={styles.bannerCopy}>
            <div className={styles.bannerHeadline}>八丈島の夏、始まりました!</div>
            <div className={styles.bannerSub}>特産品フェア開催中 (広告)</div>
          </div>
          <div className={styles.bannerFood}>特産品</div>
        </section>
      </div>
      <nav className={styles.bottomNav} aria-label="モバイルナビゲーション">
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>H</span>
          <span className={styles.navLabel}>ホーム</span>
        </button>
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>M</span>
          <span className={styles.navLabel}>マーケット</span>
        </button>
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>P</span>
          <span className={styles.navLabel}>投稿</span>
        </button>
        <button className={styles.navItem} type="button">
          <span className={styles.navIcon}>S</span>
          <span className={styles.navLabel}>設定</span>
        </button>
      </nav>
    </div>
  )
}
