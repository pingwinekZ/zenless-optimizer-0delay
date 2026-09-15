import {
  compressToB64Gzip,
  compressToGzipString,
} from '@zenless-optimizer/common/util'
import { decodeSlotPayload } from './util'

describe('decodeSlotPayload', () => {
  const obj = { a: JSON.stringify(1), b: JSON.stringify('x') }

  it('returns {} for an empty payload', () => {
    expect(decodeSlotPayload('')).toEqual({})
  })
  it('reads the current gzip-string encoding', () => {
    expect(
      decodeSlotPayload(compressToGzipString(JSON.stringify(obj)))
    ).toEqual(obj)
  })
  it('reads legacy plain-JSON values', () => {
    expect(decodeSlotPayload(JSON.stringify(obj))).toEqual(obj)
  })
  it('reads legacy base64-gzip values', () => {
    expect(decodeSlotPayload(compressToB64Gzip(JSON.stringify(obj)))).toEqual(
      obj
    )
  })
  it('returns {} for malformed values', () => {
    expect(decodeSlotPayload('!!!not-json-or-gzip!!!')).toEqual({})
    expect(decodeSlotPayload('g:!!!not-gzip!!!')).toEqual({})
  })
})
