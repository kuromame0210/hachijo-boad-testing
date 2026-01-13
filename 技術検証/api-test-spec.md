APIテスト計画（タスク一覧）

目的:
- APIキー不要のものから順に疎通と取得内容を確認する
- DebugEnvelopeの形式と最低限の情報取得を確認する

前提:
- Next.js 開発サーバーが起動中（http://localhost:3000）
- curl が使える

---

# 0. 事前確認
- [ ] サーバー起動を確認（ブラウザでトップが開く）
- [ ] curl で `http://localhost:3000/api/fetch/tokaikisen` にアクセスできる

---

# 1. APIキー不要のテスト（優先）

## 1-1. `/api/fetch/tokaikisen`（東海汽船HTML）
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw` がHTML文字列である
- [ ] `extracted.headers` が配列である
- [ ] `normalized` が配列で、出航時刻/運航状況が含まれる
- [ ] `warnings` が出る場合は内容をメモ
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/tokaikisen | jq '.ok, .error, .warnings, .normalized[0]'
    ```

## 1-2. `/api/fetch/umisora`（うみそら便HTML）
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw` がHTML文字列である
- [ ] `extracted.filteredRows` に「八丈島」「青ヶ島」を含む行がある
- [ ] `normalized` に `service: UMISORA_AOGASHIMA` が含まれる
- [ ] `warnings` が出る場合は内容をメモ
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/umisora | jq '.ok, .error, .warnings, .normalized[0]'
    ```

## 1-3. `/api/fetch/weather/wind`（Open-Meteo）
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw.hourly.time` が配列である
- [ ] `normalized` に 4つの horizon（TODAY/PLUS_24H/PLUS_72H/PLUS_7D）がある
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/weather/wind | jq '.ok, .error, .warnings, (.normalized | length)'
    ```

## 1-4. `/api/fetch/weather/wave`（Open-Meteo Marine）
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw.sokodo` / `raw.yaene` が存在する
- [ ] `normalized` に 底土/八重根の4 horizon が含まれる
- [ ] `warnings` に代表地点の注意が含まれる
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/weather/wave | jq '.ok, .error, .warnings, (.normalized | length)'
    ```

## 1-5. `/api/fetch/weather/typhoon`（気象庁XML）
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw` がXML文字列である
- [ ] `extracted.entries` に台風関連があれば確認、なければ warnings を記録
- [ ] `normalized` に `service: WEATHER_TYPHOON` が含まれる（台風なしなら空でも可）
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/weather/typhoon | jq '.ok, .error, .warnings, (.normalized | length)'
    ```

---

# 2. APIキー必要のテスト（後回し）

## 2-1. `/api/fetch/ana`（ODPT API）
- [ ] `ODPT_CONSUMER_KEY` を設定
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw.departures` / `raw.arrivals` が配列である
- [ ] `extracted` に6便が含まれる
- [ ] `normalized` に OUTBOUND/INBOUND が含まれる
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/ana | jq '.ok, .error, .warnings, (.normalized | length)'
    ```

## 2-2. `/api/fetch/business-hours`（Google Places API）
- [ ] `GOOGLE_MAPS_API_KEY` を設定
- [ ] Place ID を最新のものに更新
- [ ] GETしてHTTP 200とJSONが返る
- [ ] `ok` が true である
- [ ] `raw` がPlaces APIレスポンスである
- [ ] `normalized` に「本日の営業時間」「通常営業時間」が含まれる
  - コマンド:
    ```bash
    curl -s http://localhost:3000/api/fetch/business-hours | jq '.ok, .error, .warnings, (.normalized | length)'
    ```

---

# 3. 失敗時の記録項目
- [ ] `error.message` を必ず記録
- [ ] `warnings` の内容を記録
- [ ] 取得元サイトの表示とズレがある場合はメモ
