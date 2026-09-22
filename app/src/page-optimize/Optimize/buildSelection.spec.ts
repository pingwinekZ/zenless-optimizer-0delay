import type { GeneratedBuild, Team } from '@zenless-optimizer/zzz/db'
import {
  nextSelectedBuild,
  pinToggleForSelected,
  resolveEnrichmentFormulaTag,
} from './buildSelection'

const build = (over: Record<string, unknown> = {}) =>
  ({
    value: 100,
    wengineKey: 'AngelInTheShell',
    discIds: { '1': 'a_1', '2': 'a_2' },
    ...over,
  }) as unknown as GeneratedBuild

const equipped = build({ value: 0, discIds: { '1': 'eq_1' } })
const theoA = build({ value: 200, discIds: { '1': 'recipe_1_1' } })
const theoB = build({ value: 150, discIds: { '1': 'recipe_2_1' } })

describe('nextSelectedBuild', () => {
  it('selects the first theoretical build for a new set in theo mode', () => {
    expect(
      nextSelectedBuild({
        isNewResultSet: true,
        builds: [theoA, theoB],
        useTheoreticalMax: true,
        equippedBuild: equipped,
        current: theoB,
        allBuilds: [theoA, theoB],
      })
    ).toBe(theoA)
  })
  it('selects the equipped build for a new set otherwise', () => {
    expect(
      nextSelectedBuild({
        isNewResultSet: true,
        builds: [theoA],
        useTheoreticalMax: false,
        equippedBuild: equipped,
        current: theoA,
        allBuilds: [theoA],
      })
    ).toBe(equipped)
    expect(
      nextSelectedBuild({
        isNewResultSet: true,
        builds: [],
        useTheoreticalMax: true,
        equippedBuild: equipped,
        current: undefined,
        allBuilds: [],
      })
    ).toBe(equipped)
  })
  it('keeps the current selection when it still exists', () => {
    expect(
      nextSelectedBuild({
        isNewResultSet: false,
        builds: [theoA, theoB],
        useTheoreticalMax: true,
        equippedBuild: equipped,
        current: theoB,
        allBuilds: [theoA, theoB],
      })
    ).toBe(theoB)
  })
  it('falls back to equipped when the selection vanished', () => {
    expect(
      nextSelectedBuild({
        isNewResultSet: false,
        builds: [theoA],
        useTheoreticalMax: false,
        equippedBuild: equipped,
        current: theoB,
        allBuilds: [theoA],
      })
    ).toBe(equipped)
    expect(
      nextSelectedBuild({
        isNewResultSet: false,
        builds: [],
        useTheoreticalMax: false,
        equippedBuild: equipped,
        current: undefined,
        allBuilds: [],
      })
    ).toBe(equipped)
  })
})

describe('pinToggleForSelected', () => {
  it('returns undefined without a selection', () => {
    expect(pinToggleForSelected(undefined, [], [theoA])).toBeUndefined()
  })
  it('removes an already-pinned build', () => {
    expect(
      pinToggleForSelected(
        theoA,
        [{ buildId: 'AngelInTheShell-recipe_1_1' }],
        [theoA]
      )
    ).toEqual({
      action: 'remove',
      buildId: 'AngelInTheShell-recipe_1_1',
    })
  })
  it('adds an unpinned build with its grid index', () => {
    expect(pinToggleForSelected(theoB, [], [theoA, theoB])).toEqual({
      action: 'add',
      entry: {
        buildId: 'AngelInTheShell-recipe_2_1',
        index: 1,
        value: 150,
        wengineKey: 'AngelInTheShell',
        discIds: { '1': 'recipe_2_1' },
      },
    })
  })
  it('adds the equipped build with index -1', () => {
    const toggle = pinToggleForSelected(equipped, [], [theoA])
    expect(toggle).toMatchObject({ action: 'add' })
    if (toggle?.action === 'add') expect(toggle.entry.index).toBe(-1)
  })
})

describe('resolveEnrichmentFormulaTag', () => {
  const teamWith = (tag: unknown) =>
    ({
      teammates: [{ characterKey: 'Anby' }],
      frames: [{ tag }],
    }) as unknown as Team
  it('returns undefined without a target tag', () => {
    expect(resolveEnrichmentFormulaTag(teamWith(undefined))).toBeUndefined()
  })
  it('resolves a single target tag', () => {
    expect(
      resolveEnrichmentFormulaTag(teamWith({ q: 'atk', qt: 'final' }))
    ).toEqual({
      et: 'own',
      q: 'atk',
      qt: 'final',
      sheet: 'agg',
    })
  })
})
