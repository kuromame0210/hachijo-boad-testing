# /bright ページ調査

## 概要
- 対象ページ: http://localhost:3000/bright
- 目的: きょうの運航と天気を「明るい表示」で集約
- 実装ファイル: `nextjs/app/bright/page.tsx`
- 性質: サーバーコンポーネント（async関数）

## 画面構成
- ヘッダー（DebugHeader）
  - タイトル: `きょうの運航と天気`
  - 眉見出し: `Hachijo Island`
  - 更新表示: `更新: {updatedAt}`
  - ナビ: `/bright`, `/calm`, `/test`, `/test/preview`, `/`, `/weather`
  - アクション: `更新`, `詳細`
- 交通（カード2枚）
  - 東海汽船
  - 青ヶ島（船/ヘリ）
- 天気のサマリー
  - 波（底土）/ 波（八重根）/ 風 / 台風
- 参照元一覧

## 画面に表示される情報（項目整理）
- ヘッダー
  - タイトル: `きょうの運航と天気`
  - 眉見出し: `Hachijo Island`
  - 更新時刻: `更新: {updatedAt}`
  - ナビリンク: `/bright` `/calm` `/test` `/test/preview` `/` `/weather`
  - アクション: `更新` `詳細`
- 交通（2カード）
  - 東海汽船
    - ステータスバッジ: 欠航 / 条件付き / 遅延 / 運航 / 営業中 / 休業 / 情報なし
    - 便情報（八丈島行き / 八丈島発 / その他）
      - 時刻: `depPlanned` / `arrPlanned`
      - 便名/タイトル: `title`
      - 運航状況: `statusText`（あれば）
      - 備考: `note`（あれば）
  - 青ヶ島（船/ヘリ）
    - ステータスバッジ: 東海汽船と同様
    - 便情報（最大2件）
      - 時刻 / 便名 / 運航状況 / 備考（同じ項目）
- 天気のサマリー
  - 波（底土）: 波高 `m` / 周期
  - 波（八重根）: 波高 `m` / 周期
  - 風: 風速 `m/s` / 突風 `m/s`
  - 台風: 台風名 or 台風番号 / 影響コメント
  - 天気の更新時刻: `天気の更新: {weatherUpdatedAt}`
- 参照元一覧（リンク）
  - 東海汽船 運航状況
  - うみそら便 青ヶ島
  - Open-Meteo 風
  - Open-Meteo 波
  - 気象庁 防災情報XML

## データ取得
- `fetchSavedEnvelope` を使い、保存済みレポートから取得
  - エンドポイント: `/api/debug/read-report?key=...`
  - キー: `tokaikisen`, `umisora`, `wind`, `wave`, `typhoon`
- 取得後のデータ構造（要約）
  - `DebugEnvelope<T>`: `ok`, `fetchedAt`, `normalized`, `warnings`, `error`
  - `normalized` が実際の表示データ
- 取得用のベースURL
  - `NEXT_PUBLIC_BASE_URL` / `BASE_URL` / `VERCEL_URL` / `x-forwarded-*` / `localhost:3000` の順で決定

## 交通カードの表示ロジック
- `pickPrimaryStatus` で主要ステータスを選定
  - 優先順位: `CANCELLED` > `SUSPENDED` > `DELAYED` > `UNKNOWN` > `ON_TIME` > `OPEN` > `CLOSED`
  - 表示ラベル: 欠航/条件付き/遅延/運航/営業中/休業/情報なし
- `東海汽船` はタイトル内の文字で分類表示
  - `八丈島行き` / `八丈島発` / `その他`
- 便情報
  - 時刻: `depPlanned` / `arrPlanned` を `HH:MM → HH:MM` 形式で表示
  - `昨晩` / `今晩` の文言があればタグ表示
  - `statusText` があれば運航状況として別表示
  - `note` があれば補足文として表示
- `青ヶ島（船/ヘリ）` は最大2件まで表示

## 天気サマリーの表示ロジック
- `wave` の `TODAY` を抽出し、港別に表示
  - 底土 / 八重根
- `wind` の `TODAY` を使用
- `typhoon` は `typhoonName` or `typhoonId` がある場合に表示
- 未取得時は `-` や `情報がまだ届いていません。` にフォールバック

## 更新時刻の扱い
- `updatedAt` は各取得データの `fetchedAt` から最新時刻を選ぶ
- `weatherUpdatedAt` は `wind` / `wave` / `typhoon` の `fetchedAt` から最新を選ぶ
- 表示時には `Asia/Tokyo` の日時に整形

## 参照元リンク
- 東海汽船: https://www.tokaikisen.co.jp/schedule/
- うみそら便 青ヶ島: https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/
- Open-Meteo 風: https://open-meteo.com/en/docs
- Open-Meteo 波: https://open-meteo.com/en/docs/marine-weather-api
- 気象庁 防災情報XML: https://www.data.jma.go.jp/developer/xml/feed/extra.xml

## 仕組み（言語化）
- ページ描画時にサーバー側で保存済みレポートを読み込み、運航と天気のサマリーを生成する。
- 交通系のデータは、便リストの `status` を優先順位で評価し、カード上部のステータスバッジを決定する。
- 東海汽船は便タイトルの文字列から発着方向を推定し、見やすい単位に分割して表示する。
- 天気は当日分のみを抽出し、港や指標ごとにカード化して表示する。
- 実際のデータ取得は `api/debug/read-report` に保存されたデータを参照する仕組みで、外部APIへは直接アクセスしない（参照元URLは画面に提示するだけ）。

## 参考
- 実装ファイル: `nextjs/app/bright/page.tsx`
- 共通ロジック: `nextjs/lib/public/summary.ts`
- ヘッダー部品: `nextjs/lib/components/DebugHeader.tsx`
