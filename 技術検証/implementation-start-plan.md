# 実装開始プラン（APIキー投入で動作する状態まで）

目的: 各機能を「APIキー等を入れれば動く」状態まで実装する。Raw優先で DebugEnvelope を維持。

---

## 0. 共通準備

1. DebugEnvelope / NormalizedItem の型定義を確定
2. `lib/http` に共通 fetch（UA/timeout/例外処理）を用意
3. Raw 表示 + Copy UI を共通化（任意）
4. `lib/geo/points.ts` に座標定数を投入
   - 八丈町役場: `33.1136, 139.7876`
   - 底土海水浴場: `33.1239, 139.7819`
   - 八重根港: `33.1075, 139.7729`
5. `.env.local` のキーを読み込む雛形を作る
   - `ODPT_CONSUMER_KEY`
   - `GOOGLE_MAPS_API_KEY`

---

## 1. 交通ページ（4タブ）

### 1-1. UI骨格
1. `app/page.tsx` に 4タブ UI
2. Refresh / 参照元リンク / 左=整形 / 右=Raw+Copy
3. ダミー DebugEnvelope 表示

### 1-2. ANA API（動作到達）
1. `app/api/fetch/ana/route.ts` を実装
2. ODPT API を叩き raw を返す
3. 6便フィルタを extracted に入れる
4. normalized は最低限

### 1-3. 東海汽船（運航状況）
1. `/schedule/` 取得 raw 返却
2. `h2: 本日の運航状況` 直下の table 抽出 → extracted
3. normalized に就航/欠航・出航・備考

### 1-4. うみそら便（青ヶ島/ヘリ）
1. 青ヶ島ページ raw
2. `h3: 日付` 直下 table 抽出 → extracted
3. normalized に青ヶ島丸/ヘリを反映

※ 愛らんどシャトルは参照リンクのみ（自動取得はしない）

---

## 2. Weather ページ（/weather）

### 2-1. UI骨格
1. `app/weather/page.tsx` に 3タブ UI
2. Refresh / 参照元リンク / 左=整形 / 右=Raw+Copy
3. ダミー DebugEnvelope 表示

### 2-2. 風（Open-Meteo）
1. `app/api/fetch/weather/wind/route.ts` 実装
2. raw 取得
3. TODAY/+24/+72/+7D 抽出 → extracted
4. normalized に wind 系

### 2-3. 波（Open-Meteo Marine）
1. `app/api/fetch/weather/wave/route.ts` 実装
2. 底土/八重根 raw 取得
3. 港別抽出 → extracted
4. normalized に波情報
5. warnings に代表地点

### 2-4. 台風（気象庁 XML）
1. `app/api/fetch/weather/typhoon/route.ts` 実装
2. raw XML 取得
3. extracted 最小抽出
4. normalized は距離だけでも可

---

## 3. 営業日タブ（Google Maps Places）

### 3-1. UI追加
1. 交通ページのタブに「営業日」追加
2. 参照元リンク（Googleマップ / Places API docs）表示

### 3-2. API
1. `app/api/fetch/business-hours/route.ts` 実装
2. Place ID は `ChIJRZf7Z0H1FzUR0r3rVd7YH6c`
3. Places API Place Details から raw を返す

### 3-3. 抽出・整形
1. 今日の営業時間
2. 曜日ごとの通常営業時間
3. 特別営業時間 / 例外日
4. normalized を最小生成

---

## 4. 動作条件

- `.env.local` に API キーを入れれば動作
- キー未設定時は DebugEnvelope の error に理由を返す
- Raw は常に保持する
