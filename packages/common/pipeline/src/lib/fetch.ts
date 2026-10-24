/** How many times a request is retried before giving up */
const FETCH_ATTEMPTS = 5
/** Timeout for a single request, in milliseconds */
const FETCH_TIMEOUT_MS = 60_000

/**
 * Fetches and parses a JSON document, retrying transient failures.
 *
 * Uses the runtime's own `fetch` (Node.js >= 18 / Bun) instead of shelling out
 * to `curl`, which does not exist everywhere and whose concurrent invocations
 * from many parallel downloads are what made the download step flaky.
 */
export async function fetchJsonFromUrl(url: string): Promise<unknown> {
  let lastError: unknown

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (err) {
      lastError = err
      if (attempt < FETCH_ATTEMPTS) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, 250 * 2 ** (attempt - 1))
        )
      }
    }
  }

  throw new Error(
    `Failed to fetch ${url} after ${FETCH_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
}
