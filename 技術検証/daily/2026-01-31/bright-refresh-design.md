# /bright 更新ボタンの詳細設計（最新取得まで実行）

## 目的
- `/bright` の「更新」操作で、最新データの取得（外部参照→正規化）と保存を行い、画面表示も最新にする。
- 既存の取得エンドポイントと保存機構を流用し、変更点を最小化する。

## 現状の仕組み（前提）
- `/bright` は `fetchSavedEnvelope` で `api/debug/read-report` の保存済みデータを読むだけ。
- 取得・保存の実行は `/`（交通）や `/weather` のデバッグUIに存在し、`/bright` の更新リンクは単なる再読み込み。
- 保存は `app/api/debug/save-report` が Supabase の `hachijo_debug_reports` を upsert。

## 追加設計（提案）

### 1. 新規API: `/api/debug/refresh-bright` (POST)
- 役割: `/bright` が必要とするキーの取得と保存を一括実行。
- 対象キーと取得元:
  - `tokaikisen` -> `/api/fetch/tokaikisen`
  - `umisora` -> `/api/fetch/umisora`
  - `wave` -> `/api/fetch/weather/wave`
  - `wind` -> `/api/fetch/weather/wind`
  - `typhoon` -> `/api/fetch/weather/typhoon`

#### 実行フロー（概念）
```
POST /api/debug/refresh-bright
  1) baseUrl を決定
  2) 対象エンドポイントを並列取得
  3) 各結果を /api/debug/save-report へ保存
  4) 処理結果をまとめて返却
```

#### レスポンス例（案）
```json
{
  "ok": true,
  "results": {
    "tokaikisen": { "ok": true, "fetchedAt": "2026-01-31T00:00:00Z" },
    "umisora": { "ok": true, "fetchedAt": "2026-01-31T00:00:00Z" },
    "wave": { "ok": true, "fetchedAt": "2026-01-31T00:00:00Z" },
    "wind": { "ok": true, "fetchedAt": "2026-01-31T00:00:00Z" },
    "typhoon": { "ok": true, "fetchedAt": "2026-01-31T00:00:00Z" }
  },
  "tookMs": 1234
}
```

#### エラーハンドリング方針
- 取得に失敗した場合も、`ok=false` の `DebugEnvelope` を生成して保存する。
- 1件失敗しても他の取得は継続する（部分成功を許容）。

### 2. `/bright` 側の更新ボタン
- 目的: 取得APIを実行したあとに画面を再描画する。
- 実装方針（案）
  - 小さなクライアントコンポーネントを用意し、ボタン押下で以下を実行:
    1) `fetch('/api/debug/refresh-bright', { method: 'POST' })`
    2) `router.refresh()` でサーバーコンポーネントの再取得
  - ボタンは「更新中」状態（disabled + 文言切替）を持たせる。

## 想定される影響範囲
- 追加ファイル
  - `app/api/debug/refresh-bright/route.ts`
- 変更ファイル
  - `app/bright/page.tsx`（更新ボタンをクライアント化）
  - もしくは `app/bright/components/RefreshButton.tsx` などの新規作成

## セキュリティ/運用メモ
- 現状の debug API は公開アクセス前提の設計に見えるため、必要に応じて簡易認証や IP 制限を検討。
- Supabase 設定が無い場合は `save-report` が 503 を返すため、UI上で失敗表示が必要。

## 更新後の動作イメージ
1. ユーザーが `/bright` の「更新」を押す。
2. `refresh-bright` が外部参照を取得し、Supabase に保存。
3. 画面が再取得され、最新の `fetchedAt` と内容が反映される。

