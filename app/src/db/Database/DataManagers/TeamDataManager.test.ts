import {
  createTestDBStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { allCharacterKeys, allDiscSetKeys } from '../../../consts'
import { conditionals, formulas } from '../../../formula'
import { ZzzDatabase } from '../Database'
import {
  COMBO_STATE_VERSION,
  getComboFrames,
  initializeComboState,
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
