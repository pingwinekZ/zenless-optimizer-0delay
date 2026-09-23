import { describe, expect, it } from 'vitest'
import {
  damageTypeColor,
  damageTypeLabel,
  tagDamageType,
  tagDamageTypes,
} from './damageTypes'

describe('damageType colors and labels', () => {
  it('colors every known damage type and greys the unknown ones', () => {
    expect(damageTypeColor('basic')).toMatch(/^#[0-9a-f]{6}$/i)
    expect(damageTypeColor('notARealType')).toBe('#8c8c8c')
  })

  it('labels known keys and passes unknown ones through', () => {
    expect(damageTypeLabel('exSpecial')).toBe('EX Special')
    expect(damageTypeLabel('mystery')).toBe('mystery')
  })
})

describe('tagDamageTypes', () => {
  it('returns both damage tags, primary first', () => {
    expect(
      tagDamageTypes({
        q: 'standardDmg',
        damageType1: 'ult',
        damageType2: 'elemental',
      })
    ).toEqual(['ult', 'elemental'])
  })

  it('falls back to the attribute when the tag deals no damage', () => {
    // `daze` is not a damage formula, so `getDmgType` yields nothing.
    expect(tagDamageTypes({ q: 'daze', attribute: 'fire' })).toEqual(['fire'])
  })

  it('prefers damageType1 over the attribute for the primary type', () => {
    expect(
      tagDamageType({
        q: 'standardDmg',
        damageType1: 'special',
        attribute: 'ice',
      })
    ).toBe('special')
  })
})
