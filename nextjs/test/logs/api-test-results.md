# API Smoke Test Results

- timestamp: 2026-01-12T06:58:50.634Z
- baseUrl: http://localhost:3000

| endpoint | status | ok | warnings | normalized | error |
| --- | --- | --- | --- | --- | --- |
| /api/fetch/tokaikisen | 200 | true | 0 | 3 |  |
| /api/fetch/umisora | 200 | true | 0 | 4 |  |
| /api/fetch/weather/wind | 200 | true | 0 | 4 |  |
| /api/fetch/weather/wave | 200 | true | 1 | 8 |  |
| /api/fetch/weather/typhoon | 200 | true | 1 | 0 |  |

## Raw Snippets (failed or warnings)

### /api/fetch/weather/wave

```text
{
  "sokodo": {
    "latitude": 33.125,
    "longitude": 139.79167,
    "generationtime_ms": 0.11837482452392578,
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
  <updated>2026-01-12T15:57:24+09:00</updated>
  <id>https://www.data.jma.go.jp/developer/xml/feed/extra.xml#short_1768201044</id>
  <link rel="related" href="https://www.jma.go.jp/"/>
  <link rel="self" href="https://www.data.jma.go.jp/developer/xml/feed/extra.xml"/>
  <link rel="hub" href="http://alert-hub.appspot.com/"/>
  <rights type="html"><![CDATA[
<a href="https://www.jma.go.jp/jma/kishou/info/coment.html">利用規約</a>,
<a href="https://www.jma.go.jp/jma/en/copyright.html">Terms of Use</a>
]]></rights>
  <entry>
    <title>気象警報・注意報（Ｈ２７）</title>
    <id>https://www.data.jma.go.jp/developer/xml/data/20260112065719_0_VPWW54_3500
```
