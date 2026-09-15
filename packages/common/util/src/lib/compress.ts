import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate'

function u8ToB64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function b64ToU8(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** gzip-compress a JSON string and encode as base64 for localStorage */
export function compressToB64Gzip(json: string): string {
  return u8ToB64(gzipSync(strToU8(json)))
}

/** decode a base64 gzip string (produced by {@link compressToB64Gzip}) back to JSON */
export function decompressB64Gzip(b64: string): string {
  return strFromU8(gunzipSync(b64ToU8(b64)))
}

/**
 * Marker prefix for gzip payloads stored as a raw Latin-1 string instead of
 * base64. Base64 costs 4 stored characters per 3 compressed bytes, so the raw
 * form is ~25% smaller for the same data. Every byte value survives a
 * localStorage round trip untouched, and the prefix (never produced by base64
 * or JSON) identifies the encoding on read.
 */
export const gzipStringPrefix = 'g:'

/**
 * gzip-compress a JSON string into a Latin-1 string (one stored character per
 * compressed byte), prefixed with {@link gzipStringPrefix}.
 */
export function compressToGzipString(json: string): string {
  return gzipStringPrefix + strFromU8(gzipSync(strToU8(json)), true)
}

/** Whether `str` was produced by {@link compressToGzipString} */
export function isGzipString(str: string): boolean {
  return str.startsWith(gzipStringPrefix)
}

/**
 * Decode a payload produced by {@link compressToGzipString}. Accepts both the
 * prefixed form and a bare Latin-1 gzip string.
 */
export function decompressGzipString(str: string): string {
  const payload = isGzipString(str) ? str.slice(gzipStringPrefix.length) : str
  return strFromU8(gunzipSync(strToU8(payload, true)))
}
