import {
  createTestDBStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { presets } from '@zenless-optimizer/game-opt/engine'
import { allCharacterKeys, allDiscSetKeys } from '@zenless-optimizer/zzz/consts'
import { conditionals, formulas } from '@zenless-optimizer/zzz/formula'
import { ZzzDatabase } from '../Database'
import {
  COMBO_STATE_VERSION,
  comboHitTarget,
  getComboFrames,
  initializeComboState,
  isComboTarget,
  MAX_COMBO_HITS,
  parseComboState,
  remapComboState,
  type Team,
} from './TeamDataManager'

/** Pick a real formula so rotation validation keeps the entry. */
function firstFormula(): { sheet: string; name: string } {
  for (const [sheet, sheetFormulas] of Object.entries(
    formulas as Record<string, Record<string, unknown>>
  )) {
    const name = Object.keys(sheetFormulas ?? {})[0]
    if (name) return { sheet, name }
  }
  throw new Error('No formulas found')
}

/** Pick a real non-skill-variant formula (no `_dmg`/`_daze`/buildup suffix). */
function firstPlainFormula(): { sheet: string; name: string } {
  const variantRe = /^(.+)_(\d+)_(dmg|daze|anomBuildup|gashBuildup)$/
  for (const [sheet, sheetFormulas] of Object.entries(
    formulas as Record<string, Record<string, unknown>>
  )) {
    for (const name of Object.keys(sheetFormulas ?? {})) {
      if (!variantRe.test(name)) return { sheet, name }
    }
  }
  throw new Error('No plain formulas found')
}

/**
 * Find a real ability+hit with dmg, daze and buildup variants so combo-kind
 * mapping can be tested against formulas validation keeps.
 */
function skillTrio(): {
  sheet: string
  dmg: string
  daze: string
  buildup: string
} {
  const all = formulas as Record<string, Record<string, unknown>>
  for (const [sheet, sheetFormulas] of Object.entries(all)) {
    for (const name of Object.keys(sheetFormulas ?? {})) {
      const match = name.match(/^(.+)_(\d+)_dmg$/)
      if (!match) continue
      const [, ability, idx] = match
      const daze = `${ability}_${idx}_daze`
      const buildup = [
        `${ability}_${idx}_anomBuildup`,
        `${ability}_${idx}_gashBuildup`,
      ].find((candidate) => sheetFormulas?.[candidate])
      if (sheetFormulas?.[daze] && buildup)
        return { sheet, dmg: name, daze, buildup }
    }
  }
  throw new Error('No skill trio found')
}

/**
 * Storage mock whose stored entries are enumerable own properties, like real
 * localStorage — `DBLocalStorage.keys` relies on that to list stored keys.
 */
function createEnumerableDBStorage(): DBLocalStorage {
  const backing: Record<string, string> = {}
  const storage: Storage = {
    getItem: (key) => backing[key] ?? null,
    setItem: (key, value) => {
      backing[key] = String(value)
    },
    removeItem: (key) => {
      delete backing[key]
    },
    clear: () => {
      for (const key of Object.keys(backing)) delete backing[key]
    },
    get length() {
      return Object.keys(backing).length
    },
    key: (index) => Object.keys(backing)[index] ?? null,
  }
  const proxy = new Proxy(storage, {
    ownKeys: () => Object.keys(backing),
    getOwnPropertyDescriptor: (target, prop) =>
      Object.prototype.hasOwnProperty.call(backing, prop)
        ? {
            enumerable: true,
            configurable: true,
            writable: true,
            value: backing[prop as string],
          }
        : Object.getOwnPropertyDescriptor(target, prop),
  })
  return new DBLocalStorage(proxy, 'zzz')
}

describe('TeamDataManager', () => {
  let database: ZzzDatabase
  let teams: ZzzDatabase['teams']
  const mainKey = allCharacterKeys[0]

  beforeEach(() => {
    const dbStorage = createTestDBStorage('zzz')
    database = new ZzzDatabase(1, dbStorage)
    teams = database.teams
  })

  it('should remove invalid target stat in frame 0', () => {
    const invalid = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: { q: 'INVALID', qt: 'final' as const },
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](invalid, mainKey)
    expect(result?.frames[0]?.tag).toBeUndefined()
  })

  it('should reject more than 3 teammates', () => {
    const invalid = {
      teammates: allCharacterKeys.slice(0, 4).map((characterKey) => ({
        characterKey,
      })),
      frames: [],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](invalid, mainKey)
    expect(result).toBeUndefined()
  })

  it('should remove invalid optConfigId on teammate', () => {
    const invalid = {
      teammates: [{ characterKey: mainKey, optConfigId: 'INVALID_ID' }],
      frames: [],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](invalid, mainKey)
    expect(result?.teammates[0]?.optConfigId).toBeUndefined()
  })

  it('should backfill missing default conditionals on validate', () => {
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    const conds = result?.frames[0]?.conditionals
    expect(conds?.length).toBeGreaterThan(0)

    const discSetKeys = allDiscSetKeys.filter(
      (key) =>
        !!(conditionals as Record<string, Record<string, { type: string }>>)[
          key
        ]
    )
    for (const setKey of discSetKeys) {
      const condNames = Object.keys(
        (conditionals as Record<string, Record<string, unknown>>)[setKey]!
      )
      for (const condName of condNames) {
        const entry = conds?.find(
          (c) => c.sheet === setKey && c.condKey === condName
        )
        expect(entry).toBeDefined()
        expect(entry?.src).toBe(mainKey)
        expect(entry?.dst).toBeNull()
        expect(entry?.condValue).toBeGreaterThan(0)
      }
    }
  })

  it('should preserve explicitly set conditional values when backfilling', () => {
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [
            {
              sheet: 'HormonePunk',
              src: mainKey,
              dst: null,
              condKey: 'entering_combat',
              condValue: 0,
            },
          ],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    const conds = result?.frames[0]?.conditionals
    const disabled = conds?.find(
      (c) => c.sheet === 'HormonePunk' && c.condKey === 'entering_combat'
    )
    expect(disabled?.condValue).toBe(0)
    expect(conds?.length).toBeGreaterThan(1)
  })

  it('should keep rotation hits with multipliers and duplicates', () => {
    const { sheet, name } = firstFormula()
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name, multiplier: 3 },
              { sheet: 'NOPE', name: 'missing' },
            ],
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    expect(result?.frames[0]?.tag?.rotation).toEqual([
      { sheet, name },
      { sheet, name, multiplier: 3 },
    ])
  })

  it('has a calc preset for every combo hit', () => {
    // Each rotation hit reads preset${i}; the cap must never exceed the
    // preset namespace or hits would silently share buff states.
    expect(presets.length).toBeGreaterThanOrEqual(MAX_COMBO_HITS)
    expect(presets[MAX_COMBO_HITS - 1]).toBe(`preset${MAX_COMBO_HITS - 1}`)
  })

  it('should cap rotation hits at MAX_COMBO_HITS', () => {
    const { sheet, name } = firstFormula()
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: Array(MAX_COMBO_HITS + 5).fill({ sheet, name }),
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    expect(result?.frames[0]?.tag?.rotation).toHaveLength(MAX_COMBO_HITS)
  })

  it('should keep advanced comboType with a valid combo blob', () => {
    const { sheet, name } = firstFormula()
    const combo = initializeComboState([], 2)
    const json = JSON.stringify(combo)
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
            comboType: 'advanced' as const,
            comboStateJson: json,
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    expect(result?.frames[0]?.tag?.comboType).toBe('advanced')
    expect(result?.frames[0]?.tag?.comboStateJson).toBe(json)
  })

  it('should drop stale combo blobs (wrong version or hit count)', () => {
    const { sheet, name } = firstFormula()
    const rotation = [
      { sheet, name },
      { sheet, name },
    ]
    const badBlobs = [
      JSON.stringify({ version: '0.0', values: {} }),
      JSON.stringify({
        version: COMBO_STATE_VERSION,
        values: { 'a:b:c:': [1] },
      }),
      JSON.stringify({
        version: COMBO_STATE_VERSION,
        values: { 'a:b:c:': [1, 'x'] },
      }),
      'not json',
    ]
    for (const comboStateJson of badBlobs) {
      const team = {
        teammates: [{ characterKey: mainKey }],
        frames: [
          {
            tag: { rotation, comboType: 'advanced' as const, comboStateJson },
            multiplier: 1,
            critMode: 'avg' as const,
            bonusStats: [],
            conditionals: [],
            enemyStats: [],
          },
        ],
        enemyLvl: 60,
        enemyDef: 0,
        enemyStunMultiplier: 1,
      }
      const result = teams['validate'](team, mainKey)
      expect(result?.frames[0]?.tag?.comboStateJson).toBeUndefined()
    }
  })

  it('parseComboState round-trips initializeComboState', () => {
    const combo = initializeComboState(
      [
        {
          sheet: 'S' as never,
          src: mainKey as never,
          dst: null as never,
          condKey: 'k',
          condValue: 1,
        },
      ],
      3
    )
    expect(combo.version).toBe(COMBO_STATE_VERSION)
    const parsed = parseComboState(JSON.stringify(combo), 3)
    expect(parsed).toEqual(combo)
    expect(parseComboState(JSON.stringify(combo), 2)).toBeUndefined()
  })

  it('remapComboState preserves values by position across edits', () => {
    const base = {
      sheet: 'HormonePunk',
      src: mainKey,
      dst: null,
      condKey: 'entering_combat',
      condValue: 1,
    }
    const hash = `HormonePunk:entering_combat:${mainKey}:`
    const prev = JSON.stringify({
      version: COMBO_STATE_VERSION,
      values: { [hash]: [1, 0, 1] },
    })
    // Remove the middle hit: new hits map to old [0, 2].
    const removed = parseComboState(
      remapComboState([base] as never, prev, [0, 2]),
      2
    )
    expect(removed?.values[hash]).toEqual([1, 1])
    // Append a hit: the new hit inherits the frame default.
    const added = parseComboState(
      remapComboState([base] as never, prev, [0, 1, 2, -1]),
      4
    )
    expect(added?.values[hash]).toEqual([1, 0, 1, 1])
    // Stale blob re-initializes from defaults.
    const fresh = parseComboState(
      remapComboState([base] as never, 'garbage', [0, 0]),
      2
    )
    expect(fresh?.values[hash]).toEqual([1, 1])
  })

  it('getComboFrames shares frame0 buffs in simple mode', () => {
    const { sheet, name } = firstFormula()
    const conditionals = [
      {
        sheet: 'HormonePunk' as never,
        src: mainKey as never,
        dst: null as never,
        condKey: 'entering_combat',
        condValue: 1,
      },
    ]
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name },
              { sheet, name, multiplier: 2 },
            ],
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals,
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    } as unknown as Team
    const frames = getComboFrames(team)
    expect(frames).toHaveLength(2)
    expect(frames[0]?.tag).toEqual({ sheet, name })
    expect(frames[1]?.multiplier).toBe(2)
    expect(frames[0]?.conditionals).toEqual(conditionals)
    expect(frames[1]?.conditionals).toEqual(conditionals)
  })

  it('getComboFrames applies per-hit overrides in advanced mode', () => {
    const { sheet, name } = firstFormula()
    const base = {
      sheet: 'HormonePunk',
      src: mainKey,
      dst: null,
      condKey: 'entering_combat',
      condValue: 1,
    }
    const combo = initializeComboState([base] as never, 2)
    combo.values[`HormonePunk:entering_combat:${mainKey}:`] = [1, 0]
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
            comboStateJson: JSON.stringify(combo),
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [base],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    } as unknown as Team
    const frames = getComboFrames(team)
    expect(frames[0]?.conditionals[0]?.condValue).toBe(1)
    expect(frames[1]?.conditionals[0]?.condValue).toBe(0)
  })

  it('comboHitTarget maps skill variants to the selected metric', () => {
    const { sheet, dmg, daze, buildup } = skillTrio()
    // DMG keeps the hit as-is (legacy behavior, even for variant hits).
    expect(comboHitTarget({ sheet, name: daze }, 'dmg')).toEqual({
      sheet,
      name: daze,
    })
    // Daze/buildup resolve the sibling variant of the same ability+hit.
    expect(comboHitTarget({ sheet, name: dmg }, 'daze')).toEqual({
      sheet,
      name: daze,
    })
    expect(comboHitTarget({ sheet, name: daze }, 'daze')).toEqual({
      sheet,
      name: daze,
    })
    expect(comboHitTarget({ sheet, name: dmg }, 'buildup')).toEqual({
      sheet,
      name: buildup,
    })
    // Non-variant formulas only count toward DMG.
    const plain = firstPlainFormula()
    expect(comboHitTarget(plain, 'dmg')).toEqual(plain)
    expect(comboHitTarget(plain, 'daze')).toBeUndefined()
    expect(comboHitTarget(plain, 'buildup')).toBeUndefined()
    // Unknown formulas never resolve.
    expect(
      comboHitTarget({ sheet: 'NOPE', name: 'missing' }, 'daze')
    ).toBeUndefined()
  })

  it('should keep comboKind on rotation tags and default to dmg', () => {
    const { sheet, name } = firstFormula()
    const validateKind = (comboKind: unknown) => {
      const team = {
        teammates: [{ characterKey: mainKey }],
        frames: [
          {
            tag: { rotation: [{ sheet, name }], comboKind },
            multiplier: 1,
            critMode: 'avg' as const,
            bonusStats: [],
            conditionals: [],
            enemyStats: [],
          },
        ],
        enemyLvl: 60,
        enemyDef: 0,
        enemyStunMultiplier: 1,
      }
      return teams['validate'](team, mainKey)?.frames[0]?.tag?.comboKind
    }
    expect(validateKind('daze')).toBe('daze')
    expect(validateKind('buildup')).toBe('buildup')
    expect(validateKind('dmg')).toBeUndefined()
    expect(validateKind(undefined)).toBeUndefined()
    expect(validateKind('INVALID')).toBeUndefined()
  })

  it('getComboFrames reads the sibling variant for comboKind daze', () => {
    const { sheet, dmg, daze } = skillTrio()
    const plain = firstPlainFormula()
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet, name: dmg },
              { sheet: plain.sheet, name: plain.name },
            ],
            comboKind: 'daze',
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    } as unknown as Team
    // The plain formula has no daze variant, so it is skipped.
    const frames = getComboFrames(team)
    expect(frames).toHaveLength(1)
    expect(frames[0]?.tag).toEqual({ sheet, name: daze })
  })

  it('getComboFrames looks up advanced overrides by rotation index', () => {
    const { sheet, dmg, daze } = skillTrio()
    const plain = firstPlainFormula()
    const base = {
      sheet: 'HormonePunk',
      src: mainKey,
      dst: null,
      condKey: 'entering_combat',
      condValue: 0,
    }
    const combo = initializeComboState([base] as never, 2)
    // Index 0 (plain hit, skipped for daze) = 0, index 1 (kept) = 1.
    // A dense-index lookup would read index 0 and yield 0.
    combo.values[`HormonePunk:entering_combat:${mainKey}:`] = [0, 1]
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            rotation: [
              { sheet: plain.sheet, name: plain.name },
              { sheet, name: dmg },
            ],
            comboType: 'advanced',
            comboKind: 'daze',
            comboStateJson: JSON.stringify(combo),
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [base],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    } as unknown as Team
    const frames = getComboFrames(team)
    expect(frames).toHaveLength(1)
    expect(frames[0]?.tag).toEqual({ sheet, name: daze })
    // Override comes from rotation index 1, not the dense frame index 0.
    expect(frames[0]?.conditionals[0]?.condValue).toBe(1)
  })

  it('isComboTarget is true only for rotations without single-target fields', () => {
    const rotation = [{ sheet: 'S', name: 'n' }]
    expect(isComboTarget(undefined)).toBe(false)
    expect(isComboTarget({})).toBe(false)
    expect(isComboTarget({ rotation })).toBe(true)
    expect(isComboTarget({ rotation: [] })).toBe(false)
    // Staged rotations under a single-target selection are not active.
    expect(isComboTarget({ rotation, sheet: 'S', name: 'n' })).toBe(false)
    expect(isComboTarget({ rotation, q: 'atk', qt: 'final' })).toBe(false)
    expect(isComboTarget({ sheet: 'S', name: 'n' })).toBe(false)
  })

  it('should keep a staged rotation alongside a single-target selection', () => {
    const { sheet, name } = firstFormula()
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            sheet,
            name,
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
            comboType: 'advanced' as const,
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    const result = teams['validate'](team, mainKey)
    const tag = result?.frames[0]?.tag
    // Both survive validation: the single target stays selected while the
    // rotation remains stored and editable.
    expect(tag?.sheet).toBe(sheet)
    expect(tag?.name).toBe(name)
    expect(tag?.rotation).toHaveLength(2)
    expect(tag?.comboType).toBe('advanced')
    expect(isComboTarget(tag)).toBe(false)
  })

  it('should drop only the invalid side of a coexisting target', () => {
    const { sheet, name } = firstFormula()
    const base = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    }
    // Invalid formula name: rotation survives, single target is dropped
    // (and the combo becomes active).
    const badSingle = teams['validate'](
      {
        ...base,
        frames: [
          {
            ...base.frames[0],
            tag: {
              sheet: 'NOPE',
              name: 'missing',
              rotation: [{ sheet, name }],
            },
          },
        ],
      },
      mainKey
    )
    expect(badSingle?.frames[0]?.tag?.sheet).toBeUndefined()
    expect(badSingle?.frames[0]?.tag?.rotation).toHaveLength(1)
    // Invalid rotation hits: single target survives on its own.
    const badRotation = teams['validate'](
      {
        ...base,
        frames: [
          {
            ...base.frames[0],
            tag: {
              sheet,
              name,
              rotation: [{ sheet: 'NOPE', name: 'missing' }],
            },
          },
        ],
      },
      mainKey
    )
    expect(badRotation?.frames[0]?.tag?.sheet).toBe(sheet)
    expect(badRotation?.frames[0]?.tag?.rotation).toBeUndefined()
  })

  it('getComboFrames ignores staged rotations under a single target', () => {
    const { sheet, name } = firstFormula()
    const team = {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          tag: {
            sheet,
            name,
            rotation: [
              { sheet, name },
              { sheet, name },
            ],
          },
          multiplier: 1,
          critMode: 'avg' as const,
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    } as unknown as Team
    // Single target wins: the stored frames pass through untouched.
    const frames = getComboFrames(team)
    expect(frames).toHaveLength(1)
    expect(frames[0]?.tag?.sheet).toBe(sheet)
  })

  it('should backfill conditionals for teams loaded from storage', () => {
    const dbStorage = createEnumerableDBStorage()
    database = new ZzzDatabase(1, dbStorage)
    teams = database.teams
    teams.set(mainKey, {
      teammates: [{ characterKey: mainKey }],
      frames: [
        {
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 60,
      enemyDef: 0,
      enemyStunMultiplier: 1,
    })

    // Simulate an app restart: the new database instance loads every stored
    // team from storage via the DataManager constructor.
    const reloaded = new ZzzDatabase(1, dbStorage)
    const conds = reloaded.teams.get(mainKey)?.frames[0]?.conditionals
    expect(conds?.length).toBeGreaterThan(0)
    expect(
      conds?.some((c) => c.sheet === 'HormonePunk' && c.condValue > 0)
    ).toBe(true)
  })
})
