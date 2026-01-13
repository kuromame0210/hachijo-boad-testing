const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_USER_AGENT = "hachijo-tech-verify/1.0"

type FetchTextOptions = RequestInit & {
  timeoutMs?: number
}

export async function fetchText(
  url: string,
  options: FetchTextOptions = {}
): Promise<{ data: string; status: number }> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        ...headers,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`)
    }

    const data = await response.text()
    return { data, status: response.status }
  } finally {
    clearTimeout(timeoutId)
  }
}
