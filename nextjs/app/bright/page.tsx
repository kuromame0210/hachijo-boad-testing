import styles from "./bright.module.css"
import DebugHeader from "@/lib/components/DebugHeader"
import { fetchSavedEnvelope, pickPrimaryStatus, type StatusMeta } from "@/lib/public/summary"
import RefreshButton from "./refresh-button"

export const dynamic = "force-dynamic"

type TransportItem = {
  status?: string
  statusText?: string
  title?: string
  direction?: string
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
  waveHeightM?: number
  wavePeriodS?: number
  swellDirectionDeg?: number
  windSpeedMs?: number
  windGustMs?: number
  windDirectionDeg?: number
  typhoonName?: string
  typhoonId?: string
  time?: string
}

type CardData = {
  title: string
  status: StatusMeta
  trips: TransportItem[]
  fetchedAt?: string
  sourceUrl?: string
}

function formatTime(dep?: string, arr?: string) {
  if (dep && arr) return `${dep} → ${arr}`
  return dep ?? arr ?? "時刻未取得"
}

function formatDateTime(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

function pickLatestTimestamp(values: Array<string | undefined>) {
  const valid = values.filter((value): value is string => Boolean(value))
  if (!valid.length) return "-"
  return formatDateTime(valid.sort().reverse()[0])
}

function buildTrips(items: TransportItem[]) {
  return items.slice(0, 2)
}

function groupTripsByDirection(items: TransportItem[]) {
  const hachijoOutbound = items.filter((item) => item.title?.includes("八丈島行き"))
  const hachijoInbound = items.filter((item) => item.title?.includes("八丈島発"))
  const unknown = items.filter(
    (item) =>
      !item.title?.includes("八丈島行き") && !item.title?.includes("八丈島発")
  )
  return { hachijoOutbound, hachijoInbound, unknown }
}

function getStatusClass(status: StatusMeta) {
  switch (status.tone) {
    case "ok":
      return styles.badgeOk
    case "warn":
      return styles.badgeWarn
    case "bad":
      return styles.badgeBad
    default:
      return styles.badgeMuted
  }
}

function getStatusLabel(status: StatusMeta, statusText?: string) {
  return statusText && statusText.trim().length ? statusText : status.label
}

function toneFromStatusText(statusText?: string, fallback?: StatusMeta) {
  if (statusText) {
    if (statusText.includes("欠航") || statusText.includes("運休")) return "bad"
    if (statusText.includes("条件") || statusText.includes("調査")) return "warn"
    if (statusText.includes("運航") || statusText.includes("就航")) return "ok"
  }
  return fallback?.tone ?? "muted"
}

function getStatusTextClass(statusText?: string, fallback?: StatusMeta) {
  const tone = toneFromStatusText(statusText, fallback)
  switch (tone) {
    case "ok":
      return `${styles.statusText} ${styles.statusTextOk}`
    case "warn":
      return `${styles.statusText} ${styles.statusTextWarn}`
    case "bad":
      return `${styles.statusText} ${styles.statusTextBad}`
    default:
      return `${styles.statusText} ${styles.statusTextMuted}`
  }
}

function pickTimingLabel(title?: string) {
  if (!title) return null
  if (title.includes("昨晩")) return "昨晩"
  if (title.includes("今晩")) return "今晩"
  return null
}

export default async function BrightPage() {
  const [tokaikisen, umisora, wind, wave, typhoon] = await Promise.all([
    fetchSavedEnvelope<TransportItem>("tokaikisen"),
    fetchSavedEnvelope<TransportItem>("umisora"),
    fetchSavedEnvelope<WeatherItem>("wind"),
    fetchSavedEnvelope<WeatherItem>("wave"),
    fetchSavedEnvelope<WeatherItem>("typhoon"),
  ])

  const transportCards: CardData[] = [
    {
      title: "東海汽船",
      status: pickPrimaryStatus(tokaikisen?.normalized ?? []),
      trips: tokaikisen?.normalized ?? [],
      fetchedAt: tokaikisen?.fetchedAt,
      sourceUrl: "https://www.tokaikisen.co.jp/schedule/",
    },
    {
      title: "青ヶ島（船/ヘリ）",
      status: pickPrimaryStatus(umisora?.normalized ?? []),
      trips: buildTrips(umisora?.normalized ?? []),
      fetchedAt: umisora?.fetchedAt,
      sourceUrl: "https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/",
    },
  ]

  const waveToday = (wave?.normalized ?? []).filter((item) => item.horizon === "TODAY")
  const sokodo = waveToday.find((item) => item.port === "底土")
  const yaene = waveToday.find((item) => item.port === "八重根")
  const windToday = (wind?.normalized ?? []).find((item) => item.horizon === "TODAY")
  const typhoonItem = (typhoon?.normalized ?? []).find((item) => item.typhoonName || item.typhoonId)

  const updatedAt = pickLatestTimestamp([
    tokaikisen?.fetchedAt,
    umisora?.fetchedAt,
    wind?.fetchedAt,
    wave?.fetchedAt,
    typhoon?.fetchedAt,
  ])
  const weatherUpdatedAt = pickLatestTimestamp([
    wind?.fetchedAt,
    wave?.fetchedAt,
    typhoon?.fetchedAt,
  ])

  return (
    <div className={styles.page}>
      <DebugHeader
        title="きょうの運航と天気"
        eyebrow="Hachijo Island"
        meta={<div className={styles.meta}>更新: {updatedAt}</div>}
        actions={
          <div className={styles.actions}>
            <RefreshButton />
            <a className={styles.action} href="/test/preview">
              詳細
            </a>
          </div>
        }
        containerClassName={styles.header}
        titleClassName={styles.title}
        eyebrowClassName={styles.kicker}
        navClassName={styles.nav}
        navLinkClassName={styles.navLink}
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>交通</h2>
        <div className={styles.cards}>
          {transportCards.map((card) => (
            <article key={card.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <span className={`${styles.badge} ${getStatusClass(card.status)}`}>
                  {getStatusLabel(card.status, card.trips[0]?.statusText)}
                </span>
              </div>
              {card.title === "東海汽船" ? (
                <>
                  {(() => {
                    const grouped = groupTripsByDirection(card.trips)
                    const sections = [
                      { label: "八丈島行き", items: grouped.hachijoOutbound },
                      { label: "八丈島発", items: grouped.hachijoInbound },
                      { label: "その他", items: grouped.unknown },
                    ]
                    return (
                      <div className={styles.tripList}>
                        {sections.map((section) => (
                          <div key={section.label} className={styles.tripRow}>
                            <span className={styles.directionTag}>{section.label}</span>
                            {section.items.length ? (
                              section.items.map((trip, index) => (
                                <div key={`${section.label}-${index}`} className={styles.tripEntry}>
                                  <div className={styles.tripTime}>
                                    {formatTime(trip.depPlanned, trip.arrPlanned)}
                                    {pickTimingLabel(trip.title) && (
                                      <span className={styles.timingTag}>
                                        {pickTimingLabel(trip.title)}
                                      </span>
                                    )}
                                  </div>
                                  <div>{trip.title ?? "便情報"}</div>
                                  {trip.statusText && (
                                    <div className={styles.note}>
                                      運航状況:{" "}
                                      <span className={getStatusTextClass(trip.statusText, card.status)}>
                                        {trip.statusText}
                                      </span>
                                    </div>
                                  )}
                                  {trip.note && <div className={styles.note}>{trip.note}</div>}
                                </div>
                              ))
                            ) : (
                              <div className={styles.note}>該当便なし</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </>
              ) : (
              <div className={styles.tripList}>
                {card.trips.length ? (
                  card.trips.map((trip, index) => (
                      <div key={`${card.title}-${index}`} className={styles.tripEntry}>
                        <div className={styles.tripTime}>
                          {formatTime(trip.depPlanned, trip.arrPlanned)}
                          {pickTimingLabel(trip.title) && (
                            <span className={styles.timingTag}>
                              {pickTimingLabel(trip.title)}
                            </span>
                          )}
                        </div>
                        <div>{trip.title ?? "便情報"}</div>
                        {trip.statusText && (
                          <div className={styles.note}>
                            運航状況:{" "}
                            <span className={getStatusTextClass(trip.statusText, card.status)}>
                              {trip.statusText}
                            </span>
                          </div>
                        )}
                        {trip.note && <div className={styles.note}>{trip.note}</div>}
                      </div>
                    ))
                  ) : (
                    <div className={styles.note}>情報がまだ届いていません。</div>
                  )}
                </div>
              )}
              <div className={styles.note}>
                取得: {formatDateTime(card.fetchedAt)}
              </div>
              {card.sourceUrl && (
                <a
                  className={styles.cardLink}
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  参照元を見る
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>天気のサマリー</h2>
        <div className={styles.note}>天気の更新: {weatherUpdatedAt}</div>
        <div className={styles.weatherGrid}>
          <div className={styles.weatherCard}>
            <div className={styles.weatherTitle}>波（底土）</div>
            <div className={styles.weatherValue}>
              {sokodo?.waveHeightM ?? "-"} m
            </div>
            <div className={styles.note}>周期: {sokodo?.wavePeriodS ?? "-"}</div>
            <a
              className={styles.cardLink}
              href="https://open-meteo.com/en/docs/marine-weather-api"
              target="_blank"
              rel="noreferrer"
            >
              参照元を見る
            </a>
          </div>
          <div className={styles.weatherCard}>
            <div className={styles.weatherTitle}>波（八重根）</div>
            <div className={styles.weatherValue}>
              {yaene?.waveHeightM ?? "-"} m
            </div>
            <div className={styles.note}>周期: {yaene?.wavePeriodS ?? "-"}</div>
            <a
              className={styles.cardLink}
              href="https://open-meteo.com/en/docs/marine-weather-api"
              target="_blank"
              rel="noreferrer"
            >
              参照元を見る
            </a>
          </div>
          <div className={styles.weatherCard}>
            <div className={styles.weatherTitle}>風</div>
            <div className={styles.weatherValue}>{windToday?.windSpeedMs ?? "-"} m/s</div>
            <div className={styles.note}>
              突風: {windToday?.windGustMs ?? "-"} m/s
            </div>
            <a
              className={styles.cardLink}
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noreferrer"
            >
              参照元を見る
            </a>
          </div>
          <div className={styles.weatherCard}>
            <div className={styles.weatherTitle}>台風</div>
            <div className={styles.weatherValue}>
              {typhoonItem ? typhoonItem.typhoonName ?? typhoonItem.typhoonId : "なし"}
            </div>
            <div className={styles.note}>
              {typhoonItem ? "接近情報を確認" : "現在は影響なし"}
            </div>
            <a
              className={styles.cardLink}
              href="https://www.data.jma.go.jp/developer/xml/feed/extra.xml"
              target="_blank"
              rel="noreferrer"
            >
              参照元を見る
            </a>
          </div>
        </div>
        <div className={styles.footerNote}>
          情報は更新時刻時点のものです。出典ページで最終確認してください。
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>参照元</h2>
        <div className={styles.note}>
          本画面は以下の参照元に基づいて表示しています。
        </div>
        <div className={styles.sourceList}>
          <div className={styles.sourceItem}>
            <span>東海汽船 運航状況</span>
            <a
              className={styles.sourceLink}
              href="https://www.tokaikisen.co.jp/schedule/"
              target="_blank"
              rel="noreferrer"
            >
              サイトリンクはこちら
            </a>
          </div>
          <div className={styles.sourceItem}>
            <span>うみそら便 青ヶ島</span>
            <a
              className={styles.sourceLink}
              href="https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/"
              target="_blank"
              rel="noreferrer"
            >
              サイトリンクはこちら
            </a>
          </div>
          <div className={styles.sourceItem}>
            <span>Open-Meteo 風</span>
            <a
              className={styles.sourceLink}
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noreferrer"
            >
              サイトリンクはこちら
            </a>
          </div>
          <div className={styles.sourceItem}>
            <span>Open-Meteo 波</span>
            <a
              className={styles.sourceLink}
              href="https://open-meteo.com/en/docs/marine-weather-api"
              target="_blank"
              rel="noreferrer"
            >
              サイトリンクはこちら
            </a>
          </div>
          <div className={styles.sourceItem}>
            <span>気象庁 防災情報XML</span>
            <a
              className={styles.sourceLink}
              href="https://www.data.jma.go.jp/developer/xml/feed/extra.xml"
              target="_blank"
              rel="noreferrer"
            >
              サイトリンクはこちら
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
