import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { ICachedDisc } from '@zenless-optimizer/zzz/db'
import {
  buildPermutationDetails,
  filterDiscsBySets,
  filterDiscsBySlot,
  filterWengineKeys,
} from './discFiltering'

const disc = (over: Record<string, unknown>) =>
  ({
    id: 'd',
    slotKey: '1',
    mainStatKey: 'hp',
    level: 15,
    location: undefined,
    setKey: 'SwingJazz',
    ...over,
  }) as unknown as ICachedDisc

const baseOpts = {
  levelLow: 0,
  levelHigh: 15,
  useEquipped: true,
  useCharacterPriority: false,
  slot4: [],
  slot5: [],
  slot6: [],
  characterKey: 'Anby' as CharacterKey,
  customSortOrder: [],
} as const

describe('filterDiscsBySlot', () => {
  it('groups discs by slot', () => {
    const out = filterDiscsBySlot(
      [disc({}), disc({ slotKey: '4', mainStatKey: 'crit_' })],
      baseOpts
    )
    expect(Object.keys(out).sort()).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(out['1']).toHaveLength(1)
    expect(out['4']).toHaveLength(1)
  })
  it('filters by level range', () => {
    const discs = [disc({ level: 15 }), disc({ level: 9 }), disc({ level: 0 })]
    const out = filterDiscsBySlot(discs, {
      ...baseOpts,
      levelLow: 10,
      levelHigh: 15,
    })
    expect(out['1']).toHaveLength(1)
  })
  it('excludes other characters discs when useEquipped is false', () => {
    const discs = [
      disc({ location: 'Nicole' }),
      disc({ location: 'Anby' }),
      disc({}),
    ]
    const out = filterDiscsBySlot(discs, {
      ...baseOpts,
      useEquipped: false,
    })
    expect(out['1']).toHaveLength(2)
  })
  it('excludes higher-priority owners when priority is on', () => {
    const discs = [disc({ location: 'Nicole' }), disc({})]
    const opts = {
      ...baseOpts,
      useCharacterPriority: true,
      customSortOrder: ['Nicole', 'Anby'],
    }
    expect(filterDiscsBySlot(discs, opts)['1']).toHaveLength(1)
    expect(
      filterDiscsBySlot(discs, { ...opts, customSortOrder: [] })['1']
    ).toHaveLength(2)
  })
  it('filters main stats on slots 4-6 only', () => {
    const hp4 = disc({ slotKey: '4', mainStatKey: 'hp' })
    const crit4 = disc({ slotKey: '4', mainStatKey: 'crit_' })
    const hp1 = disc({ slotKey: '1', mainStatKey: 'hp' })
    const opts = { ...baseOpts, slot4: ['crit_'] as const }
    const out = filterDiscsBySlot([hp4, crit4, hp1], opts)
    expect(out['4']).toEqual([crit4])
    expect(out['1']).toEqual([hp1])
    const unfiltered = filterDiscsBySlot([hp4], baseOpts)
    expect(unfiltered['4']).toEqual([hp4])
  })
})

describe('filterWengineKeys', () => {
  const all = [
    { key: 'AngelInTheShell' },
    { key: 'NeonFantasies' },
    { key: 'SerpentineSeeker' },
  ] as const
  it('returns only the equipped wengine when not optimizing', () => {
    expect(
      filterWengineKeys(all, {
        optWengine: false,
        wEngineTypes: [],
        equippedWengineKey: 'AngelInTheShell',
      })
    ).toEqual(['AngelInTheShell'])
    expect(
      filterWengineKeys(all, {
        optWengine: false,
        wEngineTypes: [],
        equippedWengineKey: '',
      })
    ).toEqual([])
  })
  it('filters by wengine type when optimizing', () => {
    expect(
      filterWengineKeys(all, {
        optWengine: true,
        wEngineTypes: ['stun'],
        equippedWengineKey: 'AngelInTheShell',
      })
    ).toEqual(['NeonFantasies'])
  })
})

describe('filterDiscsBySets', () => {
  it('passes through when no set filters are active', () => {
    const bySlot = filterDiscsBySlot([disc({})], baseOpts)
    expect(filterDiscsBySets(bySlot, [], [])).toBe(bySlot)
    expect(filterDiscsBySets(bySlot, undefined, undefined)).toBe(bySlot)
  })
  it('keeps only discs from the selected sets', () => {
    const bySlot = filterDiscsBySlot(
      [disc({}), disc({ setKey: 'PufferElectro' })],
      baseOpts
    )
    const out = filterDiscsBySets(bySlot, undefined, ['SwingJazz'])
    expect(out['1']).toHaveLength(1)
    expect(out['1'][0].setKey).toBe('SwingJazz')
  })
})

describe('buildPermutationDetails', () => {
  it('reports filtered counts against raw totals', () => {
    const discs = [
      disc({ slotKey: '1' }),
      disc({ slotKey: '1' }),
      disc({ slotKey: '2' }),
    ]
    const bySlot = filterDiscsBySlot(discs, baseOpts)
    const filtered = filterDiscsBySets(bySlot, undefined, ['SwingJazz'])
    const details = buildPermutationDetails(discs, filtered)
    expect(details['1']).toEqual({ count: 2, total: 2 })
    expect(details['2']).toEqual({ count: 1, total: 1 })
    expect(details['3']).toEqual({ count: 0, total: 0 })
  })
})
