import { describe, expect, it } from 'vitest'
import { getCharacterPriority, hasHigherPriority } from './characterPriority'

describe('getCharacterPriority', () => {
  it('returns index for characters in customSortOrder', () => {
    const order = ['Ellen', 'ZhuYuan', 'Lycaon']
    expect(getCharacterPriority('Ellen', order)).toBe(0)
    expect(getCharacterPriority('ZhuYuan', order)).toBe(1)
    expect(getCharacterPriority('Lycaon', order)).toBe(2)
  })

  it('returns Infinity for characters not in customSortOrder', () => {
    const order = ['Ellen', 'ZhuYuan']
    expect(getCharacterPriority('Lycaon', order)).toBe(Infinity)
  })

  it('returns Infinity for empty customSortOrder', () => {
    expect(getCharacterPriority('Ellen', [])).toBe(Infinity)
  })
})

describe('hasHigherPriority', () => {
  it('returns true when disc owner has higher priority', () => {
    const order = ['Ellen', 'ZhuYuan', 'Lycaon']
    expect(hasHigherPriority('Ellen', 'ZhuYuan', order)).toBe(true)
  })

  it('returns false when disc owner has lower priority', () => {
    const order = ['Ellen', 'ZhuYuan', 'Lycaon']
    expect(hasHigherPriority('Lycaon', 'ZhuYuan', order)).toBe(false)
  })

  it('returns false when disc owner has same priority', () => {
    const order = ['Ellen', 'ZhuYuan']
    expect(hasHigherPriority('Ellen', 'Ellen', order)).toBe(false)
  })

  it('returns false when disc owner is not in priority list', () => {
    const order = ['Ellen', 'ZhuYuan']
    expect(hasHigherPriority('Lycaon', 'Ellen', order)).toBe(false)
  })
})
