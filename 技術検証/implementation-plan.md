# 実装タスク分解（順序のみ）

この計画は `read3.md`（交通4タブ）、`read4.md`（/weather 3タブ）、`read5.md`（営業日タブ追加）の内容をまとめて、AIが迷わず進められる順序だけを示す。

---

## 確定事項（反映済み前提）

- `/weather` 用座標（代表点）
  - 八丈町役場: `lat: 33.1136, lon: 139.7876`
  - 底土海水浴場: `lat: 33.1239, lon: 139.7819`
  - 八重根港: `lat: 33.1075, lon: 139.7729`
- 八丈ストア Place ID: `ChIJRZf7Z0H1FzUR0r3rVd7YH6c`
- 東海汽船の運航状況は「h2: 本日の運航状況」直下の table を基準に抽出（class依存なし）
- うみそら便は「h3: 日付」直下の table を基準に抽出
- 愛らんどシャトルは **参照リンクのみ**（自動取得しない）
- 東海汽船の時刻表補完は HTML 版が正、結合キーは「日付 + 出港時刻」
  - 検証フェーズは補完なしでOK

---

## 0. 共通準備（最初に一度だけ）

1. DebugEnvelope と共通UIの表示方針を再確認（Raw/Copy/警告/エラー表示）
2. 共通ユーティリティの土台を用意
   - `lib/http`（UA/timeout/例外処理共通）
   - `lib/debug/debugEnvelope.ts`
   - 共通の Raw 表示 + Copy UI コンポーネント（必要なら）
3. 交通/Weather で共通に使うスキーマの整理
4. `lib/geo/points.ts` に座標定数を反映（八丈町役場/底土/八重根）

---

## 1. 交通ページ（read3: 4タブ）

### 1-1. UI骨格
1. `app/page.tsx` に 4タブ UI を作成
2. Refresh / 参照元リンク / 左=整形 / 右=Raw+Copy の配置を固定
3. API のダミー DebugEnvelope を表示できる状態にする
4. 「ヘリ」タブは **うみそら便の正データ**を表示、愛らんどシャトルは参照リンクのみ

### 1-2. 交通API骨格
1. `app/api/fetch/ana/route.ts`
2. `app/api/fetch/tokaikisen/route.ts`
3. `app/api/fetch/umisora/route.ts`

全て DebugEnvelope のダミーを返す状態で UI に接続。

### 1-3. ANA（ODPT）
1. ODPT API から raw を取得
2. 6便フィルタの extracted を作成
3. normalized の最低限マッピング

### 1-4. 東海汽船（運航状況）
1. `/schedule/` を取得し raw 返却
2. `h2: 本日の運航状況` 直下の table から抽出 → extracted
3. normalized に就航/欠航・出航・備考を入れる
4. 到着補完は warnings に記載

### 1-5. 東海汽船（時刻表補完・後回し可）
1. `/boarding/timetable/` の HTML 版から八丈島時刻表へ辿る
2. 到着予定時刻を抽出
3. 「日付 + 出港時刻」で結合
4. 検証フェーズはこのタスクをスキップ可

### 1-6. うみそら便（青ヶ島/ヘリ）
1. 青ヶ島ページ raw
2. `h3: 日付` 直下 table から該当行を抽出
3. 更新時刻と該当行の抽出 → extracted
4. normalized へ反映（青ヶ島丸 / ヘリ）

---

## 2. Weather ページ（read4: /weather 3タブ）

### 2-1. UI骨格
1. `app/weather/page.tsx` に 3タブ UI
2. Refresh / 参照元リンク / 左=整形 / 右=Raw+Copy
3. DebugEnvelope のダミー表示

### 2-2. Weather API 骨格
1. `app/api/fetch/weather/wave/route.ts`
2. `app/api/fetch/weather/wind/route.ts`
3. `app/api/fetch/weather/typhoon/route.ts`

### 2-3. 風（Open-Meteo）
1. raw 取得
2. TODAY/+24/+72/+7D 抽出
3. normalized に wind 系を入れる

### 2-4. 波（Open-Meteo Marine）
1. 底土/八重根の raw 取得
2. 港別抽出 → extracted
3. normalized に波情報
4. warnings に「代表地点」

### 2-5. 台風（気象庁 XML）
1. raw XML 取得
2. extracted 最小抽出
3. normalized は距離だけでも可
4. 台風なし時は warnings

---

## 3. 営業日タブ追加（read5）

### 3-1. UI追加
1. 交通ページのタブに「営業日」を追加
2. 参照元リンク（Googleマップ / Places API docs）を表示

### 3-2. API
1. `app/api/fetch/business-hours/route.ts` を追加
2. Place ID は `ChIJRZf7Z0H1FzUR0r3rVd7YH6c` を固定で直書き
3. Places API Place Details から raw 取得

### 3-3. 抽出・整形
1. 今日の営業時間
2. 曜日ごとの通常営業時間
3. 特別営業時間 / 例外日
4. normalized を最小生成

---

## 4. 仕上げ（全体）

1. Raw / extracted / normalized の表示が全タブで崩れていないか確認
2. 参照元リンクと定数のコード内固定を最終チェック
3. 例外時でも raw が必ず返ることを確認
