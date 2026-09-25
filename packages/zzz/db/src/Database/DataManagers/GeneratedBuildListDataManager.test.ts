import {
  createMockStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe } from '../../Interfaces/BuildRecipe'
import { ZzzDatabase } from '../Database'
import { maxPersistedGeneratedBuilds } from './GeneratedBuildListDataManager'

describe('GeneratedBuildListDataManager', () => {
  let database: ZzzDatabase
  let generatedBuildList: ZzzDatabase['generatedBuildList']
  let storage: Storage

  beforeEach(() => {
    storage = createMockStorage()
    const dbStorage = new DBLocalStorage(storage, 'zzz')
    database = new ZzzDatabase(1, dbStorage)
    generatedBuildList = database.generatedBuildList
  })

  function validRecipe(id: string): BuildRecipe {
    return {
      id,
      mainStats: {
        '1': 'hp',
        '2': 'hp',
        '3': 'hp',
        '4': 'atk_',
        '5': 'atk_',
        '6': 'pen_',
      },
      totalRolls: { crit_: 6 },
      appearances: {},
      perDiscSubstats: [[{ key: 'crit_', upgrades: 3 }], [], [], [], [], []],
      set4: 'FangedMetal',
      set2: 'FangedMetal',
    }
  }

  function createValidDiscIds() {
    return objKeyMap(allDiscSlotKeys, (slotKey) => {
      return database.discs.new({
        setKey: 'FangedMetal',
        rarity: 'S',
        level: 0,
        slotKey,
        mainStatKey: slotKey === '4' ? 'atk_' : slotKey === '5' ? 'atk_' : 'hp',
        substats: [],
        location: '',
        lock: false,
        trash: false,
      })
    })
  }

  it('should remove invalid wengineId', () => {
    const discIds = createValidDiscIds()
    const invalid = {
      builds: [{ value: 100, wengineId: 'INVALID_ID', discIds }],
      buildDate: 12345,
    }
    const result = generatedBuildList['validate'](invalid)
    expect(result?.builds[0]?.wengineId).toBeUndefined()
  })

  it('should filter invalid disc IDs from discIds', () => {
    const validDiscId = database.discs.new({
      setKey: 'FangedMetal',
      rarity: 'S',
      level: 0,
      slotKey: '1',
      mainStatKey: 'hp',
      substats: [],
      location: '',
      lock: false,
      trash: false,
    })

    const discIds = {
      '1': validDiscId,
      '2': 'INVALID_ID',
      '3': 'INVALID_ID',
      '4': 'INVALID_ID',
      '5': 'INVALID_ID',
      '6': 'INVALID_ID',
    }

    const invalid = {
      builds: [{ value: 100, discIds }],
      buildDate: 12345,
    }
    const result = generatedBuildList['validate'](invalid)
    expect(result?.builds[0]?.discIds['1']).toBe(validDiscId)
    expect(result?.builds[0]?.discIds['2']).toBeUndefined()
  })

  it('keeps the full list in memory but only stores the top builds', () => {
    const discIds = createValidDiscIds()
    const builds = Array.from(
      { length: maxPersistedGeneratedBuilds + 25 },
      (_, i) => ({ value: i, discIds })
    )
    const id = generatedBuildList.new({ builds, buildDate: 12345 })

    expect(generatedBuildList.get(id)?.builds.length).toBe(builds.length)
    const stored = JSON.parse(storage.getItem(id)!) as { builds: unknown[] }
    expect(stored.builds.length).toBe(maxPersistedGeneratedBuilds)

    // A reload restores the stored prefix of the last run
    const reloaded = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
    expect(reloaded.generatedBuildList.get(id)?.builds.length).toBe(
      maxPersistedGeneratedBuilds
    )
  })

  it('keeps validated recipe metadata for theoretical rows', () => {
    const discIds = objKeyMap(allDiscSlotKeys, (slot) => `recipe_0_${slot}`)
    const result = generatedBuildList['validate']({
      builds: [{ value: 100, discIds }],
      buildDate: 12345,
      recipes: {
        recipe_0: validRecipe('recipe_0'),
        recipe_1: { junk: true },
      },
    })
    expect(Object.keys(result?.recipes ?? {})).toEqual(['recipe_0'])
    expect(result?.recipes?.['recipe_0']?.set4).toBe('FangedMetal')
  })

  it('drops the recipes field entirely when nothing validates', () => {
    const discIds = objKeyMap(allDiscSlotKeys, (slot) => `recipe_0_${slot}`)
    const result = generatedBuildList['validate']({
      builds: [{ value: 100, discIds }],
      buildDate: 12345,
      recipes: { recipe_0: { junk: true } },
    })
    expect(result?.recipes).toBeUndefined()
  })

  it('only stores recipes for the rows that survive the build cap', () => {
    const builds = Array.from(
      { length: maxPersistedGeneratedBuilds + 25 },
      (_, i) => ({
        value: i,
        discIds: objKeyMap(allDiscSlotKeys, (slot) => `recipe_${i}_${slot}`),
      })
    )
    const recipes = Object.fromEntries(
      builds.map((_, i) => [`recipe_${i}`, validRecipe(`recipe_${i}`)])
    )
    const id = generatedBuildList.new({ builds, buildDate: 12345, recipes })

    // In-memory list keeps every row
    expect(generatedBuildList.get(id)?.builds.length).toBe(builds.length)

    const stored = JSON.parse(storage.getItem(id)!) as {
      builds: unknown[]
      recipes?: Record<string, unknown>
    }
    expect(stored.builds.length).toBe(maxPersistedGeneratedBuilds)
    expect(Object.keys(stored.recipes ?? {}).length).toBe(
      maxPersistedGeneratedBuilds
    )

    // A reload restores recipes covering exactly the persisted rows
    const reloaded = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
    expect(
      Object.keys(reloaded.generatedBuildList.get(id)?.recipes ?? {}).length
    ).toBe(maxPersistedGeneratedBuilds)
  })

  it('does not store recipe metadata that no persisted row references', () => {
    const discIds = createValidDiscIds()
    const id = generatedBuildList.new({
      builds: [{ value: 5, discIds }],
      buildDate: 12345,
      recipes: { recipe_0: validRecipe('recipe_0') },
    })
    const stored = JSON.parse(storage.getItem(id)!) as { recipes?: unknown }
    expect(stored.recipes).toBeUndefined()
  })
})
