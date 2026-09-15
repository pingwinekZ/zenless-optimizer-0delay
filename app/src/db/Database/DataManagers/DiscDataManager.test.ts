import { createTestDBStorage } from '@zenless-optimizer/common/database'
import {
  allDiscSlotKeys,
  allDiscSetKeys,
  discSlotToMainStatKeys,
} from '../../../consts'
import { ZzzDatabase } from '../Database'
import { validateDiscBasedOnRarity } from './DiscDataManager'

describe('DiscDataManager', () => {
  let database: ZzzDatabase
  let discs: ZzzDatabase['discs']

  beforeEach(() => {
    const dbStorage = createTestDBStorage('zzz')
    database = new ZzzDatabase(1, dbStorage)
    discs = database.discs
  })

  it('should reject substat with same key as mainstat', () => {
    const invalid = {
      setKey: allDiscSetKeys[0],
      rarity: 'S' as const,
      level: 10,
      slotKey: '1' as const,
      mainStatKey: 'hp' as const,
      substats: [{ key: 'hp' as const, upgrades: 2 }],
      location: '',
      lock: false,
      trash: false,
    }
    expect(discs['validate'](invalid)).toBeUndefined()
  })
})

const knownGoodSubstats = [
  { key: 'atk_' as const, upgrades: 2 },
  { key: 'def_' as const, upgrades: 2 },
  { key: 'crit_' as const, upgrades: 2 },
  { key: 'crit_dmg_' as const, upgrades: 1 },
]

const importableDisc = (
  setKey: (typeof allDiscSetKeys)[number],
  slotKey: (typeof allDiscSlotKeys)[number],
  level = 12
) => ({
  setKey,
  slotKey,
  level,
  rarity: 'S' as const,
  // Main stat is derived from the slot, and none of the substats collide with it
  mainStatKey: discSlotToMainStatKeys[slotKey][0],
  substats: knownGoodSubstats,
  location: '',
  lock: false,
  trash: false,
})

const zood = (discs: unknown[]) =>
  ({ format: 'ZOD', source: 'test', version: 1, discs }) as any

describe('DiscDataManager import deduplication', () => {
  let database: ZzzDatabase

  beforeEach(() => {
    database = new ZzzDatabase(1, createTestDBStorage('zzz'))
  })

  it('replaces an imported disc that is an exact duplicate', () => {
    const disc = importableDisc(allDiscSetKeys[0], '1')
    database.importZOOD(zood([disc]), true, false)
    const duplicate = importableDisc(allDiscSetKeys[0], '1')

    const result = database.importZOOD(zood([duplicate]), false, false)

    expect(result.discs.unchanged.length).toBe(1)
    expect(result.discs.upgraded.length).toBe(0)
    expect(result.discs.new.length).toBe(0)
    expect(database.discs.values.length).toBe(1)
  })

  it('replaces an imported disc that strictly upgrades a stored one', () => {
    database.importZOOD(
      zood([importableDisc(allDiscSetKeys[0], '1')]),
      true,
      false
    )
    // Level 15 crosses a roll boundary, so a strict upgrade needs the extra
    // roll on one of the substats the stored disc already has
    const upgraded = {
      ...importableDisc(allDiscSetKeys[0], '1', 15),
      substats: [
        { key: 'atk_' as const, upgrades: 2 },
        { key: 'def_' as const, upgrades: 2 },
        { key: 'crit_' as const, upgrades: 2 },
        { key: 'crit_dmg_' as const, upgrades: 2 },
      ],
    }

    const result = database.importZOOD(zood([upgraded]), false, false)

    expect(result.discs.upgraded.length).toBe(1)
    expect(result.discs.new.length).toBe(0)
    expect(database.discs.values.length).toBe(1)
    expect(database.discs.values[0].level).toBe(15)
  })

  it('keeps discs that are not in the import only when asked', () => {
    database.importZOOD(zood([importableDisc(allDiscSetKeys[0], '1')]), true, false)
    const other = importableDisc(allDiscSetKeys[1], '2')

    const kept = database.importZOOD(zood([other]), true, false)
    expect(kept.discs.notInImport).toBe(1)
    expect(database.discs.values.length).toBe(2)

    const removed = database.importZOOD(zood([other]), false, false)
    expect(removed.discs.remove.length).toBe(1)
    expect(database.discs.values.length).toBe(1)
  })

  it('imports a full inventory without quadratic duplicate checks', () => {
    const inventorySize = 1500
    const discs = Array.from({ length: inventorySize }, (_, i) =>
      importableDisc(
        allDiscSetKeys[i % allDiscSetKeys.length],
        allDiscSlotKeys[i % allDiscSlotKeys.length]
      )
    )
    // Seed the database without duplicate checks, then import the same discs
    // upgraded: the second import compares every imported disc against the
    // stored ones. Scanning all stored discs per imported disc used to take
    // tens of seconds here.
    database.importZOOD(zood(discs), true, true)
    const upgraded = discs.map((disc) => ({
      ...disc,
      level: 15,
      substats: [{ key: 'atk_', upgrades: 3 }, ...knownGoodSubstats.slice(1)],
    }))

    const startedAt = performance.now()
    const result = database.importZOOD(zood(upgraded), false, false)
    const elapsedMs = performance.now() - startedAt

    expect(result.discs.upgraded.length).toBe(inventorySize)
    expect(database.discs.values.length).toBe(inventorySize)
    expect(elapsedMs).toBeLessThan(2000)
  })
})

describe('validateDiscBasedOnRarity (business logic)', () => {
  it('should validate disc with correct substats', () => {
    const valid = {
      setKey: allDiscSetKeys[0],
      rarity: 'S' as const,
      level: 12,
      slotKey: '1' as const,
      mainStatKey: 'hp' as const,
      substats: [
        { key: 'atk_' as const, upgrades: 2 },
        { key: 'def_' as const, upgrades: 2 },
        { key: 'crit_' as const, upgrades: 2 },
        { key: 'crit_dmg_' as const, upgrades: 1 },
      ],
      location: '',
      lock: false,
      trash: false,
    }
    const result = validateDiscBasedOnRarity(valid)
    expect(result.validatedDisc).toBeDefined()
    expect(result.errors).toHaveLength(0)
  })

  it('should return error if substat matches mainstat', () => {
    const invalid = {
      setKey: allDiscSetKeys[0],
      rarity: 'S' as const,
      level: 12,
      slotKey: '1' as const,
      mainStatKey: 'hp' as const,
      substats: [
        { key: 'hp' as const, upgrades: 2 },
        { key: 'def_' as const, upgrades: 2 },
        { key: 'crit_' as const, upgrades: 2 },
      ],
      location: '',
      lock: false,
      trash: false,
    }
    const result = validateDiscBasedOnRarity(invalid)
    expect(result.errors.some((e) => e.includes('same as mainstat'))).toBe(true)
  })

  it('should return error if too few substats for level', () => {
    const invalid = {
      setKey: allDiscSetKeys[0],
      rarity: 'S' as const,
      level: 12,
      slotKey: '1' as const,
      mainStatKey: 'hp' as const,
      substats: [{ key: 'atk_' as const, upgrades: 2 }],
      location: '',
      lock: false,
      trash: false,
    }
    const result = validateDiscBasedOnRarity(invalid)
    expect(result.errors.some((e) => e.includes('should have at least'))).toBe(
      true
    )
  })

  it('should return error if upgrades exceed limit', () => {
    const invalid = {
      setKey: allDiscSetKeys[0],
      rarity: 'S' as const,
      level: 0,
      slotKey: '1' as const,
      mainStatKey: 'hp' as const,
      substats: [
        { key: 'atk_' as const, upgrades: 10 },
        { key: 'def_' as const, upgrades: 10 },
        { key: 'crit_' as const, upgrades: 10 },
      ],
      location: '',
      lock: false,
      trash: false,
    }
    const result = validateDiscBasedOnRarity(invalid)
    expect(result.errors.some((e) => e.includes('no more than'))).toBe(true)
  })
})
