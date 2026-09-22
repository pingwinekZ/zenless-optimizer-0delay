import type { BuildRecipe, Team } from '@zenless-optimizer/zzz/db'
import {
  materializeReturnedDiscs,
  resolveSolverFrames,
  type StoredBuild,
  toStoredBuilds,
} from './solverResults'

describe('resolveSolverFrames', () => {
  it('falls back to the single target when no frame is tagged', () => {
    const team = {
      teammates: [{ characterKey: 'Anby' }],
      frames: [{}, {}],
    } as unknown as Team
    const frames = resolveSolverFrames(team, { q: 'atk' } as never)
    expect(frames).toHaveLength(1)
    expect(frames[0].multiplier).toBe(1)
    expect(frames[0].tag).toMatchObject({ q: 'atk' })
  })
  it('expands tagged frames with their multipliers', () => {
    const team = {
      teammates: [{ characterKey: 'Anby' }],
      frames: [
        { tag: { q: 'atk', qt: 'final' }, multiplier: 0.5 },
        { tag: undefined, multiplier: 1 },
      ],
    } as unknown as Team
    const frames = resolveSolverFrames(team, { q: 'atk' } as never)
    expect(frames).toHaveLength(1)
    expect(frames[0].multiplier).toBe(0.5)
  })
})

describe('toStoredBuilds', () => {
  it('expands recipe ids to per-slot disc ids', () => {
    const out = toStoredBuilds([{ ids: ['we0', 'recipe_3'], value: 10 }])
    expect(out).toHaveLength(1)
    expect(out[0].wengineKey).toBe('we0')
    expect(out[0].discIds['1']).toBe('recipe_3_1')
    expect(out[0].discIds['6']).toBe('recipe_3_6')
  })
  it('passes through plain disc ids', () => {
    const out = toStoredBuilds([
      { ids: ['we0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'], value: 5 },
    ])
    expect(out[0].discIds['1']).toBe('d1')
    expect(out[0].discIds['6']).toBe('d6')
  })
  it('dedupes identical builds and re-sorts by value', () => {
    const out = toStoredBuilds([
      { ids: ['we0', 'd1'], value: 1 },
      { ids: ['we0', 'd1'], value: 1 },
      { ids: ['we1', 'd1'], value: 9 },
      { ids: ['we0', 'd2'], value: 5 },
    ])
    expect(out.map((b) => b.value)).toEqual([9, 5, 1])
  })
})

describe('materializeReturnedDiscs', () => {
  const recipe = {
    id: 'recipe_3',
    mainStats: { '1': 'hp' },
    totalRolls: {},
    appearances: {},
    perDiscSubstats: [[], [], [], [], [], []],
    set4: 'PufferElectro',
    set2: 'SwingJazz',
  } as unknown as BuildRecipe
  const stored: StoredBuild[] = [
    { wengineKey: 'we0', discIds: { '1': 'recipe_3_1' } as never, value: 10 },
    { wengineKey: 'we0', discIds: { '1': 'plain_1' } as never, value: 5 },
  ]
  it('materializes discs for resolvable recipes only', () => {
    const map = materializeReturnedDiscs(stored, (rid) =>
      rid === 'recipe_3' ? recipe : undefined
    )
    expect(Object.keys(map).sort()).toEqual([
      'recipe_3_1',
      'recipe_3_2',
      'recipe_3_3',
      'recipe_3_4',
      'recipe_3_5',
      'recipe_3_6',
    ])
  })
  it('returns an empty map when nothing resolves', () => {
    expect(materializeReturnedDiscs(stored, () => undefined)).toEqual({})
  })
})
