import { resolveEngine } from './engineSelection'

describe('resolveEngine', () => {
  it('defaults to gpu when unconfigured and available', () => {
    expect(resolveEngine(undefined, true)).toBe('gpu')
  })
  it('falls back to cpu when gpu is requested but unavailable', () => {
    expect(resolveEngine('gpu', false)).toBe('cpu')
  })
  it('keeps gpu when available', () => {
    expect(resolveEngine('gpu', true)).toBe('gpu')
  })
  it('keeps cpu when explicitly selected', () => {
    expect(resolveEngine('cpu', true)).toBe('cpu')
    expect(resolveEngine('cpu', false)).toBe('cpu')
  })
})
