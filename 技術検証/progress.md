# 進捗管理表

更新方針: タスク開始/完了の都度この表を更新する。

| ID | タスク | 状態 | メモ |
| --- | --- | --- | --- |
| 0-1 | 共通準備: DebugEnvelope/スキーマ整理 | 完了 | lib/debug + lib/schema を作成 |
| 0-2 | 共通準備: lib/http 共通fetch | 完了 | fetchJson/fetchText を追加 |
| 0-3 | 共通準備: Raw+Copy UI共通化 | 完了 | lib/components/RawViewer.tsx を追加 |
| 0-4 | 共通準備: 座標定数投入 | 完了 | lib/geo/points.ts を追加 |
| 0-5 | 共通準備: envキー雛形 | 完了 | nextjs/.env.local.example を追加 |
| 1-1 | 交通UI骨格 | 完了 | app/page.tsx + globals.css を更新 |
| 1-2 | ANA API | 完了 | ODPT取得 + 抽出/整形まで実装 |
| 1-3 | 東海汽船（運航状況） | 完了 | h2直下table抽出で実装 |
| 1-4 | うみそら便（青ヶ島/ヘリ） | 完了 | h3直下table抽出で実装 |
| 2-1 | Weather UI骨格 | 完了 | app/weather/page.tsx を追加 |
| 2-2 | 風（Open-Meteo） | 完了 | Open-Meteo wind API 実装 |
| 2-3 | 波（Open-Meteo Marine） | 完了 | Marine API 実装 + warnings |
| 2-4 | 台風（気象庁XML） | 未着手 | |
| 3-1 | 営業日タブUI追加 | 未着手 | |
| 3-2 | 営業日 API | 未着手 | |
| 3-3 | 営業日 抽出・整形 | 未着手 | |

## 進捗率と作業内容

- 進捗率: 12/16 完了（約75%）
- 完了済み作業内容:
  - 共通準備（DebugEnvelope/スキーマ、fetch共通、RawViewer、座標定数、env雛形）
  - 交通UI骨格
  - ANA API（ODPT取得・抽出・整形）
  - 東海汽船（運航状況抽出）
  - うみそら便（青ヶ島/ヘリ抽出）
  - Weather UI骨格
  - 風（Open-Meteo）
  - 波（Open-Meteo Marine）
- 未完了の作業内容:
  - 台風（気象庁XML）
  - 営業日タブUI追加
  - 営業日API
  - 営業日 抽出・整形
