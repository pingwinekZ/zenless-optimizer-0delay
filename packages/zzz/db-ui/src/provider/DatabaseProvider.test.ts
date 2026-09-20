import {
  createMockStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import {
  isLegacyStorageKey,
  slotMigrationKey,
  slotStorageKey,
  ZzzDatabase,
} from '@zenless-optimizer/zzz/db'
import { openDatabaseSlot } from './DatabaseProvider'

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

/** An install as it looked before slots: one localStorage key per entry */
function createLegacyInstall(slotIndex: 1 | 2 | 3 | 4 = 1) {
  const storage = createMockStorage()
  const database = new ZzzDatabase(
    slotIndex,
    new DBLocalStorage(storage, 'zzz')
  )
  const discId = database.discs.new(testDisc())
  database.chars.getOrCreate('Anby')
  return { storage, database, discId }
}

const storedKeys = (storage: Storage) => Object.keys(storage).sort()

describe('database slot bootstrap', () => {
  it('migrates a pre-slot install into one compressed key', () => {
    const { storage, discId } = createLegacyInstall()
    const legacyKeys = storedKeys(storage).filter(isLegacyStorageKey)
    expect(legacyKeys.length).toBeGreaterThan(4)

    const database = openDatabaseSlot(1, 1, storage)

    expect(storedKeys(storage).filter(isLegacyStorageKey)).toEqual([])
    expect(storedKeys(storage)).toEqual([
      'zzz_dbIndex',
      slotStorageKey(1),
      slotMigrationKey(1),
    ])
    expect(database.discs.get(discId)?.setKey).toBe('FangedMetal')
    expect(database.chars.values.length).toBe(1)
    expect(database.hasUnsavedSlotChanges).toBe(false)
  })

  it('drops a stale whole-database copy of the active slot', () => {
    const { storage, discId } = createLegacyInstall()
    // A previous version wrote the active database out as a whole-database
    // blob as well, which nothing ever read back. This is the 2MB of dead
    // weight an install could accumulate with a single database in use.
    const staleCopy = JSON.stringify({
      zzz_disc_0: JSON.stringify(testDisc()),
      zzz_disc_1: JSON.stringify(testDisc()),
    })
    storage.setItem(slotStorageKey(1), staleCopy)

    const database = openDatabaseSlot(1, 1, storage)

    // The live per-entry data is what survived, not the stale copy
    expect(database.discs.get(discId)?.setKey).toBe('FangedMetal')
    expect(storedKeys(storage).filter(isLegacyStorageKey)).toEqual([])
    const slot = storage.getItem(slotStorageKey(1))!
    expect(slot).not.toContain('zzz_disc_1')
    expect(database.discs.values.length).toBe(1)
  })

  it('prefers the slot when a previous purge was interrupted', () => {
    const { storage } = createLegacyInstall()
    // Migrated once, then the app died halfway through deleting the leftovers
    const migrated = openDatabaseSlot(1, 1, storage)
    migrated.discs.new(testDisc())
    migrated.persistSlot()
    storage.setItem('zzz_disc_999', JSON.stringify(testDisc()))

    const database = openDatabaseSlot(1, 1, storage)

    expect(storedKeys(storage).filter(isLegacyStorageKey)).toEqual([])
    expect(database.discs.values.length).toBe(2)
  })

  it('leaves another slot alone while opening an inactive one', () => {
    // Slot 2 is the active database, so its per-entry keys are the ones to
    // migrate - opening slot 1 must not touch them.
    const install = createLegacyInstall(2)
    const legacyKeys = storedKeys(install.storage).filter(isLegacyStorageKey)
    expect(legacyKeys.length).toBeGreaterThan(4)

    const database = openDatabaseSlot(1, 2, install.storage)

    expect(database.discs.values.length).toBe(0)
    expect(storedKeys(install.storage).filter(isLegacyStorageKey)).toEqual(
      legacyKeys
    )

    // ...and opening slot 2 migrates them
    const active = openDatabaseSlot(2, 2, install.storage)
    expect(active.discs.values.length).toBe(1)
    expect(storedKeys(install.storage).filter(isLegacyStorageKey)).toEqual([])
  })

  it('reopens a slot without rewriting it', () => {
    const { storage } = createLegacyInstall()
    openDatabaseSlot(1, 1, storage)
    const payload = storage.getItem(slotStorageKey(1))

    const reopened = openDatabaseSlot(1, 1, storage)

    expect(storage.getItem(slotStorageKey(1))).toBe(payload)
    expect(reopened.discs.values.length).toBe(1)
    expect(reopened.hasUnsavedSlotChanges).toBe(false)
  })

  it('starts an unused slot empty, without touching storage', () => {
    const storage = createMockStorage()
    const database = openDatabaseSlot(3, 1, storage)
    expect(database.discs.values.length).toBe(0)
    expect(storedKeys(storage)).toEqual([])
  })
})
