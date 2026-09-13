import { decompressB64Gzip } from '@zenless-optimizer/common/util'

/**
 * Load an extra-database slot from localStorage, accepting both the legacy
 * plain-JSON encoding and the compressed base64-gzip encoding.
 * Returns an empty object for missing keys or malformed values.
 */
export function loadJsonOrB64GzipFromStorage(
  dbName: string
): Record<string, string> {
  const raw = localStorage.getItem(dbName)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    // Not legacy JSON — try compressed form
  }
  try {
    return JSON.parse(decompressB64Gzip(raw))
  } catch {
    return {}
  }
}
