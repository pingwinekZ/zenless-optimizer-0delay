import { describe, expect, it } from 'vitest'
import { sliceBetween } from './sliceBetween'

const M1_DESC =
  'The Stun DMG Multiplier applied through <ct color=#FFFFFF>Core Passive: Soul-Searching Gaze</ct> is increased by an additional 20%. When activating <ct color=#FFFFFF>Basic Attack: Harmonizing Shot</ct>, the cooldown is reduced to 2s.'

describe('sliceBetween', () => {
  it('slices from the from marker through the sentence containing the to marker', () => {
    const result = sliceBetween(
      M1_DESC,
      'The Stun DMG Multiplier',
      'Soul-Searching Gaze'
    )
    expect(result).toBe(
      'The Stun DMG Multiplier applied through <ct color=#FFFFFF>Core Passive: Soul-Searching Gaze</ct> is increased by an additional 20%.'
    )
  })

  it('preserves markup in the slice', () => {
    const result = sliceBetween(
      M1_DESC,
      'The Stun DMG Multiplier',
      'Soul-Searching Gaze'
    )
    expect(result).toContain('<ct color=#FFFFFF>')
    expect(result).toContain('</ct>')
  })

  it('extends to the end of the string when the to sentence has no period', () => {
    const text = 'A sentence with a period. A trailing sentence without one'
    expect(sliceBetween(text, 'A trailing', 'without one')).toBe(
      'A trailing sentence without one'
    )
  })

  it('returns undefined when the from marker is missing', () => {
    expect(sliceBetween(M1_DESC, 'No such marker', 'Soul-Searching Gaze')).toBe(
      undefined
    )
  })

  it('returns undefined when the to marker is missing', () => {
    expect(
      sliceBetween(M1_DESC, 'The Stun DMG Multiplier', 'No such marker')
    ).toBe(undefined)
  })

  it('returns undefined when the to marker appears before the from marker', () => {
    expect(sliceBetween(M1_DESC, 'Soul-Searching Gaze', 'The Stun DMG')).toBe(
      undefined
    )
  })
})
