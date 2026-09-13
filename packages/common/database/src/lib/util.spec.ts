import { compressToB64Gzip } from '@zenless-optimizer/common/util'
import { loadJsonOrB64GzipFromStorage } from './util'

// bun test has no DOM localStorage — stub an in-memory equivalent
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  configurable: true,
})

describe('loadJsonOrB64GzipFromStorage', () => {
  const key = 'test_extraDatabase_2'
  afterEach(() => localStorage.removeItem(key))

  it('returns {} for a missing key', () => {
    expect(loadJsonOrB64GzipFromStorage(key)).toEqual({})
  })
  it('reads legacy plain-JSON values', () => {
    const obj = { a: JSON.stringify(1), b: JSON.stringify('x') }
    localStorage.setItem(key, JSON.stringify(obj))
    expect(loadJsonOrB64GzipFromStorage(key)).toEqual(obj)
  })
  it('round-trips values produced by compressToB64Gzip', () => {
    const obj = { a: JSON.stringify([1, 2, 3]) }
    localStorage.setItem(key, compressToB64Gzip(JSON.stringify(obj)))
    expect(loadJsonOrB64GzipFromStorage(key)).toEqual(obj)
  })
  it('returns {} for malformed values', () => {
    localStorage.setItem(key, '!!!not-json-or-gzip!!!')
    expect(loadJsonOrB64GzipFromStorage(key)).toEqual({})
  })
})
