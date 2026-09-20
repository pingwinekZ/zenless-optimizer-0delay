import { allWengineKeys } from '../consts'
import { getWengineStat, getWengineStats } from './wengine'

// Reproduction for: equipping an Armorer w-engine (e.g. CrimsonThirst) only
// showed the sub stat (DEF 48%) — the main stat (Base DEF 431) was missing
// because the pipeline hardcoded every w-engine main stat as Base ATK.
describe('Wengine base stats', () => {
  it('CrimsonThirst (Armorer) is parsed with Base DEF', () => {
    const stat = getWengineStat('CrimsonThirst')
    expect(stat.type).toBe('armorer')
    expect(stat.baseStatkey).toBe('def_base')
    expect(stat.baseStatvalue).toBe(29)
  })

  it('non-Armorer w-engines are still parsed with Base ATK', () => {
    const stat = getWengineStat('ZanshinHerbCase')
    expect(stat.type).toBe('attack')
    expect(stat.baseStatkey).toBe('atk_base')
    expect(stat.baseStatvalue).toBe(48)
  })

  it('Armorer ⟺ def_base across all w-engines', () => {
    for (const key of allWengineKeys) {
      const stat = getWengineStat(key)
      if (stat.type === 'armorer') {
        expect(stat.baseStatkey, `${key} should have def_base`).toBe('def_base')
      } else {
        expect(stat.baseStatkey, `${key} should have atk_base`).toBe('atk_base')
      }
    }
  })

  it('CrimsonThirst at L60/M5 gives 431 Base DEF and 48% DEF', () => {
    const stats = getWengineStats('CrimsonThirst', 60, 5, 5)
    // 29 * (1 + 9.409 + 0.8922 * 5) ≈ 431.23, floored to 431 in-game
    expect(stats['def_base']).toBeCloseTo(431, 0)
    expect(Math.floor(stats['def_base'])).toBe(431)
    // 0.192 * (1 + 0.3 * 5) = 0.48
    expect(stats['def_']).toBeCloseTo(0.48)
    expect(stats['atk_base']).toBeUndefined()
  })

  it('ATK w-engine stats are unaffected', () => {
    const stats = getWengineStats('ZanshinHerbCase', 60, 5, 5)
    // 48 * (1 + 9.409 + 0.8922 * 5) ≈ 713.76, floored to 713 in-game
    expect(stats['atk_base']).toBeCloseTo(714, 0)
    expect(Math.floor(stats['atk_base'])).toBe(713)
    expect(stats['def_base']).toBeUndefined()
  })
})
