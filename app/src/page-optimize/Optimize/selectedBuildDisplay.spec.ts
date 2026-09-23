import type { GeneratedBuild } from '@zenless-optimizer/zzz/db'
import { buildRowId } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import {
  isTheoreticalBuild,
  resolveDisplayValue,
  resolveSelectedRecipeId,
} from './selectedBuildDisplay'

const build = (disc1?: string, value = 0): GeneratedBuild =>
  ({ discIds: { '1': disc1 }, value }) as unknown as GeneratedBuild

describe('resolveSelectedRecipeId', () => {
  it('strips the per-slot suffix from recipe ids', () => {
    expect(resolveSelectedRecipeId(build('recipe_3_1').discIds)).toBe(
      'recipe_3'
    )
  })
  it('strips trailing numeric suffixes (recipe or plain ids)', () => {
    expect(resolveSelectedRecipeId(build('plain_1').discIds)).toBe('plain')
    expect(resolveSelectedRecipeId(build('abcdef').discIds)).toBe('abcdef')
    expect(resolveSelectedRecipeId(undefined)).toBe('')
  })
})

describe('isTheoreticalBuild', () => {
  it('detects recipe builds', () => {
    expect(isTheoreticalBuild(build('recipe_3_1').discIds)).toBe(true)
  })
  it('rejects plain builds and missing ids', () => {
    expect(isTheoreticalBuild(build('plain_1').discIds)).toBe(false)
    expect(isTheoreticalBuild(undefined)).toBe(false)
  })
})

describe('resolveDisplayValue', () => {
  it('prefers the enriched recomputed value', () => {
    const selected = build('d1', 0)
    const enriched = [{ id: buildRowId(selected), value: 1234 }]
    expect(resolveDisplayValue(selected, enriched)).toBe(1234)
  })
  it('falls back to the stored value when not enriched', () => {
    const selected = build('d1', 77)
    expect(resolveDisplayValue(selected, [])).toBe(77)
  })
})
