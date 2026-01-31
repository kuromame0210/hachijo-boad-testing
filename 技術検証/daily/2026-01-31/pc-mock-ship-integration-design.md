# /pc-mock に八丈島の船情報を適用する詳細設計

## 目的
- 現在モック表示の `/pc-mock` に、八丈島の船の実データ（東海汽船）を反映する。
- 表示の見た目は維持しつつ、データを `tokaikisen` の保存済みレポートに置き換える。

## 対象範囲
- `/pc-mock` の「飛行機・橘丸」カードのうち、船（橘丸）部分を実データに置換。
- まずは船のみ。飛行機やヘリは後続で実施。

## 参照元データ
- 保存済みレポート: `key = tokaikisen`
- 取得元: `/api/fetch/tokaikisen` → `/api/debug/save-report`
- 参照: `/api/debug/read-report?key=tokaikisen`（`fetchSavedEnvelope`）

## 現行UI構造（/pc-mock）
- 交通カード: `飛行機・橘丸`
  - 左: `東京羽田ー八丈島 (ANA)`
  - 右: `東京竹芝ー八丈島 (橘丸)`
- 船の表示は現在 `shipStatuses`（固定配列）を描画

## 置換後の表示仕様（案）
- 表示対象: 東海汽船の便のうち「八丈島行き」「八丈島発」
- 表示件数: 上位2件（往路/復路の合計で2件）
- 表示テキスト
  - 便名: `title`（なければ `TOKAIKISEN`）
  - 時刻: `depPlanned`/`arrPlanned` を `HH:MM → HH:MM`
  - 状態: `statusText` があれば優先、なければ `status` をラベル化
- ステータス色
  - `statusText` or `status` から `ok/warn/bad` を判定して `StatusDot` を利用

## 変換ロジック（案）
- 入力: `TransportItem[]`（tokaikisen.normalized）
- 変換:
  1) `title` に `八丈島行き` / `八丈島発` を含む便を抽出
  2) 各便を `ShipStatusItem` にマッピング
     - `id`: `title` or `TOKAIKISEN`
     - `label`: `statusText` or `status` から表示ラベル
     - `tone`: `statusText`/`status` を `ok/warn/bad`/`muted` に変換
  3) 最大2件に制限

### ステータス判定（案）
- `statusText` に
  - `欠航` / `運休` → `bad`
  - `条件` / `調査` / `遅延` → `warn`
  - `運航` / `就航` → `ok`
- `status` のコードは `pickPrimaryStatus` に準拠（`CANCELLED`/`SUSPENDED`/`DELAYED`/`ON_TIME` ...）

## UI反映方法
- `/pc-mock` をサーバー化せず、クライアントコンポーネントのまま維持
- `useEffect` で `fetchSavedEnvelope('tokaikisen')` を取得
- 取得結果を `shipStatuses` 相当のステートに変換して描画
- 取得失敗時は既存モックにフォールバック

## 変更点（実装見込み）
- `nextjs/app/pc-mock/page.tsx`
  - `shipStatuses` を固定配列ではなく動的ステート化
  - `fetchSavedEnvelope` の導入
  - 変換関数を追加

## 注意点
- `/pc-mock` はクライアントコンポーネントのため、`fetchSavedEnvelope` はブラウザ側から叩かれる。
- `read-report` が Supabase 設定なしだと 503 になるため、フォールバック表示は必須。
- `tokaikisen` の `normalized` の内容に応じて、便名や時刻が欠けるケースがある。

## 次の検討事項
- 表示件数の上限（2件固定か、往復で1件ずつにするか）
- ANA / ヘリの実データ適用方針
- `/pc-mock` と `/bright` の表示項目の統一度合い
