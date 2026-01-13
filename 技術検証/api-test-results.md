# API Smoke Test Results

- timestamp: 2026-01-12T05:14:20.604Z
- baseUrl: http://localhost:3000

| endpoint | status | ok | warnings | normalized | error |
| --- | --- | --- | --- | --- | --- |
| /api/fetch/tokaikisen | 200 | true | 2 | 0 |  |
| /api/fetch/umisora | 200 | true | 2 | 0 |  |
| /api/fetch/weather/wind | 200 | true | 0 | 4 |  |
| /api/fetch/weather/wave | 200 | true | 1 | 8 |  |
| /api/fetch/weather/typhoon | 200 | true | 1 | 0 |  |

## Raw Snippets (failed or warnings)

### /api/fetch/tokaikisen

```text
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="format-detection" content="telephone=no">
  
  <title>本日の運航状況｜伊豆諸島へ行く船旅・ツアー｜東海汽船 </title>
  <meta name="description" content="東海汽船の就欠航など本日の運航状況をお知らせします。">
  
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="東海汽船株式会社 | 伊豆諸島へ行く船旅・ツアー" />
  <meta property="og:url" content="https://www.tokaikisen.co.jp/schedule/" />
  <meta property="og:title" content="本日の運航状況｜伊豆諸島へ行く船旅・ツアー｜東海汽船 " />
  <meta property="og:description" content="東海汽船の就欠航など本日の運航状況をお知らせします。" />
  <meta property="og:image" content="https://www.tokaikisen.co.jp/assets/img/site/ogp.png" />
 
```

### /api/fetch/umisora

```text
<!DOCTYPE html><html lang="ja"><link rel="preload" as="image" href="/wp-content/themes/tokyoisland/dist/ca5f462d66545111f67a.webp" /> <head> <title>青ヶ島の運航状況 | 東京宝島うみそら便</title><meta name="description" content="青ヶ島の運航状況のページ。東京宝島うみそら便は伊豆諸島・小笠原諸島への行き方、アクセス方法をリアルタイムでお知らせ！フェリー・飛行機・へリコプター・高速ジェット船など各交通手段を一括で検索できるサービスです。"/><link rel="alternate" hreflang="ja" href="https://www.islandaccess.metro.tokyo.lg.jp/traffic/aogashima/" /><link rel="alternate" hreflang="en" href="https://www.islandaccess.metro.tokyo.lg.jp/en/traffic/aogashima/" /><link rel="alternate" hreflang="zh-Hans" href="https://www.islandaccess.metro.tokyo.lg.jp/zh/traffic/aogashima/" /><link rel="alternate" hreflang="zh-Hant" href="https://www.islandaccess.metro.tokyo.lg.jp/cn/traffic/aogashima/" /><link rel="alternate" hreflang="ko" 
```

### /api/fetch/weather/wave

```text
{
  "sokodo": {
    "latitude": 33.125,
    "longitude": 139.79167,
    "generationtime_ms": 0.09417533874511719,
    "utc_offset_seconds": 32400,
    "timezone": "Asia/Tokyo",
    "timezone_abbreviation": "GMT+9",
    "elevation": 168,
    "hourly_units": {
      "time": "iso8601",
      "wave_height": "m",
      "wave_period": "s",
      "swell_wave_direction": "°"
    },
    "hourly": {
      "time": [
        "2026-01-12T00:00",
        "2026-01-12T01:00",
        "2026-01-12T02:00",
        "2026-01-12T03:00",
        "2026-01-12T04:00",
        "2026-01-12T05:00",
        "2026-01-12T06:00",
        "2026-01-12T07:00",
        "2026-01-12T08:00",
        "2026-01-12T09:00",
        "2026-01-12T10:00",
        "2026-01-12T11:00",
        "2026-01-12T12:00",
        "2026-01-12T13:00",
```

### /api/fetch/weather/typhoon

```text
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" lang="ja">
  <title>高頻度（随時）</title>
  <subtitle>JMAXML publishing feed</subtitle>
  <updated>2026-01-12T13:02:16+09:00</updated>
  <id>https://www.data.jma.go.jp/developer/xml/feed/extra.xml#short_1768190536</id>
  <link rel="related" href="https://www.jma.go.jp/"/>
  <link rel="self" href="https://www.data.jma.go.jp/developer/xml/feed/extra.xml"/>
  <link rel="hub" href="http://alert-hub.appspot.com/"/>
  <rights type="html"><![CDATA[
<a href="https://www.jma.go.jp/jma/kishou/info/coment.html">利用規約</a>,
<a href="https://www.jma.go.jp/jma/en/copyright.html">Terms of Use</a>
]]></rights>
  <entry>
    <title>気象特別警報・警報・注意報</title>
    <id>https://www.data.jma.go.jp/developer/xml/data/20260112040205_0_VPWW53_2500
```
