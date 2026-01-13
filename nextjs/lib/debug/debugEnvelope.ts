export type DebugSource = {
  name: string
  url: string
}

export type DebugEnvelope<TNormalized = unknown, TExtracted = unknown, TRaw = unknown> = {
  ok: boolean
  fetchedAt: string
  sources: DebugSource[]
  raw: TRaw
  extracted?: TExtracted
  normalized?: TNormalized[]
  warnings?: string[]
  error?: {
    message: string
    stack?: string
  }
}

export function buildDebugEnvelope<TNormalized, TExtracted, TRaw>(
  params: DebugEnvelope<TNormalized, TExtracted, TRaw>
): DebugEnvelope<TNormalized, TExtracted, TRaw> {
  return params
}
