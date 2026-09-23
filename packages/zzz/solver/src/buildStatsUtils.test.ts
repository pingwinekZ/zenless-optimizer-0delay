import { allCharacterKeys } from '@zenless-optimizer/zzz/consts'
import type { ICachedCharacter, Team } from '@zenless-optimizer/zzz/db'
import { formulas } from '@zenless-optimizer/zzz/formula'
import { buildCalculatorEntries } from './buildStatsUtils'

function firstFormula(): { sheet: string; name: string } {
  for (const [sheet, sheetFormulas] of Object.entries(
    formulas as Record<string, Record<string, unknown>>
  )) {
    const name = Object.keys(sheetFormulas ?? {})[0]
    if (name) return { sheet, name }
  }
  throw new Error('No formulas found')
}

function mockCharacter(key: ICachedCharacter['key']): ICachedCharacter {
  return {
    key,
    level: 60,
    promotion: 6,
    basic: 12,
    dodge: 12,
    special: 12,
    chain: 12,
    assist: 12,
    core: 9,
    mindscape: 0,
    wengineKey: '',
    wenginePhase: 1,
    equippedDiscs: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  } as unknown as ICachedCharacter
}

describe('buildCalculatorEntries combo frames', () => {
  const mainKey = allCharacterKeys[0]

  it('emits per-preset conditional entries for advanced rotation hits', () => {
    const { sheet, name } = firstFormula()
    const condKey = 'entering_combat'
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
            comboType: 'advanced',
            comboStateJson: JSON.stringify({
              version: '1.0',
              values: {
                [`HormonePunk:${condKey}:${mainKey}:`]: [1, 0],
              },
            }),
          },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [
            {
              sheet: 'HormonePunk',
              src: mainKey,
              dst: null,
              condKey,
              condValue: 1,
            },
          ],
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    } as unknown as Team

    const entries = buildCalculatorEntries(mockCharacter(mainKey), {}, team)
    const condEntries = entries.filter(
      (e) =>
        (e.tag as Record<string, unknown>)['qt'] === 'cond' &&
        (e.tag as Record<string, unknown>)['q'] === condKey
    )
    const byPreset = Object.fromEntries(
      condEntries.map((e) => [
        (e.tag as Record<string, unknown>)['preset'],
        e.value,
      ])
    )
    // Both hits resolve the same buff with different values per preset.
    expect(Object.keys(byPreset).sort()).toEqual(['preset0', 'preset1'])
    expect(JSON.stringify(byPreset['preset0'])).toContain('"ex":1')
    expect(JSON.stringify(byPreset['preset1'])).toContain('"ex":0')
  })

  it('emits per-preset entries for teammate conditionals in advanced mode', () => {
    const { sheet, name } = firstFormula()
    const condKey = 'cheerOn'
    const team = {
      teammates: [{ characterKey: mainKey }, { characterKey: 'Lucy' }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
            comboType: 'advanced',
            comboStateJson: JSON.stringify({
              version: '1.0',
              values: {
                [`Lucy:${condKey}:Lucy:`]: [1, 0],
              },
            }),
          },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [
            {
              sheet: 'Lucy',
              src: 'Lucy',
              dst: null,
              condKey,
              condValue: 1,
            },
          ],
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    } as unknown as Team

    const entries = buildCalculatorEntries(mockCharacter(mainKey), {}, team)
    const condEntries = entries.filter(
      (e) =>
        (e.tag as Record<string, unknown>)['qt'] === 'cond' &&
        (e.tag as Record<string, unknown>)['q'] === condKey
    )
    const byPreset = Object.fromEntries(
      condEntries.map((e) => [
        (e.tag as Record<string, unknown>)['preset'],
        e.value,
      ])
    )
    expect(Object.keys(byPreset).sort()).toEqual(['preset0', 'preset1'])
    expect(JSON.stringify(byPreset['preset0'])).toContain('"ex":1')
    expect(JSON.stringify(byPreset['preset1'])).toContain('"ex":0')
  })

  it('shares frame0 buffs across presets in simple mode', () => {
    const { sheet, name } = firstFormula()
    const condKey = 'entering_combat'
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
          },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [
            {
              sheet: 'HormonePunk',
              src: mainKey,
              dst: null,
              condKey,
              condValue: 1,
            },
          ],
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    } as unknown as Team

    const entries = buildCalculatorEntries(mockCharacter(mainKey), {}, team)
    const condEntries = entries.filter(
      (e) =>
        (e.tag as Record<string, unknown>)['qt'] === 'cond' &&
        (e.tag as Record<string, unknown>)['q'] === condKey
    )
    expect(
      condEntries
        .map((e) => (e.tag as Record<string, unknown>)['preset'])
        .sort()
    ).toEqual(['preset0', 'preset1'])
    for (const e of condEntries)
      expect(JSON.stringify(e.value)).toContain('"ex":1')
  })
})
