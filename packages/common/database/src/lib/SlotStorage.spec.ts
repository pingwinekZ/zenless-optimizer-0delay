import {
  compressToB64Gzip,
  compressToGzipString,
} from '@zenless-optimizer/common/util'
import type { DBStorage } from './DBStorage'
import { SlotStorage } from './SlotStorage'
import { createMockStorage } from './test-utils'

const SLOT_KEY = 'test_extraDatabase_1'

function makeDisc(i: number) {
  return JSON.stringify({
    setKey: 'FangedMetal',
    rarity: 'S',
    level: 15,
    slotKey: '1',
    mainStatKey: 'hp',
    substats: [
      { key: 'atk_', upgrades: 2 },
      { key: 'crit_', upgrades: 2 },
    ],
    location: '',
    lock: false,
    trash: false,
    filler: i % 3,
  })
}

function makeEntries(count = 200) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => [`zzz_disc_${i}`, makeDisc(i)])
  )
}

describe('SlotStorage', () => {
  it('round-trips entries through a single compressed key', () => {
    const target = createMockStorage()
    const storage = SlotStorage.open(SLOT_KEY, target, 'zzz')
    expect(storage.keys).toEqual([])

    Object.entries(makeEntries()).forEach(([key, value]) =>
      storage.setString(key, value)
    )
    storage.flush()

    const reopened = SlotStorage.open(SLOT_KEY, target, 'zzz')
    expect(reopened.keys.length).toBe(200)
    expect(reopened.getString('zzz_disc_42')).toBe(makeDisc(42))
    // One key for the whole database, packed far tighter than the raw JSON
    expect(target.getItem(SLOT_KEY)!.length).toBeLessThan(
      JSON.stringify(makeEntries()).length / 5
    )
  })

  it('is not a write-through storage, and tracks unsaved changes', () => {
    const target = createMockStorage()
    const storage = SlotStorage.open(SLOT_KEY, target, 'zzz')
    expect(storage.writeThrough).toBe(false)
    expect(storage.dirty).toBe(false)
    expect(target.getItem(SLOT_KEY)).toBeNull()

    storage.setString('zzz_disc_0', makeDisc(0))
    expect(storage.dirty).toBe(true)
    expect(target.getItem(SLOT_KEY)).toBeNull()

    storage.flush()
    expect(storage.dirty).toBe(false)
    expect(target.getItem(SLOT_KEY)).not.toBeNull()
  })

  it('seeds from the legacy plain-JSON and base64-gzip slots', () => {
    const entries = makeEntries(3)
    const legacyJson = createMockStorage()
    legacyJson.setItem(SLOT_KEY, JSON.stringify(entries))
    expect(SlotStorage.open(SLOT_KEY, legacyJson, 'zzz').entries).toEqual(
      Object.entries(entries)
    )

    const legacyB64 = createMockStorage()
    legacyB64.setItem(SLOT_KEY, compressToB64Gzip(JSON.stringify(entries)))
    expect(SlotStorage.open(SLOT_KEY, legacyB64, 'zzz').entries).toEqual(
      Object.entries(entries)
    )
  })

  it('verifies a flush before a destructive migration trusts it', () => {
    const target = createMockStorage()
    const storage = SlotStorage.open(SLOT_KEY, target, 'zzz')
    storage.setString('zzz_disc_0', makeDisc(0))
    storage.flush()
    expect(storage.verifyFlushed()).toBe(true)

    // An unflushed change makes the stored payload stale
    storage.setString('zzz_disc_1', makeDisc(1))
    expect(storage.verifyFlushed()).toBe(false)
  })

  it('does not clobber a slot that was never opened for writing', () => {
    const target = createMockStorage()
    target.setItem(
      SLOT_KEY,
      compressToGzipString(JSON.stringify(makeEntries(1)))
    )
    SlotStorage.open(SLOT_KEY, target, 'zzz')
    expect(target.getItem(SLOT_KEY)).toBe(
      compressToGzipString(JSON.stringify(makeEntries(1)))
    )
  })

  it('exposes a compatible DBStorage surface', () => {
    const storage: DBStorage = SlotStorage.open(
      SLOT_KEY,
      createMockStorage(),
      'zzz'
    )
    expect(storage.dbVersionKey).toBe('zzz_db_ver')
    expect(storage.dbIndexKey).toBe('zzz_dbIndex')
    storage.setDBIndex(3)
    storage.setDBVersion(7)
    expect(storage.getDBIndex()).toBe(3)
    expect(storage.getDBVersion()).toBe(7)
  })
})
