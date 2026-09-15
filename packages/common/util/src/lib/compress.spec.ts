import {
  compressToB64Gzip,
  compressToGzipString,
  decompressB64Gzip,
  decompressGzipString,
  isGzipString,
} from './compress'

describe('test @zenless-optimizer/common/util/compress', function () {
  it('round-trips JSON through b64 gzip', () => {
    const json = JSON.stringify({ a: 1, b: 'test', c: [1, 2, 3] })
    expect(decompressB64Gzip(compressToB64Gzip(json))).toEqual(json)
  })
  it('compresses repetitive DB-like payloads substantially', () => {
    const json = JSON.stringify(
      Array.from({ length: 100 }, (_, i) => ({
        id: `disc_${i}`,
        mainStat: 'atk',
        subStats: [10, 20, 30, 40],
      }))
    )
    expect(compressToB64Gzip(json).length).toBeLessThan(json.length / 2)
  })
  it('throws on malformed input', () => {
    expect(() => decompressB64Gzip('!!!not-valid-b64!!!')).toThrow()
  })

  describe('gzip as a Latin-1 string', () => {
    // Arbitrary bytes must survive the string round trip, since gzip output
    // uses the whole 0-255 range.
    const json = JSON.stringify({
      unicode: 'ZZZ 絶区 — ünïcode',
      bytes: Array.from({ length: 256 }, (_, i) => i),
      rows: Array.from({ length: 50 }, (_, i) => ({
        id: `zzz_disc_${i}`,
        setKey: 'FangedMetal',
        substats: [{ key: 'atk_', upgrades: 2 }],
      })),
    })

    it('round-trips JSON', () => {
      expect(decompressGzipString(compressToGzipString(json))).toEqual(json)
      expect(isGzipString(compressToGzipString(json))).toBe(true)
    })
    it('decodes an unprefixed Latin-1 payload too', () => {
      const prefixed = compressToGzipString(json)
      expect(decompressGzipString(prefixed.slice(2))).toEqual(json)
    })
    it('stores ~25% less than base64 for the same data', () => {
      expect(compressToGzipString(json).length).toBeLessThan(
        compressToB64Gzip(json).length
      )
    })
    it('throws on malformed input', () => {
      expect(() => decompressGzipString('g:!!!not-gzip!!!')).toThrow()
    })
  })
})
