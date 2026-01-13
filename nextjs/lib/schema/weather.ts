export type WeatherServiceKey = "WEATHER_WAVE" | "WEATHER_WIND" | "WEATHER_TYPHOON"

export type Horizon = "TODAY" | "PLUS_24H" | "PLUS_72H" | "PLUS_7D"

export type WeatherNormalizedItem = {
  service: WeatherServiceKey
  horizon: Horizon
  port?: "底土" | "八重根"
  point?: "HACHIJO_CENTER"
  waveHeightM?: number
  wavePeriodS?: number
  swellDirectionDeg?: number
  windSpeedMs?: number
  windGustMs?: number
  windDirectionDeg?: number
  typhoonId?: string
  typhoonName?: string
  typhoonDistanceKm?: number
  forecastCircles?: unknown
  stormZone?: unknown
  time?: string
  note?: string
  sourceUrls: string[]
}
