import {
  decompressB64Gzip,
  decompressGzipString,
  isGzipString,
} from '@zenless-optimizer/common/util'

/**
 * Decode a serialized database-slot payload, accepting every encoding we have
 * ever written:
 *
 * - current: gzip as a Latin-1 string (see `compressToGzipString`)
 * - legacy: gzip + base64
 * - legacy: plain JSON
 *
 * Returns an empty object for malformed values.
 */
export function decodeSlotPayload(raw: string): Record<string, string> {
  if (isGzipString(raw)) {
    try {
      return JSON.parse(decompressGzipString(raw))
    } catch {
      return {}
    }
  }
  try {
    return JSON.parse(raw)
  } catch {
    // Not legacy plain JSON - try the legacy compressed form
  }
  try {
    return JSON.parse(decompressB64Gzip(raw))
  } catch {
    return {}
  }
}

/** Read and decode a database-slot payload from a storage, or `{}` if absent. */
export function readSlotPayload(
  storage: Storage,
  slotKey: string
): Record<string, string> {
  const raw = storage.getItem(slotKey)
  if (!raw) return {}
  return decodeSlotPayload(raw)
}
