import {
  allCharacterKeys,
  allDiscSetKeys,
  type DiscMainStatKey,
  type DiscSlotKey,
  discSlotToMainStatKeys,
} from '../../consts'
import {
  type StatFilter,
  statFilterStatKeys,
  statFilterStatQtKeys,
  targetQ,
  targetQt,
} from '../../db'
import { formulas } from '../../formula'
import {
  getRecommendedPresets,
  mergeStatFilters,
  recommendedPresets,
} from './recommendedPresets'

describe('recommendedPresets', () => {
  it('only defines presets for Remielle, with exactly one preset', () => {
    expect(Object.keys(recommendedPresets)).toEqual(['Remielle'])
    expect(getRecommendedPresets('Remielle')).toHaveLength(1)
  })

  it('returns no presets for other characters', () => {
    for (const key of allCharacterKeys) {
      if (key === 'Remielle') continue
      expect(getRecommendedPresets(key)).toEqual([])
    }
  })

  it('uses only valid character keys', () => {
    for (const key of Object.keys(recommendedPresets))
      expect(allCharacterKeys).toContain(key)
  })

  it('has unique preset ids', () => {
    const ids = Object.values(recommendedPresets)
      .flat()
      .map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('validates disc set filters', () => {
    for (const presets of Object.values(recommendedPresets)) {
      for (const preset of presets) {
        for (const setKey of [...preset.setFilter2, ...preset.setFilter4])
          expect(allDiscSetKeys).toContain(setKey)
      }
    }
  })

  it('validates main stat filters against slot-valid main stats', () => {
    for (const presets of Object.values(recommendedPresets)) {
      for (const preset of presets) {
        for (const [slot, stats] of Object.entries(preset.mainStats)) {
          const valid = discSlotToMainStatKeys[slot as DiscSlotKey]
          for (const stat of stats as DiscMainStatKey[])
            expect(valid).toContain(stat)
        }
      }
    }
  })

  it('validates stat filters', () => {
    for (const presets of Object.values(recommendedPresets)) {
      for (const preset of presets) {
        for (const filter of preset.statFilters) {
          expect(statFilterStatKeys).toContain(filter.tag.q)
          expect(statFilterStatQtKeys).toContain(filter.tag.qt)
          expect(typeof filter.value).toBe('number')
          expect(filter.value).toBeGreaterThanOrEqual(0)
          expect(typeof filter.isMax).toBe('boolean')
          expect(typeof filter.disabled).toBe('boolean')
        }
      }
    }
  })

  it('validates optimization targets resolve to real formulas or stat targets', () => {
    for (const presets of Object.values(recommendedPresets)) {
      for (const preset of presets) {
        const target = preset.target
        if (target.rotation) {
          expect(target.rotation.length).toBeGreaterThan(0)
          for (const { sheet, name } of target.rotation)
            expect((formulas as any)[sheet]?.[name]).toBeDefined()
        } else if (target.name) {
          expect((formulas as any)[target.sheet]?.[target.name]).toBeDefined()
        } else {
          expect(target.q).toBeDefined()
          expect(target.qt).toBeDefined()
          expect(targetQ).toContain(target.q)
          expect(targetQt).toContain(target.qt)
        }
      }
    }
  })
})

describe('mergeStatFilters', () => {
  const base: StatFilter[] = [
    {
      tag: { q: 'atk', qt: 'final' },
      value: 3000,
      isMax: false,
      disabled: false,
    },
    {
      tag: { q: 'crit_', qt: 'final' },
      value: 60,
      isMax: false,
      disabled: false,
    },
  ]

  it('replaces entries matching stat key, qt, and min/max', () => {
    const preset: StatFilter[] = [
      {
        tag: { q: 'atk', qt: 'final' },
        value: 4000,
        isMax: false,
        disabled: false,
      },
    ]
    const merged = mergeStatFilters(base, preset)
    expect(merged).toHaveLength(2)
    expect(merged.find((f) => f.tag.q === 'atk')?.value).toBe(4000)
    expect(merged.find((f) => f.tag.q === 'crit_')?.value).toBe(60)
  })

  it('preserves unrelated entries and appends new ones', () => {
    const preset: StatFilter[] = [
      {
        tag: { q: 'anomProf', qt: 'final' },
        value: 120,
        isMax: false,
        disabled: false,
      },
    ]
    const merged = mergeStatFilters(base, preset)
    expect(merged).toHaveLength(3)
    expect(merged[2]).toEqual(preset[0])
  })

  it('does not mutate the input arrays', () => {
    const copy = structuredClone(base)
    mergeStatFilters(base, base)
    expect(base).toEqual(copy)
  })
})
