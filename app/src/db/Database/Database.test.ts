import {
  createMockStorage,
  createTestDBStorage,
  DBLocalStorage,
  SlotStorage,
} from '@zenless-optimizer/common/database'
import { zzzSource } from '../Interfaces'
import {
  isLegacyStorageKey,
  slotMigrationKey,
  slotStorageKey,
  ZzzDatabase,
} from './Database'
import { currentDBVersion } from './migrate'

const testDatabaseJson = {
  format: 'ZOD',
  dbVersion: currentDBVersion,
  source: zzzSource,
  version: 1,
  characters: [{ key: 'Anby', level: 1, ascension: 0, core: 0, skill: {} }],
  discs: [],
  wengines: [],
  charMetas: [],
  generatedBuildList: [],
  optConfigs: [],
  teams: [
    {
      id: 'Anby',
      teammates: [{ characterKey: 'Anby' }],
      frames: [
        {
          tag: { q: 'atk', qt: 'final' },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    },
  ],
}

function normalizeForComparison(data: Record<string, unknown>) {
  const clone = structuredClone(data)
  if (clone.dbMeta && typeof clone.dbMeta === 'object') {
    delete (clone.dbMeta as Record<string, unknown>).lastEdit
  }
  if (Array.isArray(clone.generatedBuildList)) {
    for (const build of clone.generatedBuildList) {
      if (build && typeof build === 'object') {
        delete (build as Record<string, unknown>).buildDate
      }
    }
  }
  return clone
}

const testDisc = () => ({
  setKey: 'FangedMetal',
  rarity: 'S' as const,
  level: 0,
  slotKey: '1' as const,
  mainStatKey: 'hp' as const,
  substats: [],
  location: '',
  lock: false,
  trash: false,
})

/** Stored keys, i.e. keys of the mock localStorage, without its API methods */
const storedKeys = (storage: Storage) => Object.keys(storage).sort()

describe('database slot persistence', () => {
  it('covers every key the per-entry storage used to write', () => {
    const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
    for (const manager of database.dataManagers)
      expect(isLegacyStorageKey(`${manager.goKeySingle}_42`)).toBe(true)
    for (const entry of database.dataEntries)
      expect(isLegacyStorageKey(entry.toStorageKey())).toBe(true)
  })

  it('never writes a slot key for a write-through storage', () => {
    const storage = createMockStorage()
    const database = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
    database.discs.new(testDisc())

    // The per-entry keys already hold this database: a slot copy would be an
    // unread duplicate, which is how installs ended up with a stale second
    // copy of their whole database in localStorage.
    expect(database.isSlotBacked).toBe(false)
    expect(database.persistSlot()).toBe(false)
    expect(storedKeys(storage)).not.toContain(slotStorageKey(1))
  })

  it('migrates per-entry keys into one compressed slot and deletes them', () => {
    const storage = createMockStorage()
    const legacy = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
    const discIds = Array.from({ length: 50 }, () =>
      legacy.discs.new(testDisc())
    )
    legacy.chars.getOrCreate('Anby')
    expect(storedKeys(storage).filter(isLegacyStorageKey).length).toBe(
      storedKeys(storage).length - 1 // everything but the slot pointer
    )
    const legacyBytes = storedKeys(storage).reduce(
      (sum, key) =>
        sum + (key.length + (storage.getItem(key)?.length ?? 0)) * 2,
      0
    )

    expect(
      legacy.adoptSlotStorage(
        SlotStorage.open(slotStorageKey(1), storage, 'zzz')
      )
    ).toBe(true)

    expect(storedKeys(storage).filter(isLegacyStorageKey)).toEqual([])
    expect(storedKeys(storage)).toEqual([
      'zzz_dbIndex',
      slotStorageKey(1),
      slotMigrationKey(1),
    ])
    // One compressed key for the whole database, well under the per-entry cost
    const slotBytes = storage.getItem(slotStorageKey(1))!.length * 2
    expect(slotBytes).toBeLessThan(legacyBytes / 3)

    // The slot reads back as the same database
    const reopened = new ZzzDatabase(
      1,
      SlotStorage.open(slotStorageKey(1), storage, 'zzz')
    )
    expect(reopened.discs.values.length).toBe(50)
    expect(reopened.discs.get(discIds[7])?.setKey).toBe('FangedMetal')
    expect(reopened.chars.values.length).toBe(1)
  })

  it('replaces a stale slot copy of the active database', () => {
    const storage = createMockStorage()
    const legacy = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
    legacy.discs.new(testDisc())
    legacy.saveStorage()
    // Stale whole-database copy a previous version left behind for this slot
    storage.setItem(
      slotStorageKey(1),
      JSON.stringify({ zzz_disc_9: '"stale"' })
    )

    legacy.adoptSlotStorage(SlotStorage.open(slotStorageKey(1), storage, 'zzz'))

    const reopened = new ZzzDatabase(
      1,
      SlotStorage.open(slotStorageKey(1), storage, 'zzz')
    )
    expect(reopened.discs.values.length).toBe(1)
    expect(storage.getItem(slotStorageKey(1))).not.toContain('stale')
  })

  it('blocks a save that would delete loaded data, unless told otherwise', () => {
    const storage = createMockStorage()
    const slotKey = slotStorageKey(2)
    const database = new ZzzDatabase(
      2,
      SlotStorage.open(slotKey, storage, 'zzz')
    )
    database.discs.new(testDisc())
    expect(database.persistSlot()).toBe(true)

    const reopened = new ZzzDatabase(
      2,
      SlotStorage.open(slotKey, storage, 'zzz')
    )
    reopened.discs.clear()
    expect(reopened.persistSlot()).toBe(false)
    expect(reopened.persistSlot({ allowEmpty: true })).toBe(true)

    // Deleting everything on purpose is not data loss
    reopened.discs.new(testDisc())
    reopened.clear()
    expect(reopened.persistSlot()).toBe(true)
  })

  it('records the managed save state', () => {
    const storage = createMockStorage()
    const database = new ZzzDatabase(
      3,
      SlotStorage.open(slotStorageKey(3), storage, 'zzz')
    )
    expect(database.isSlotBacked).toBe(true)
    // Constructing writes the base entries into the slot, so it starts dirty
    // until the provider marks the freshly opened slot as persisted.
    expect(database.hasUnsavedSlotChanges).toBe(true)
    database.markSlotClean()
    expect(database.hasUnsavedSlotChanges).toBe(false)
    database.activateSlot()
    expect(storage.getItem('zzz_dbIndex')).toBe('3')

    database.discs.new(testDisc())
    expect(database.hasUnsavedSlotChanges).toBe(true)
    expect(database.persistSlot()).toBe(true)
    expect(database.hasUnsavedSlotChanges).toBe(false)
  })
})

describe('Database import/export round trip', () => {
  it('should produce identical JSON across import/export cycles', () => {
    const dbStorage1 = createTestDBStorage('zzz')
    const database1 = new ZzzDatabase(1, dbStorage1)

    const input = structuredClone(testDatabaseJson)
    database1.importZOOD(input, false, false)
    const firstExport = database1.exportZOOD()

    const dbStorage2 = createTestDBStorage('zzz')
    const database2 = new ZzzDatabase(1, dbStorage2)

    database2.importZOOD(firstExport, false, false)
    const secondExport = database2.exportZOOD()

    const firstJson = JSON.stringify(normalizeForComparison(firstExport))
    const secondJson = JSON.stringify(normalizeForComparison(secondExport))

    expect(secondJson).toBe(firstJson)
  })
})
