 "use client"

import { useEffect, useState } from "react"
import styles from "./pc-mock.module.css"

const flightStatuses = [
  { id: "ANA1891", label: "就航", tone: "ok" },
  { id: "ANA1893", label: "条件付き", tone: "warn" },
  { id: "ANA1895", label: "欠航", tone: "bad" },
]

const shipStatuses = [
  { id: "往路", label: "就航", tone: "ok" },
  { id: "復路", label: "条件付き", tone: "warn" },
]

const heliStatuses = [
  { id: "八→青", label: "就航", tone: "ok" },
  { id: "青→八", label: "欠航", tone: "bad" },
  { id: "八→御", label: "条件付き", tone: "warn" },
  { id: "御→八", label: "就航", tone: "ok" },
]

function StatusDot({ tone }: { tone: "ok" | "warn" | "bad" }) {
  return <span className={`${styles.statusDot} ${styles[`statusDot${tone}`]}`} />
}

export default function PcMockPage() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const timer = setInterval(tick, 30 * 1000)
    return () => clearInterval(timer)
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
