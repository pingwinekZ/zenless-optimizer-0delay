import {
  createMockStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
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
})
