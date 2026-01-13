以下は本プロジェクトで必要になる API キーの取得手順です。
ODPT は審査制なので「申請後の待ち」も含めています。

---

# 1) ODPT（公共交通オープンデータセンター）
用途: `/api/fetch/ana`

## 手順
1. 開発者サイトにアクセス  
   https://developer.odpt.org/
2. アカウント登録フォームを送信  
3. 事務局の確認完了メールを待つ（最大2営業日）  
4. ログイン後、アプリ登録を行う  
5. consumerKey（APIキー）を発行  
6. `nextjs/.env.local` に設定  
   `ODPT_CONSUMER_KEY=...`

## 参考リンク（データセット）
- ANA 出発: https://ckan.odpt.org/dataset/a_flight_departure_info-ana/resource/a818a729-516a-48d5-ab83-e2b82bb225b7
- ANA 到着: https://ckan.odpt.org/dataset/a_flight_arrival_info-ana/resource/39f29539-2ec4-4bb8-8a54-0846352ebd83

---

# 2) Google Places API（Google Maps Platform）
用途: `/api/fetch/business-hours`

## 手順
1. Google Cloud Console にアクセス  
   https://console.cloud.google.com/
2. プロジェクトを作成  
3. 請求先アカウントを有効化（Places APIは必須）  
4. API Library で Places API を有効化  
   https://console.cloud.google.com/apis/library
5. 認証情報から API キーを作成  
   https://console.cloud.google.com/apis/credentials
6. API キー制限（推奨）  
   - API制限: Places API のみに限定
7. `nextjs/.env.local` に設定  
   `GOOGLE_MAPS_API_KEY=...`

## 参考リンク（ドキュメント）
- Places API 概要: https://developers.google.com/maps/documentation/places/web-service/overview

---

# 3) `.env.local` 設定場所
`nextjs/.env.local` を作成して以下を設定します。

```text
ODPT_CONSUMER_KEY=
GOOGLE_MAPS_API_KEY=
```

※ `.env.local` はGitに入れない。
