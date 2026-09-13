import { compressToB64Gzip, decompressB64Gzip } from './compress'

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
})
