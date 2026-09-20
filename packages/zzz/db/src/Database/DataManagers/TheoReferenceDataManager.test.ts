import {
  createMockStorage,
  DBLocalStorage,
} from '@zenless-optimizer/common/database'
import { ZzzDatabase } from '../Database'
import { isTheoReferenceStale } from './TheoReferenceDataManager'

const validReference = {
  value: 3181190,
  perfectRolls: { crit_: 10, crit_dmg_: 5 },
  mainsBySlot: { 4: 'crit_' },
  set4: 'FangedMetal',
  set2: 'ChaoticMetal',
  targetKey: '{"t":"combo"}',
  setFilter2: ['ChaoticMetal'],
  setFilter4: ['FangedMetal'],
  date: 1726600000000,
}

describe('TheoReferenceDataManager', () => {
  let database: ZzzDatabase
  let theoReferences: ZzzDatabase['theoReferences']

  beforeEach(() => {
    const storage = createMockStorage()
    const dbStorage = new DBLocalStorage(storage, 'zzz')
    database = new ZzzDatabase(1, dbStorage)
    theoReferences = database.theoReferences
  })

  it('pins and reads back a reference', () => {
    expect(theoReferences.pin('Ellen', validReference as any)).toBe(true)
    const pinned = theoReferences.get('Ellen')
    expect(pinned?.value).toBe(3181190)
    expect(pinned?.perfectRolls['crit_']).toBe(10)
    expect(pinned?.mainsBySlot['4']).toBe('crit_')
  })

  it('drops unknown substats and mains on load', () => {
    theoReferences.pin('Ellen', {
      ...validReference,
      perfectRolls: { crit_: 10, bogus_: 3 },
      mainsBySlot: { 4: 'bogus' },
    } as any)
    const pinned = theoReferences.get('Ellen')
    expect(pinned?.perfectRolls['bogus_' as never]).toBeUndefined()
    expect(pinned?.mainsBySlot['4']).toBeUndefined()
  })

  it('rejects non-positive values', () => {
    expect(
      theoReferences.set('Ellen', { ...validReference, value: 0 } as any)
    ).toBe(false)
    expect(theoReferences.get('Ellen')).toBeUndefined()
  })

  it('clears the reference', () => {
    theoReferences.pin('Ellen', validReference as any)
    theoReferences.clearReference('Ellen')
    expect(theoReferences.get('Ellen')).toBeUndefined()
  })

  it('writes namespaced storage keys and reloads across instances', () => {
    const storage = createMockStorage()
    const first = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
      .theoReferences
    expect(
      first.pin('Ellen', {
        ...validReference,
        bestRecipe: {
          id: 'recipe_0',
          mainStats: {
            1: 'hp',
            2: 'atk',
            3: 'def',
            4: 'crit_',
            5: 'atk_',
            6: 'atk_',
          },
          totalRolls: { crit_: 10 },
          appearances: {},
          perDiscSubstats: [],
          set4: 'FangedMetal',
          set2: 'ChaoticMetal',
        },
        referenceDiscs: [
          {
            id: 'theoref_Ellen_4',
            setKey: 'FangedMetal',
            slotKey: '4',
            level: 15,
            rarity: 'S',
            mainStatKey: 'crit_',
            substats: [{ key: 'crit_dmg_', upgrades: 5 }],
            location: '',
            lock: false,
            trash: false,
          },
        ],
        referenceCombatStats: { atk: 2500, critRate: 0.8 },
      } as any)
    ).toBe(true)
    expect(storage.getItem('zzz_theoReference_Ellen')).toBeTruthy()

    const second = new ZzzDatabase(1, new DBLocalStorage(storage, 'zzz'))
      .theoReferences
    const reloaded = second.get('Ellen')
    expect(reloaded?.value).toBe(3181190)
    expect(reloaded?.referenceDiscs).toHaveLength(1)
    expect(reloaded?.referenceDiscs?.[0].mainStatKey).toBe('crit_')
    expect(reloaded?.referenceCombatStats?.atk).toBe(2500)
    expect(reloaded?.bestRecipe?.set4).toBe('FangedMetal')
  })

  it('migrates legacy tie-band pins to the single-build shape', () => {
    theoReferences.pin('Ellen', {
      value: 3181190,
      avgRolls: { crit_: 7.5, crit_dmg_: 7.5 },
      bandRolls: [
        { crit_: 10, crit_dmg_: 5 },
        { crit_: 5, crit_dmg_: 10 },
      ],
      mainsBySlot: { 4: ['crit_', 'crit_dmg_'] },
      bandSize: 2,
      targetKey: '{"t":"combo"}',
      setFilter2: [],
      setFilter4: [],
      date: 1726600000000,
    } as any)
    const pinned = theoReferences.get('Ellen')
    expect(pinned?.value).toBe(3181190)
    // Best member was first: exact rolls, first main.
    expect(pinned?.perfectRolls['crit_']).toBe(10)
    expect(pinned?.mainsBySlot['4']).toBe('crit_')
    expect(
      (pinned as unknown as { bandSize?: number }).bandSize
    ).toBeUndefined()
  })

  it('detects stale context', () => {
    const current = {
      targetKey: '{"t":"combo"}',
      setFilter2: ['ChaoticMetal'],
      setFilter4: ['FangedMetal'],
    } as any
    expect(isTheoReferenceStale(validReference as any, current)).toBe(false)
    expect(
      isTheoReferenceStale(validReference as any, {
        ...current,
        setFilter4: ['PolarMetal'],
      })
    ).toBe(true)
    expect(
      isTheoReferenceStale(validReference as any, {
        ...current,
        targetKey: '{"t":"other"}',
      })
    ).toBe(true)
  })
})
