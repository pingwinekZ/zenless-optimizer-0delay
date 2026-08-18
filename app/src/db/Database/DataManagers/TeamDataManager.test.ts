import {
  createTestDBStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { allCharacterKeys, allDiscSetKeys } from '../../../consts'
import { conditionals } from '../../../formula'
import { ZzzDatabase } from '../Database'

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
