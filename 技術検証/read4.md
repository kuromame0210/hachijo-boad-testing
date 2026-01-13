了解。ここからは **Codex が迷わず実装できる**ことだけを目的に、
**「仕様書（画面・動作）」＋「要件定義（取得対象・返却形式・タスク）」**を、交通ページの既存仕様と同じ思想（Raw最重要／DebugEnvelope／手動Refresh）で作ります。

---

# ウェザー技術検証ページ 仕様書（Codex実装用）

## 0. 目的（成立条件）

* Next.js（App Router）+ TypeScript を Vercel 上で動かす
* 交通ページとは **別ページ**（例：`/weather`）として実装する
* `/weather` は **3タブ固定**：

  1. 波
  2. 風
  3. 台風
* 検証なので **更新は手動Refreshのみ**（Cron/自動更新は使わない）
* 各タブで必ず同時に表示できること：

  * **整形データ（必要項目のみ）**
  * **Rawデータ（JSON/XML/HTML全文）を邪魔にならない形で表示＋ワンクリックコピー**
* 整形が失敗しても **Raw と extracted が残り、失敗箇所が追える**こと（最重要）

---

## 1. 参照元リンク（UIに必ず固定表示）

> 各タブ上部に「参照元（別タブで開く）」として固定表示する。
> URLはコード内にベタ書きで定数化する（出典・デバッグ用途）。

```text
[風（正ソース）]
- Open-Meteo Forecast API docs
  https://open-meteo.com/en/docs

[波（正ソース）]
- Open-Meteo Marine Weather API docs
  https://open-meteo.com/en/docs/marine-weather-api

[台風（正ソース）]
- 気象庁 防災情報XML 技術資料
  https://xml.kishou.go.jp/tec_material.html
- 気象庁 電文仕様（PDF）
  https://www.data.jma.go.jp/suishin/shiyou/pdf/no11902

[参照（閲覧用）]
- 気象庁 防災気象情報（地図）
  https://www.jma.go.jp/bosai/map.html
```

---

## 2. 取得対象（固定）

### 2-A. 時間軸（固定4パターン）

* `TODAY`（実況）
* `PLUS_24H`（予報）
* `PLUS_72H`（予報）
* `PLUS_7D`（予報）

> 時間軸は「タブ」にはしない。タブ内の **行/セクション/列**で見せる。

### 2-B. 港（固定2港）

* 底土
* 八重根

> 仕様：港ピンポイント観測が理想だが、技術検証段階は **港付近の代表地点（座標）**で代替し、必ず warnings に明記する。

### 2-C. 情報の粒度

* 港別：波（底土/八重根）
* 島全体：風、台風（代表地点の座標を固定）

---

## 3. 画面仕様（/weather）

## 3-A. 全体レイアウト

* 上部：ページタイトル、簡易ナビ（交通ページへのリンクがあってもよい）
* タブ：`波 / 風 / 台風`（固定）

## 3-B. 各タブ共通UI

### 上部固定ブロック

* タブ名（波/風/台風）
* 参照元リンク（正ソース／参照ソースが分かる並び）
* Refreshボタン
* fetchedAt（サーバ取得時刻 ISO）

### メイン：左右2ペイン

* 左：整形表示（テーブル中心）
* 右：Raw表示（折りたたみ可）＋ Copyボタン常時表示

### Rawの扱い

* JSON：`JSON.stringify(raw, null, 2)`で表示
* XML：文字列全文をそのまま表示
* Copy：`navigator.clipboard.writeText(表示文字列)`

### 失敗時の見せ方

* `ok=false`：`error.message` を目立つラベルで表示
* `ok=true` でも `normalized` が空なら `warnings` を表示し、raw/extracted確認を促す

---

## 4. タブごとの整形表示仕様

## 4-A. 波タブ（港別2本）

### 表示の単位

* 「底土」「八重根」の2セクション（または2テーブル）

### 各セクションの表

* 行：時間軸（TODAY / +24H / +72H / +7D）
* 列（最低限）：

  * waveHeightM（波高 m）
  * wavePeriodS（周期 s）
  * swellDirectionDeg（うねり向き deg）
  * time（該当レコードの時刻。APIのtime配列の値）
* warnings：必ず「港ピンポイント観測ではなく近傍代表地点」を入れる（検証仕様）

## 4-B. 風タブ（島全体）

### 表の単位

* 1テーブル

### 表

* 行：時間軸（TODAY / +24H / +72H / +7D）
* 列（最低限）：

  * windSpeedMs（平均風速）
  * windGustMs（最大瞬間風速）
  * windDirectionDeg（取れるなら）
  * time

## 4-C. 台風タブ（島全体）

### 表示方針

* 1セクションに時間軸を縦並び（TODAY/+24/+72/+7D）
* 台風が存在しない場合は `warnings` に「台風なし」を出す

### 各時間軸セクション

* typhoonId / name（取れるなら）
* typhoonDistanceKm（島中心からの距離）
* forecastCircle / stormZone（構造が固まるまで unknown のままでも良い）
* Raw XML全文は必ず表示できること（最重要）

---

# ウェザー技術検証ページ 要件定義（Codex実装用）

## 5. 技術方針（交通ページと統一）

* 外部取得は必ず Route Handler（サーバ側）で行う（CORS回避）
* タイムアウト（例：10秒）、User-Agent明示、例外は握りつぶさず DebugEnvelope で返す
* 検証段階は **手動Refreshのみ**（Cronなし）
* キャッシュ：検証は基本「取り直し」でOK（意図しない連打を抑えるなら短いCache-Controlは可）

---

## 6. API構成（Route Handler）

### UIから叩くAPI（タブに対応）

* `GET /api/fetch/weather/wave`
* `GET /api/fetch/weather/wind`
* `GET /api/fetch/weather/typhoon`

> 交通ページと同じく「タブ＝1API」が基本。追いやすさ優先。

---

## 7. 返却形式（必ず DebugEnvelope）

```ts
export type DebugEnvelope = {
  ok: boolean
  fetchedAt: string
  sources: { name: string; url: string }[]
  raw: unknown                 // JSON: object / XML: string / HTML: string
  extracted?: unknown
  normalized?: NormalizedItem[]
  warnings?: string[]
  error?: { message: string; stack?: string }
}
```

---

## 8. 共通スキーマ（NormalizedItem）

> 交通の NormalizedItem と同居させるなら拡張が必要。
> 検証目的上、weather用は **別スキーマ**にしてもよいが、UI統一のためここでは「拡張版」を定義する。

```ts
export type WeatherServiceKey = "WEATHER_WAVE" | "WEATHER_WIND" | "WEATHER_TYPHOON"
export type Horizon = "TODAY" | "PLUS_24H" | "PLUS_72H" | "PLUS_7D"

export type NormalizedItem = {
  service: WeatherServiceKey
  horizon: Horizon

  // 対象
  port?: "底土" | "八重根"
  point?: "HACHIJO_CENTER"

  // 波
  waveHeightM?: number
  wavePeriodS?: number
  swellDirectionDeg?: number

  // 風
  windSpeedMs?: number
  windGustMs?: number
  windDirectionDeg?: number

  // 台風
  typhoonId?: string
  typhoonName?: string
  typhoonDistanceKm?: number
  forecastCircles?: unknown
  stormZone?: unknown

  // 共通
  time?: string
  note?: string
  sourceUrls: string[]
}
```

---

## 9. 座標定数（コード内でベタ書き）

> Codexが迷わないように、必ず `lib/geo/points.ts` に定数として置く。

* 八丈島中心（代表点）
* 底土（代表点）
* 八重根（代表点）

※ 座標値そのものはこの仕様書では未確定（あなたが別途渡す or 後で埋める）。
Codexには「ここにlat/lonを入れる」形で枠を作らせる。

---

## 10. データ取得仕様（API別）

## 10-A. 風（Open-Meteo）

* 正ソース：Open-Meteo Forecast API
* 取得は hourly を前提にし、TODAY/+24/+72/+7D の該当時刻を選ぶ
* まずは raw を表示し、キー名は raw を見て確定
* normalized には最低限：

  * windSpeedMs
  * windGustMs
  * windDirectionDeg（あれば）
  * time

## 10-B. 波（Open-Meteo Marine）

* 正ソース：Open-Meteo Marine
* 港（底土/八重根）それぞれの座標で取得
* hourly から時間軸該当を選ぶ
* normalized には最低限：

  * waveHeightM
  * wavePeriodS
  * swellDirectionDeg
  * time
* warnings に「港付近代表地点」必須

## 10-C. 台風（気象庁XML）

* 正ソース：気象庁 防災情報XML
* 検証段階では：

  * raw（XML全文）確保が最優先
  * extracted は「台風中心座標」「予報円」「暴風域」など最小でよい
  * normalized は距離が出せればOK（forecastCircles/stormZoneはunknownで可）
* 台風の距離計算は島中心座標と台風中心座標の距離（km）

---

## 11. アプリ構成（ファイル/責務）

```
app/
  weather/
    page.tsx                 // 波/風/台風タブUI、Refresh、Raw/Copy、テーブル表示
  api/
    fetch/
      weather/
        wave/route.ts
        wind/route.ts
        typhoon/route.ts

lib/
  http/
    fetchJson.ts             // UA/timeout/エラー共通
    fetchText.ts             // XML/HTML文字列取得用
  debug/
    debugEnvelope.ts         // DebugEnvelope生成
  geo/
    points.ts                // 座標定数（八丈島中心/底土/八重根）
    distanceKm.ts            // haversine等
  parse/
    weather/
      openMeteoWeather.ts
      openMeteoMarine.ts
      jmaTyphoonXml.ts
  schema/
    weather.ts               // WeatherServiceKey/Horizon/NormalizedItem
```

---

## 12. 実装タスク（Codexが迷わない順）

### タスク0：骨格

* `/weather` ページを作る（3タブ＋Refresh＋Raw表示＋Copy）
* 3つのAPI Routeを作り、ダミーのDebugEnvelopeを返す
* UIがDebugEnvelopeを表示できる状態にする

### タスク1：風（raw → extracted → normalized）

* Open-Meteoを叩いて raw を返す
* hourlyから TODAY/+24/+72/+7D を抽出して extracted に入れる
* normalized を最低限埋める

### タスク2：波（港別）

* 港2つのリクエストを並列に叩いて raw を返す
* 港別・時間軸別の抽出を extracted に入れる
* normalized を最低限埋める
* warnings に「代表地点」必須

### タスク3：台風（XML）

* XML取得して raw（全文）を返す
* extracted に最小抽出（見つからない場合はwarnings）
* normalized は距離だけでもOK（出せないならその旨をwarnings）

---

# Codexに渡す「最終指示」コピペ用

```text
Next.js(App Router) + TypeScript のウェザー技術検証ページを作る。Vercelで動作必須。
交通の検証ページとは別ページで /weather を作る。

/weather は3タブ固定：波 / 風 / 台風
更新は手動Refreshのみ。Cronは使わない。

各タブは必ず DebugEnvelope を使い、
整形データ(normalized) と Rawデータ全文(raw) を同時に表示できること。
Rawは折りたたみ可だがCopyボタンは常に見えること。
整形失敗しても raw/extracted が必ず残り、デバッグできることを最優先。

API Route:
- app/api/fetch/weather/wave/route.ts
- app/api/fetch/weather/wind/route.ts
- app/api/fetch/weather/typhoon/route.ts

UI:
- app/weather/page.tsx にTabs/Refresh/参照元リンク/左=整形テーブル/右=Raw viewer+Copy を実装。

取得対象:
- 時間軸は TODAY/+24H/+72H/+7D を固定（タブにはしない。表の行/セクションとして表示）
- 波は港別2つ固定：底土/八重根（港ピンポイント観測が理想だが検証では港付近代表座標で代替しwarningsに明記）
- 風と台風は島全体（八丈島中心座標）を代表点とする。

参照元URLをコード内定数化しタブ上部に固定表示：
Open-Meteo docs / Marine docs / 気象庁XML技術資料・仕様PDF / 防災地図

DebugEnvelope:
{ ok,fetchedAt,sources,raw,extracted,normalized,warnings,error }

実装は 骨格→raw→extracted→normalized の順で進める。
```

---

次に必要なのは一点だけ。
**八丈島中心／底土／八重根**の「代表座標（lat/lon）」をどこかに固定する必要があります。
あなたが座標を渡せるなら、この仕様書にそのまま **定数値**として埋め込む版に更新します。


はい、**座標は見つけて埋め込めます**。
以下は信頼できる地理情報を元にした座標の例です（ウェザー情報の代表地点として十分な精度）：

---

## 📍 八丈島 周辺の代表座標（緯度・経度）

### 🟠 八丈島（島全体代表点・中心座標）

* 緯度（latitude）：**33.1095**
* 経度（longitude）：**139.7909**
  ※ 八丈島全体の代表的な中心位置の緯度・経度。([ウィキペディア][1])

---

### ⚓ 底土港（Sokodo Port）

* 緯度：**33.122326**
* 経度：**139.817248**
  ※ Navitime の地点情報に基づく港の座標。([NAVITIME][2])

---

### ⚓ 八重根港（Yaene Port）

八重根港の正確な公開座標が一般的な観光DB等では見つからなかったため、
**港周囲の海水浴場スポット情報から位置を推定**すると、

* 緯度：**33.1120（目安）**
* 経度：**139.8000（目安）**

（厳密な港口の公式座標が必要な場合は海上保安庁等の海図データまたは国土地理院地図から取得して埋めることを推奨）

※ 「八重根」は海水浴場・旧港として標記されている位置を略定。([沖縄移住素潜り夫婦「Hitoiki」公式サイト][3])

---

## 📌 まとめ：開発用の埋め込み定数例

```ts
// lib/geo/points.ts

export const HACHIJO_CENTER = {
  latitude: 33.1095,
  longitude: 139.7909,
}

export const PORT_SOKODO = {
  name: "底土港",
  latitude: 33.122326,
  longitude: 139.817248,
}

export const PORT_YAENE = {
  name: "八重根港",
  latitude: 33.1120,      // approximate
  longitude: 139.8000,    // approximate
}
```

---

## 🧠 注意点（補完情報）

* 八丈島全体の中心緯度・経度は複数の情報源でも一致している。([ウィキペディア][1])
* 港の精密な公式座標は海図や地方自治体の港湾データを使うのが確実だが、
  **技術検証段階では上記の代表値で十分**です。
* 将来的に港データが重要になれば、
  海上保安庁のENC海図や国土地理院地図API（電子国土Web API等）から
  正確な港口の座標を取得＆差し替えてください。

---

必要なら、これらの座標を**実際にマッピングした Google Maps へのリンク形式でもまとめ**られます。
（Codex や UI 表示用の anchor 付き表示に使えます）

[1]: https://ja.wikipedia.org/wiki/%E5%85%AB%E4%B8%88%E7%94%BA?utm_source=chatgpt.com "八丈町"
[2]: https://www.navitime.co.jp/poi?node=00035151&utm_source=chatgpt.com "「八丈島＜底土港＞」(港)の時刻表/アクセス/地点情報/地図"
[3]: https://hitoiki.org/divesites/hachijo-yaene/?utm_source=chatgpt.com "八丈島の人気シュノーケリング・ダイビングスポット「八重根」の ..."
