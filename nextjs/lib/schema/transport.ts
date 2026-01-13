export type TransportServiceKey =
  | "ANA"
  | "TOKAIKISEN"
  | "UMISORA_AOGASHIMA"
  | "ISLAND_SHUTTLE"
  | "BUSINESS_HOURS"

export type Direction = "OUTBOUND" | "INBOUND"

export type TransportStatus =
  | "ON_TIME"
  | "DELAYED"
  | "CANCELLED"
  | "SUSPENDED"
  | "OPEN"
  | "CLOSED"
  | "UNKNOWN"

export type TransportNormalizedItem = {
  service: TransportServiceKey
  direction?: Direction
  title: string
  status?: TransportStatus
  statusText?: string
  depPlanned?: string
  arrPlanned?: string
  depEstimated?: string
  arrEstimated?: string
  delayMinutes?: number
  port?: string
  note?: string
  sourceUrls: string[]
}
