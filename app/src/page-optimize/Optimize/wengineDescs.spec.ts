import type { TagField } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactElement } from 'react'
import {
  condDescByName,
  condDescFallback,
  passiveDescByField,
  resolveCondDescOverride,
  resolvePassiveDescOverride,
} from './wengineDescs'

const tf = (name: string) => ({ fieldRef: { name } }) as unknown as TagField
const typeOf = (node: unknown) => (node as ReactElement | undefined)?.type

describe('desc tables', () => {
  it('cover every migrated override (pins accidental drops)', () => {
    const passiveEntries = Object.values(passiveDescByField).reduce(
      (n, byField) => n + Object.keys(byField ?? {}).length,
      0
    )
    const condEntries = Object.values(condDescByName).reduce(
      (n, byCond) => n + Object.keys(byCond ?? {}).length,
      0
    )
    expect(passiveEntries).toBe(48)
    expect(condEntries).toBe(64)
    expect(Object.keys(condDescFallback)).toEqual(['RoaringRide'])
  })
})

describe('resolvePassiveDescOverride', () => {
  it('resolves table hits to the per-wengine slice', () => {
    expect(
      typeOf(resolvePassiveDescOverride('DreamlitHearth', [tf('enerRegen')], 1))
    ).toBe(passiveDescByField['DreamlitHearth']?.['enerRegen'])
    expect(
      typeOf(
        resolvePassiveDescOverride('HalfSugarBunny', [tf('passive_atk_')], 1)
      )
    ).toBe(passiveDescByField['HalfSugarBunny']?.['passive_atk_'])
    expect(
      typeOf(resolvePassiveDescOverride('CordisGermina', [tf('nope')], 1))
    ).toBeUndefined()
  })
  it('matches the multi-field squad branch on either key', () => {
    expect(
      typeOf(
        resolvePassiveDescOverride('HalfSugarBunny', [tf('passive_hp_')], 1)
      )
    ).toBe(passiveDescByField['HalfSugarBunny']?.['passive_hp_'])
  })
  it('keeps the SolExuvia static text regardless of fields', () => {
    expect(resolvePassiveDescOverride('SolExuvia', [], 1)).toBeDefined()
    expect(
      resolvePassiveDescOverride('SolExuvia', [tf('whatever')], 1)
    ).toBeDefined()
  })
  it('returns undefined for unknown wengines and empty groups', () => {
    expect(
      resolvePassiveDescOverride('DreamlitHearth', [tf('nope')], 1)
    ).toBeUndefined()
    expect(resolvePassiveDescOverride('DreamlitHearth', [], 1)).toBeUndefined()
  })
})

describe('resolveCondDescOverride', () => {
  it('resolves table hits to the per-conditional slice', () => {
    expect(
      typeOf(resolveCondDescOverride('SolExuvia', 'eclipse_active', 1))
    ).toBe(condDescByName['SolExuvia']?.['eclipse_active'])
    expect(
      typeOf(resolveCondDescOverride('CordisGermina', 'nope', 1))
    ).toBeUndefined()
  })
  it('falls back to the wengine-level desc when no condName gate matches', () => {
    expect(typeOf(resolveCondDescOverride('RoaringRide', 'anything', 1))).toBe(
      condDescFallback['RoaringRide']
    )
  })
  it('returns undefined for unknown conditionals', () => {
    expect(resolveCondDescOverride('DreamlitHearth', 'nope', 1)).toBeUndefined()
  })
})

describe('passive slice identity', () => {
  it('table entry and resolver agree', () => {
    expect(
      typeOf(
        resolvePassiveDescOverride('CordisGermina', [tf('passive_crit_')], 1)
      )
    ).toBe(passiveDescByField['CordisGermina']?.['passive_crit_'])
  })
})
