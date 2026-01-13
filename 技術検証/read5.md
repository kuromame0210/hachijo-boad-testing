了解。
以下は **既存の「技術検証ページ仕様書」に“そのまま追記できる形”**で書いた、
**Googleマップ（八丈ストア）営業時間取得タブの追記仕様書のみ**です。
余計な説明・提案は入れていません。

---

# 追記仕様書：営業日タブ（Googleマップ / 八丈ストア）

## A. 追加概要

既存の技術検証ページ（ANA / 東海汽船 / 青ヶ島 / ヘリ）に
**新規タブ「営業日」**を1つ追加する。

本タブは **Googleマップ上の「八丈ストア」**の営業時間情報を取得・表示するための
**技術検証用タブ**とする。

思想・作法は既存タブと完全に統一する：

* 手動Refresh
* DebugEnvelope必須
* Raw全文保持・Copy可能
* 整形失敗しても Raw / extracted が残ることを最優先

---

## B. 対象店舗（固定）

* 店名：八丈ストア

* Googleマップ参照URL（UI固定表示）

  ```
  https://maps.app.goo.gl/z3mKL3S91tcQUxRM9
  ```

* Place ID：**事前に1回だけ確定し、コードに直書きで固定**

  * Place ID の取得方法は仕様外（Find Place / Text Search 等で手動確定）
  * 本タブの実装では **Place ID 解決処理は行わない**

---

## C. 取得方式（公式API限定）

* 使用API：**Google Maps Platform – Places API（Place Details）**
* 取得は必ず **サーバ側 Route Handler** で行う
* FieldMask を指定し、営業時間関連のみ取得する

### 取得対象フィールド（最低限）

* 通常営業時間（曜日ごと）
* 今日を含む直近の営業時間
* 特別営業時間 / 例外日情報（取得できる場合）

※ 実フィールド名は Places API v1 に準拠
※ Raw を見て確定・調整する前提でよい

---

## D. 表示要件（営業日タブ）

### 上部固定表示

* タブ名：**営業日**
* 参照元リンク（別タブで開く）

  * Googleマップ店舗ページ（上記URL）
  * Places API ドキュメントURL（任意）
* Refresh ボタン
* fetchedAt（サーバ取得時刻 ISO）

---

### メイン表示（左右2ペイン）

#### 左：整形表示（normalized）

最低限、以下を表示する：

1. **今日の営業時間**

   * 例：

     * `本日：10:00 – 20:00`
     * `本日：定休日`
   * open/close が取れない場合は `UNKNOWN`

2. **曜日ごとの通常営業時間**

   * 月〜日を1行ずつ表示
   * APIが返す文字列表現を優先（無理な再整形はしない）

3. **臨時休業 / 特別営業時間**

   * Google APIレスポンス上で

     * 例外日
     * 特別営業時間
     * 本日が通常と異なる
       と判断できる情報があれば表示
   * 表示文言は例：

     * `本日は特別営業時間の可能性があります`
   * 取得できない場合・該当しない場合は **何も表示しない**

---

#### 右：Raw表示（必須）

* Place Details API のレスポンス全文
* `JSON.stringify(raw, null, 2)` で表示
* 折りたたみ可
* **Copyボタン常時表示**

---

## E. API仕様（営業日タブ専用）

### Route Handler

```
GET /api/fetch/business-hours
```

### 返却形式（必須）

既存と同じ **DebugEnvelope** を使用する。

```ts
type DebugEnvelope = {
  ok: boolean
  fetchedAt: string
  sources: { name: string; url: string }[]
  raw: unknown
  extracted?: unknown
  normalized?: NormalizedItem[]
  warnings?: string[]
  error?: { message: string; stack?: string }
}
```

---

## F. NormalizedItem（営業日タブ）

既存スキーマを拡張して使用する。

```ts
type ServiceKey =
  | "ANA"
  | "TOKAIKISEN"
  | "UMISORA_AOGASHIMA"
  | "ISLAND_SHUTTLE"
  | "BUSINESS_HOURS"
```

### 営業日タブで使う項目例

```ts
type NormalizedItem = {
  service: "BUSINESS_HOURS"
  title: string                  // "本日の営業時間" / "通常営業時間" など
  status?: "OPEN" | "CLOSED" | "UNKNOWN"
  note?: string                  // 臨時休業・特別営業時間などの注意文
  sourceUrls: string[]
}
```

※ 時刻文字列の細かい構造化は不要
※ Raw → extracted → normalized の段階が追えることを優先

---

## G. 実装タスク（営業日タブ分）

1. タブUIに「営業日」を追加
2. `/api/fetch/business-hours` を作成
3. Place ID をコードに直書き
4. Place Details API を叩き raw を返す
5. raw から

   * 今日の営業時間
   * 通常営業時間
   * 例外日情報
     を extracted に入れる
6. 最小限の normalized を作成
7. 整形できなくても raw は必ず返す

---

## H. 重要な注意（仕様固定）

* **Place ID 解決はこのタブの責務ではない**
* HTML解析・スクレイピングは禁止（APIのみ）
* 「臨時休業」という日本語文字列一致は要求しない
  → **APIレスポンスから判断できる範囲で注意表示**
* 技術検証なので「正確さ ＜ 追跡可能性」

---

以上が
**「Googleマップの八丈ストアの営業時間を取得するタブ」用の追記仕様書**です。

このまま既存仕様書の末尾に貼れば、
Codex／人間どちらが読んでも **迷わず実装できる状態**になっています。
