以下は **「これを見れば Codex が迷わず技術検証ページを実装できる」**ことを目的に、
**参照元URL・各サイトの構造・取得対象箇所・返却データ形式・画面構成・実装タスク**まで、全部込みで書いた指示文です。

---

# 技術検証ページ（Next.js / Vercel前提）実装 指示文（完全版）

## 0. 目的（この検証で“成立”とみなす条件）

* **Vercel上で動く** Next.js（App Router）アプリを作り、1ページに運行情報を表示する
* 対象は4つ（4タブ固定）

  1. ANA（ODPT API）
  2. 東海汽船（大型客船：東京⇄八丈島）
  3. 青ヶ島（正ソース：東京都「うみそら便」）
  4. ヘリ（正ソース：東京都「うみそら便」＋参照リンク：東京愛らんどシャトル）
* 検証なので **更新は手動ボタン**でOK
* 各タブで必ず以下を同時表示できること

  * **整形データ（必要な項目だけ）**
  * **Rawデータ（取得したJSON/HTML全文）を“邪魔にならない”形で表示＋ワンクリックコピー**
* 整形が失敗しても、**Rawが残り、失敗箇所が追える**こと（これが最重要）

---

## 1. 参照元リンク（検証ページに必ず載せるURL）

※検証ページの各タブ上部に「参照元（別タブで開く）」として固定表示する。
（URLは出典・デバッグに必須なので必ずコード内にベタ書きで持つ）

```text
[ANA / ODPT]
- ANA リアルタイム出発情報（ODPT FlightInformationDeparture）
  https://api.odpt.org/api/v4/odpt:FlightInformationDeparture?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY
  (データセット説明) https://ckan.odpt.org/dataset/a_flight_departure_info-ana/resource/a818a729-516a-48d5-ab83-e2b82bb225b7
- ANA リアルタイム到着情報（ODPT FlightInformationArrival）
  https://api.odpt.org/api/v4/odpt:FlightInformationArrival?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY
  (データセット説明) https://ckan.odpt.org/en/dataset/a_flight_arrival_info-ana/resource/39f29539-2ec4-4bb8-8a54-0846352ebd83

[東海汽船]
- 本日の運航状況（八丈島発着セクションがある）
  https://www.tokaikisen.co.jp/schedule/
- 時刻表（到着予定時刻を補う用途。ページ内から八丈島発着の時刻表へ辿る）
  https://www.tokaikisen.co.jp/boarding/timetable/

[青ヶ島（正ソース：東京都 うみそら便）]
- 青ヶ島の運航状況（海の便/ヘリ等の当日情報が集約され、更新時刻が明示される）
  https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/
- うみそら便 運航状況TOP（参考）
  https://www.islandaccess.metro.tokyo.lg.jp/traffic/

[青ヶ島丸（参照リンク：伊豆諸島開発）]
- 八丈島⇔青ヶ島（時刻表・注意事項）
  https://izu-syotou.jp/route01/

[ヘリ（参照リンク：東京愛らんどシャトル）]
- 東京愛らんどシャトル（当日の便一覧がテキストで出る）
  https://tohoair-tal.jp/
- 路線・時刻表（ダイヤ参照）
  https://tohoair-tal.jp/ext/timetable.html
```

根拠：ODPTのANA到着/出発API URLがCKANに明記されている。([公共交通オープンデータセンター][1])
東海汽船の運航状況ページ（八丈島発着セクション）URL。([tokaikisen.co.jp][2])
うみそら便青ヶ島ページURLと、更新方針の説明がページ上にある。([islandaccess.metro.tokyo.lg.jp][3])
東京愛らんどシャトルはトップに当日便が列挙され、時刻表ページもある。([東京愛らんどシャトル][4])
伊豆諸島開発の八丈島⇔青ヶ島時刻表ページ。([izu-syotou.jp][5])

---

## 2. 取得したい整形項目（4交通共通の“見たい項目”）

最低限、各タブで以下を整形表示する（取れない場合は `UNKNOWN` / `undefined` で可）

* 運航ステータス（就航/欠航/条件付き/不明）
* 出発予定時刻
* 到着予定時刻
* 遅延（数値がある場合のみ）
* 見込み時刻（あれば）
* 備考（あれば）
* 最終更新時刻（参照元ページに書いてある場合はそれを表示）

---

## 3. 各サイトの構造と「どの部分を取るか」（最重要）

### 3-A. ANA（ODPT API：JSON）

**取得元：ODPT API（JSON）**

* 出発：`odpt:FlightInformationDeparture` ([公共交通オープンデータセンター][1])
* 到着：`odpt:FlightInformationArrival` ([公共交通オープンデータセンター][6])
  consumerKeyは `.env` の `ODPT_CONSUMER_KEY` から読む。

**対象便（固定）**

* HND→HAC：ANA1891 / ANA1893 / ANA1895
* HAC→HND：ANA1892 / ANA1894 / ANA1896

**取得箇所（JSON内）**

* 取得したJSON配列から、「便名（1891等）」でフィルタする
* フィールド名はODPT仕様に依存するため、まずは **rawを表示**し、そこから確実に取れるキーを採用する
* “公式一致”が必須なので、便ごとの「予定/見込み/遅延」がODPTで取れる範囲を、そのまま表示する

> このタブは「APIの構造が変わらない」前提で、整形は比較的安定する
> ただし“どのキーが公式表示に対応するか”は rawを見て確定する

---

### 3-B. 東海汽船（公式HTML：運航状況＋時刻表）

**取得元（2ページ）**

1. 本日の運航状況：`/schedule/` ([tokaikisen.co.jp][2])
2. 時刻表（到着予定補完）：`/boarding/timetable/` ([tokaikisen.co.jp][7])

**運航状況ページの構造（/schedule/）**

* ページ内に「八丈島発着」という見出しブロックがあり、その中に以下2つのサブ見出しがある ([tokaikisen.co.jp][2])

  * 「八丈島行き」：東京発→八丈島着（“昨晩東京発→今朝八丈島着”もここに出る）
  * 「八丈島発」：八丈島発→東京行
* それぞれのサブ見出しの直下に **表（テーブル）**があり、列は概ね以下：([tokaikisen.co.jp][2])

  * 出航時刻
  * 発地（または行き先）
  * 船種（大型客船など）
  * 到着港
  * 運航状況（就航/欠航）
  * 備考（入港/出港済、注意文、遅延的情報が混ざる）

**このページから取るもの（整形）**

* 就航/欠航（運航状況列）
* 出発予定時刻（出航時刻列）
* 入出港地（到着港列、備考に出る場合もある）
* 遅延：**ページに数値が明示される場合のみ**抽出（なければ非表示でOK）
* 備考：テキストそのまま保持（後で整形キーを追加するため）

**重要制約**

* ページ自体に「到着時刻は時刻表をご確認ください」と明記がある。([tokaikisen.co.jp][2])
  → よって **到着予定は時刻表側から補完する**（運航状況ページ単体では不足）

**時刻表ページ（/boarding/timetable/）の扱い**

* このページは「時刻表への入口」兼、島別導線のページになっている ([tokaikisen.co.jp][7])
* 実装上は次をやる：

  1. `/boarding/timetable/` を取得して、ページ内のリンクから「八丈島発着の時刻表」へ辿る
  2. 八丈島発着の時刻表ページ（あるいはPDF）から到着予定時刻を取得
* 検証段階では、まず

  * 「時刻表ページ（または八丈島時刻表ページ）の raw を表示」
  * 「到着予定が載っている箇所を DOMで特定」
    まででOK（確実に取れる構造が確定したら整形を固める）

---

### 3-C. 青ヶ島（正ソース：東京都 うみそら便：公式HTML）

**取得元（正ソース）**

* `https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/` ([islandaccess.metro.tokyo.lg.jp][3])

**このページを“正”にする理由（仕様として固定）**

* 正しさ（公的集約）＋反映速度（当日運航の更新運用が明記） ([islandaccess.metro.tokyo.lg.jp][8])
* ページに「更新時刻」が明示されるため、情報の鮮度がUIで担保できる ([islandaccess.metro.tokyo.lg.jp][3])

**ページ構造（重要）**

* ページ上部に「本ページの情報は下記に掲載された更新時刻のもの」等があり、更新ルールが書かれている ([islandaccess.metro.tokyo.lg.jp][3])
* その下に当日運航の一覧（表形式）があり、少なくとも以下が並ぶ前提：

  * 交通種別（海/ヘリ等）
  * 区間（出発地→到着地）
  * 時刻
  * 運航状況
  * 備考

**このページから取るもの（整形）**

* 青ヶ島丸（八丈島⇄青ヶ島）の行
* 必須：就航/欠航、出発予定、到着予定（書かれていれば）
* 任意：見込み、遅延、備考、入出港地（書かれていれば）
* 最終更新時刻（ページ上の「◯◯現在」など）

> 重要：青ヶ島丸もヘリも、このタブは「うみそら便に書いてある表示」を正としてそのまま出す
> 参照リンク（伊豆諸島開発 / 東海汽船 / 愛らんどシャトル）は **“確認用”としてUIに置くだけ**（正データには混ぜない）

---

### 3-D. ヘリ（正ソース：うみそら便 ＋ 参照リンク：愛らんどシャトル）

**正ソース**

* うみそら便青ヶ島ページ（同上） ([islandaccess.metro.tokyo.lg.jp][3])

**参照リンク（別タブで開くための出典リンクとしてUIに置く）**

* 東京愛らんどシャトル：`https://tohoair-tal.jp/` ([東京愛らんどシャトル][4])

**東京愛らんどシャトル（tohoair-tal.jp）の構造**

* トップページに当日の便がテキストで列挙される。形式は概ね：([東京愛らんどシャトル][4])

  * `11便 八丈島→青ヶ島 09：40発 :就航`
* この形式は正規表現で抽出しやすい（便番号、区間、出発時刻、ステータス）。

**このタブで取るもの（整形）**

* うみそら便側のヘリ該当行（八丈島⇄青ヶ島）を整形して表示（正）
* 参考として、愛らんどシャトル側は “raw取得＋抽出結果”を表示しておく（突合・デバッグ用）

---

## 4. 技術方針（Vercel動作を崩さない）

* スクレイピングは原則 **fetch + HTMLパース（cheerio）**
* Playwright等のヘッドレスは検証段階では導入しない（Vercel運用が重くなる確率が高い）
* 取得時は以下を固定

  * User-Agentを明示
  * タイムアウト（例：10秒）
  * エラーは握りつぶさず、DebugEnvelopeで返す
* CORS回避のため、外部取得は必ず **Route Handler（サーバ側）**で行う

---

## 5. アプリ構成（ファイル/責務）

* `app/page.tsx`

  * 4タブUI、Refreshボタン、整形/Raw表示、Copyボタン、参照リンク表示
* `app/api/fetch/ana/route.ts`
* `app/api/fetch/tokaikisen/route.ts`
* `app/api/fetch/umisora/route.ts`
* `app/api/fetch/islandshuttle/route.ts`
* `lib/http/fetchHtml.ts`（UA/timeoutなど共通）
* `lib/parse/*`（サイト別パーサ）
* `lib/schema.ts`（共通型）
* `lib/debugEnvelope.ts`（DebugEnvelope生成）

---

## 6. 返却形式（Raw・抽出・整形が必ず追える）

### DebugEnvelope（APIは必ずこれで返す）

```ts
type DebugEnvelope = {
  ok: boolean
  fetchedAt: string            // サーバ取得時刻（ISO）
  sources: { name: string; url: string }[]
  raw: unknown                 // JSONならobject、HTMLならstring（全文）
  extracted?: unknown          // 中間結果（行配列、抽出したテキストなど）
  normalized?: NormalizedItem[]// 整形結果（共通スキーマ）
  warnings?: string[]          // “遅延が見つからない”等
  error?: { message: string; stack?: string }
}
```

### NormalizedItem（共通整形スキーマ）

```ts
type ServiceKey = "ANA" | "TOKAIKISEN" | "UMISORA_AOGASHIMA" | "ISLAND_SHUTTLE"
type Direction = "OUTBOUND" | "INBOUND"

type NormalizedItem = {
  service: ServiceKey
  direction?: Direction
  title: string
  status: "ON_TIME" | "DELAYED" | "CANCELLED" | "SUSPENDED" | "UNKNOWN"
  depPlanned?: string
  arrPlanned?: string
  depEstimated?: string
  arrEstimated?: string
  delayMinutes?: number
  port?: string
  note?: string
  sourceUrls: string[]
}
```

---

## 7. UI要件（“邪魔にならないRaw表示”＋即コピー）

### レイアウト（各タブ共通）

* 上：タイトル、参照元リンク（複数）、Refresh、fetchedAt
* 中：左右2ペイン

  * 左：整形（NormalizedItemのテーブル or カード）
  * 右：Raw（JSON/HTML）表示

    * デフォルトは **折りたたみ（collapsed）**でもよい
    * ただし **Copyボタンは常に見える**
    * Copyは `navigator.clipboard.writeText(文字列)` で実装
    * Rawは `JSON.stringify(raw, null, 2)`（HTMLはそのまま文字列）

### “整形失敗”を即把握する表示

* ok=false の場合、error.message を目立つラベルで表示
* ok=true でも normalized が空なら warnings を表示し、raw/extractedの確認を促せる状態にする

---

## 8. APIごとの実装タスク（Codexが迷わない順序）

### タスク0：骨格（最初にやる）

* 4つのRoute Handlerを作り、まずはダミーデータでも良いから DebugEnvelope を返す
* フロントで4タブ＋Refresh＋Raw表示＋Copyが動く状態を作る

### タスク1：ANA（ODPT）

* `.env.local` の `ODPT_CONSUMER_KEY` を読み、出発/到着APIを叩いて raw(JSON) を返す
* rawから対象6便をフィルタして extracted に入れる
* normalized へのマッピングは「rawを見て確定できるキー」から順に実装する

### タスク2：東海汽船（運航状況）

* `/schedule/` を取得し、HTML全文を raw に入れる
* DOMから「八丈島発着」ブロックを探し、

  * 「八丈島行き」テーブル
  * 「八丈島発」テーブル
    を抽出して extracted に入れる（まずは行配列＋列テキストでOK）
* normalized は、就航/欠航、出航時刻、備考をまず埋める
* 到着予定は「時刻表を補完する」ステップを別タスクに分離しておき、まずは warnings に「到着は時刻表で補完予定」と出す

### タスク3：東海汽船（時刻表補完）

* `/boarding/timetable/` を取得し、八丈島発着の時刻表ページ（またはPDF）へ辿る導線をDOMで特定
* そのページから到着予定時刻を抽出し、運航状況のnormalizedに結合する
* 結合キーは「便名がない可能性が高い」ため、当面は

  * 東京発22:30 → 八丈島着09:05 のような時刻帯対応
  * または固定の便（橘丸等）の表記
    を利用して“最小で成立する結合”を採用する（検証段階なので完全一致でなくても良いが、最終は公式一致）

### タスク4：うみそら便（青ヶ島：正ソース）

* `/traffic/aogashima/` を取得しHTML全文を raw に入れる
* 更新時刻表記（「◯◯現在」）を抽出して extracted/normalizedに反映
* 表から「八丈島⇄青ヶ島」関連の行を抽出して normalized を作る

  * 青ヶ島丸（海）
  * ヘリ（該当があれば）

### タスク5：愛らんどシャトル（参照用）

* `https://tohoair-tal.jp/` を取得して raw に入れる
* テキストの列挙部分を正規表現で抽出し extracted に入れる
* normalized は “参考”として出しても良いが、正はうみそら便なので、UI上は「参照」と分かる形にする

---

## 9. 重要な注意（検証が破綻しやすいポイント）

* HTML構造は変わる前提で、セレクタ固定よりも「見出しテキストでブロックを探す」方式に寄せる
  例：`八丈島発着` → 直下のテーブル、のように探索する
* 日本語の全角コロンや矢印（→）があるため、正規表現は全角対応する
  （例：`09：40` の `：` が全角）
* Rawは「整形に失敗しても必ず返す」
  → これがないとデバッグ不能になる

---

# ここまでを踏まえた“Codexに渡す最終指示”（コピペ用）

```text
Next.js(App Router) + TypeScript の技術検証ページを作る。
Vercel上で動くことが必須。更新は手動ボタン。

1ページで4タブ固定：
- ANA（ODPT API）
- 東海汽船（大型客船：東京⇄八丈島）
- 青ヶ島（正ソース：東京都 うみそら便）
- ヘリ（正ソース：うみそら便、参照リンク：東京愛らんどシャトル）

各タブは必ず「整形データ」と「Rawデータ全文」を同時に扱えること。
Rawは邪魔にならない見た目（折りたたみ可）で、必ずCopyボタンで即コピーできるようにする。

参照元リンクはタブ上部に固定表示し、別タブで開けるようにする。
参照元URLは以下（コード内で定数化）：
- ODPT 出発 https://api.odpt.org/api/v4/odpt:FlightInformationDeparture?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY
- ODPT 到着 https://api.odpt.org/api/v4/odpt:FlightInformationArrival?odpt:operator=odpt.Operator:ANA&acl:consumerKey=YOUR_KEY
- 東海汽船 運航状況 https://www.tokaikisen.co.jp/schedule/
- 東海汽船 時刻表 https://www.tokaikisen.co.jp/boarding/timetable/
- うみそら便 青ヶ島 https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/
- 伊豆諸島開発（参照） https://izu-syotou.jp/route01/
- 愛らんどシャトル（参照） https://tohoair-tal.jp/
- 愛らんどシャトル時刻表（参照） https://tohoair-tal.jp/ext/timetable.html

実装：
- app/page.tsx にUI（Tabs / Refresh / links / normalized table / raw viewer + copy）
- app/api/fetch/{ana,tokaikisen,umisora,islandshuttle}/route.ts を作り、外部取得は必ずサーバ側で行う
- fetchはUser-Agentとtimeoutを設定
- HTMLはcheerioでパースする

各APIは必ず DebugEnvelope で返す：
{ ok, fetchedAt, sources, raw(全文), extracted(中間), normalized(共通スキーマ配列), warnings, error }

共通スキーマ NormalizedItem は service/status/dep/arr/delay/note/sourceUrls を持つ。

サイトの構造に基づく抽出：
- 東海汽船 schedule はページ内の「八丈島発着」→「八丈島行き」「八丈島発」の各テーブル行を抽出する。
- うみそら便青ヶ島はページ上部の更新時刻表記と、一覧表から「八丈島⇄青ヶ島」の行を抽出する。
- 愛らんどシャトルはトップに「11便 八丈島→青ヶ島 09：40発 :就航」形式の列挙があるので正規表現で抽出する。

最初は骨格→Raw表示→extracted→normalized の順で、壊れてもデバッグできる状態を最優先で作る。
```

---

必要なら次は、上の仕様をさらに **「タスク分割（PR単位）」**にして、

* PR1：UI骨格＋DebugEnvelope表示
* PR2：ANA
* PR3：うみそら便
* PR4：東海汽船 schedule
* PR5：東海汽船 timetable補完
* PR6：愛らんどシャトル参照
  みたいに、Codexが順番に確実に終わらせられる形に落とします。

[1]: https://ckan.odpt.org/dataset/a_flight_departure_info-ana/resource/a818a729-516a-48d5-ab83-e2b82bb225b7?utm_source=chatgpt.com "リアルタイム出発情報 / Flight departure information"
[2]: https://www.tokaikisen.co.jp/schedule/?utm_source=chatgpt.com "本日の運航状況｜伊豆諸島へ行く船旅・ツアー"
[3]: https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/?utm_source=chatgpt.com "青ヶ島の運航状況 - 東京宝島うみそら便"
[4]: https://tohoair-tal.jp/?utm_source=chatgpt.com "東京愛らんどシャトル －予約・空席照会・運航情報－"
[5]: https://izu-syotou.jp/route01/?utm_source=chatgpt.com "八丈島⇔青ヶ島 | 伊豆諸島開発株式会社"
[6]: https://ckan.odpt.org/dataset/a_flight_arrival_info-ana/resource/39f29539-2ec4-4bb8-8a54-0846352ebd83?utm_source=chatgpt.com "リアルタイム到着情報 / Flight arrival information"
[7]: https://www.tokaikisen.co.jp/boarding/timetable/?utm_source=chatgpt.com "時刻表｜伊豆諸島へ行く船旅・ツアー"
[8]: https://www.islandaccess.metro.tokyo.lg.jp/traffic/?utm_source=chatgpt.com "運航状況 - 東京宝島うみそら便"
