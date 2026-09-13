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
