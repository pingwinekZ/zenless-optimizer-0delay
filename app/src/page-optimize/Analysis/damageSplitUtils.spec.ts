import { describe, expect, it } from 'vitest'
import { extractDamageByTag, extractDamageSplits } from './damageSplitUtils'
import type { PerActionDamage } from './ExpandedDataPanelController'

function action(
  name: string,
  value: number,
  damageType: string
): PerActionDamage {
  return {
    name,
    tag: { damageType1: damageType },
    value,
    calcResult: undefined,
    buffedStats: null,
    sources: [],
  } as unknown as PerActionDamage
}

describe('extractDamageSplits', () => {
  it('emits one segment per damaging action, colored by damage type', () => {
    const entries = extractDamageSplits([
      action('Basic.1', 100, 'basic'),
      action('Ult.1', 250, 'ult'),
    ])

    expect(entries.map((e) => e.name)).toEqual(['Basic.1', 'Ult.1'])
    expect(entries.map((e) => e.total)).toEqual([100, 250])
    expect(entries.map((e) => e.segments[0]!.damageType)).toEqual([
      'basic',
      'ult',
    ])
    // Distinct damage types must not share a color.
    expect(entries[0]!.segments[0]!.color).not.toBe(
      entries[1]!.segments[0]!.color
    )
  })

  it('skips actions with no damage', () => {
    const entries = extractDamageSplits([
      action('Basic.1', 100, 'basic'),
      action('Basic.2', 0, 'basic'),
    ])
    expect(entries.map((e) => e.name)).toEqual(['Basic.1'])
  })

  it('uses the supplied label function instead of the raw action name', () => {
    const raw = {
      name: 'Remielle.luminizeRainbowsEndDmgInst',
      tag: {
        sheet: 'Remielle',
        name: 'luminizeRainbowsEndDmgInst',
        damageType1: 'basic',
      },
      value: 100,
    } as unknown as PerActionDamage

    expect(extractDamageSplits([raw])[0]!.name).toBe(
      'Remielle.luminizeRainbowsEndDmgInst'
    )
    expect(
      extractDamageSplits([raw], (tag) => `localized:${tag.name}`)[0]!.name
    ).toBe('localized:luminizeRainbowsEndDmgInst')
  })

  it('falls back to the attribute when no damage type is authored', () => {
    const noType = {
      name: 'Skill.1',
      tag: { attribute: 'ice' },
      value: 50,
    } as unknown as PerActionDamage
    const entries = extractDamageSplits([noType])
    expect(entries[0]!.segments[0]!.damageType).toBe('ice')
  })
})

describe('extractDamageByTag', () => {
  it('aggregates by damage type, largest first, with shares summing to 1', () => {
    const slices = extractDamageByTag([
      action('Basic.1', 100, 'basic'),
      action('Basic.2', 100, 'basic'),
      action('Ult.1', 300, 'ult'),
    ])

    expect(slices.map((s) => s.damageType)).toEqual(['ult', 'basic'])
    expect(slices.map((s) => s.value)).toEqual([300, 200])
    const total = slices.reduce((sum, s) => sum + s.percent, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('returns nothing when there is no damage', () => {
    expect(extractDamageByTag([])).toEqual([])
    expect(extractDamageByTag([action('Basic.1', 0, 'basic')])).toEqual([])
  })
})
