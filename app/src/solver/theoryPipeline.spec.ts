import type { Candidate } from '@zenless-optimizer/game-opt/solver'
import { buildCount } from '@zenless-optimizer/game-opt/solver'
import type { NumTagFree } from '@zenless-optimizer/pando/engine'
import { max, prune, read, sum } from '@zenless-optimizer/pando/engine'
import { describe, expect, it } from 'vitest'
import type { DiscSetKey } from '../consts'
import {
  generateTheoreticalDiscs,
  materializeRecipeFromIndex,
} from './generateTheoreticalDiscs'
import { runTheoryPipeline } from './theoryPipeline'

/**
 * Guards for the worker-side pipeline (`runTheoryPipeline`).
 *
 * The pipeline is only useful if it is *indistinguishable* from running the
 * generator and `prune` directly on the main thread — same survivors, same
 * metadata — while returning almost nothing. These tests pin that, plus the
 * structured-cloneability of everything that crosses the worker boundary (a
 * function or symbol anywhere in the payload would break the worker at runtime,
 * not at build time).
 */

const CHAR = 'Promeia'
const SET2: DiscSetKey[] = ['PhaethonsMelody']
const SET4: DiscSetKey[] = ['NotesFromTheChained']
const SLOT_FILTERS = {
  4: ['anomProf' as const],
  5: ['ice_dmg_' as const],
  6: ['anomMas_' as const],
}
const TOP_N = 100

function generate() {
  return generateTheoreticalDiscs(CHAR, SET2, SET4, SLOT_FILTERS as any)
}

/** W-engine / empty-dummy slots, matching `createSolverConfig`'s layout. */
function sideSlots() {
  const wengine: Candidate<string>[][] = [
    [
      {
        id: 'FrostfallSickle',
        lvl: 60,
        modification: 5,
        phase: 1,
        FrostfallSickle: 1,
      } as Candidate<string>,
    ],
  ]
  const empties: Candidate<string>[][] = [
    'empty_2',
    'empty_3',
    'empty_4',
    'empty_5',
    'empty_6',
  ].map((id) => [{ id, __empty: 0 } as unknown as Candidate<string>])
  return { wengine, empties }
}

/**
 * A real node graph over the recipes: an objective plus three binding minimum
 * constraints (at the median of each coord) and a set-counter constraint, i.e.
 * the same shape `createSolverConfig` produces.
 */
function buildNodes(recipes: Candidate<string>[]): {
  nodes: NumTagFree[]
  minimum: number[]
} {
  const probe = recipes[0] as unknown as Record<string, number | string>
  const setKeys = new Set<string>([...SET2, ...SET4])
  const statKeys = Object.keys(probe).filter(
    (k) => k !== 'id' && !setKeys.has(k) && typeof probe[k] === 'number'
  )
  expect(statKeys.length).toBeGreaterThanOrEqual(3)
  const [k0, k1, k2] = statKeys

  const median = (key: string) => {
    const vals = recipes
      .map((r) => (r as unknown as Record<string, number>)[key])
      .filter((v) => typeof v === 'number')
      .sort((a, b) => a - b)
    return vals[Math.floor(vals.length * 0.5)]
  }

  const nodes = [
    // objective (its own minimum is -Infinity, so it never rejects)
    sum(read({ q: k0 }, 'sum'), read({ q: k1 }, 'sum'), read({ q: k2 }, 'sum')),
    read({ q: k0 }, 'sum'),
    read({ q: k1 }, 'sum'),
    read({ q: k2 }, 'sum'),
    // at least two discs of one of the requested sets
    max(read({ q: SET4[0] }, 'sum'), read({ q: SET2[0] }, 'sum')),
  ] as unknown as NumTagFree[]
  return { nodes, minimum: [-Infinity, median(k0), median(k1), median(k2), 2] }
}

describe('runTheoryPipeline', () => {
  it('returns exactly the survivors a direct prune would keep', () => {
    const generated = generate()
    const { wengine, empties } = sideSlots()
    const { nodes, minimum } = buildNodes(generated.recipes)

    const direct = prune(
      nodes,
      [wengine[0], generated.recipes, ...empties],
      'q',
      minimum,
      TOP_N
    )
    const directIds = new Set(
      (direct.candidates[1] as Candidate<string>[]).map((c) => String(c.id))
    )

    const out = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: SET2,
        setFilter4: SET4,
        slotFilters: SLOT_FILTERS as any,
      },
      before: [wengine[0]],
      after: empties,
      nodes,
      minimum,
      topN: TOP_N,
    })

    // Pruning must have actually done something, else the equivalence below is
    // vacuous.
    expect(out.beforeCount).toBe(generated.recipes.length)
    expect(out.afterCount).toBe(buildCount(direct.candidates))
    expect(directIds.size).toBeGreaterThan(0)
    expect(directIds.size).toBeLessThan(generated.recipes.length)

    expect(new Set(out.recipeCandidates.map((c) => String(c.id)))).toEqual(
      directIds
    )
    expect(out.totalRecipes).toBe(generated.recipes.length)
    expect(out.stats.recipeCount).toBe(generated.recipes.length)
  })

  it('hands back the original candidates, not prune’s reaffined ones', () => {
    const generated = generate()
    const { wengine, empties } = sideSlots()
    const { nodes, minimum } = buildNodes(generated.recipes)

    // The pipeline generates its own pool, so candidate identity cannot be
    // compared across calls. What must hold is that a survivor still *is* a raw
    // recipe candidate: same keys and same values as the reference generation,
    // with no synthetic read names left by `reaffine`.
    const byId = new Map(generated.recipes.map((c) => [String(c.id), c]))
    const out = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: SET2,
        setFilter4: SET4,
        slotFilters: SLOT_FILTERS as any,
      },
      before: [wengine[0]],
      after: empties,
      nodes,
      minimum,
      topN: TOP_N,
    })

    expect(out.recipeCandidates.length).toBeGreaterThan(0)
    for (const survivor of out.recipeCandidates) {
      const reference = byId.get(String(survivor.id))
      expect(reference).toBeDefined()
      expect(survivor).toEqual(reference)
      // Explicitly reject `reaffine`'s synthetic read names: a solver that
      // prunes this pool again would read every stat through them as zero.
      const keys = Object.keys(survivor as object)
      expect(keys.filter((k) => /^c\d+$/.test(k))).toEqual([])
      expect(keys).toEqual(Object.keys(reference as object))
    }
  })

  it('keeps the descriptor index usable through a structured clone', () => {
    const generated = generate()
    const { wengine, empties } = sideSlots()
    const { nodes, minimum } = buildNodes(generated.recipes)

    const out = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: SET2,
        setFilter4: SET4,
        slotFilters: SLOT_FILTERS as any,
      },
      before: [wengine[0]],
      after: empties,
      nodes,
      minimum,
      topN: TOP_N,
    })

    // Everything that crosses the worker boundary must be cloneable. A function
    // or symbol in the node graph or the context would throw at runtime (in the
    // browser), never at build time — so pin it here.
    expect(() => structuredClone(nodes)).not.toThrow()
    expect(() => structuredClone(minimum)).not.toThrow()
    expect(() => structuredClone(wengine)).not.toThrow()
    expect(() => structuredClone(empties)).not.toThrow()
    expect(() => structuredClone(out.context)).not.toThrow()

    const index = structuredClone(out.recipeIndex)
    const context = structuredClone(out.context)

    for (const idx of [0, 1, 7, 1234, generated.recipes.length - 1]) {
      expect(materializeRecipeFromIndex(idx, index, context)).toEqual(
        generated.materializeRecipe(idx)
      )
    }
    expect(materializeRecipeFromIndex(-1, index, context)).toBeUndefined()
    expect(
      materializeRecipeFromIndex(generated.recipes.length, index, context)
    ).toBeUndefined()
  })

  it('skips prune and returns the full pool when skipPrune is set', () => {
    const generated = generate()
    const { wengine, empties } = sideSlots()
    const { nodes, minimum } = buildNodes(generated.recipes)

    const pruned = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: SET2,
        setFilter4: SET4,
        slotFilters: SLOT_FILTERS as any,
      },
      before: [wengine[0]],
      after: empties,
      nodes,
      minimum,
      topN: TOP_N,
    })

    const unpruned = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: SET2,
        setFilter4: SET4,
        slotFilters: SLOT_FILTERS as any,
      },
      before: [wengine[0]],
      after: empties,
      nodes,
      minimum,
      topN: TOP_N,
      skipPrune: true,
    })

    // Full pool when skipPrune, pruned subset otherwise
    expect(unpruned.recipeCandidates.length).toBe(generated.recipes.length)
    expect(pruned.recipeCandidates.length).toBeLessThan(
      generated.recipes.length
    )
    expect(unpruned.pruned).toBe(false)
    expect(pruned.pruned).toBe(true)
    // afterCount should equal beforeCount when prune is skipped
    expect(unpruned.afterCount).toBe(unpruned.beforeCount)
    expect(unpruned.afterCount).toBe(generated.recipes.length)
    // All unpruned candidates have raw stat keys (no synthetic names)
    for (const c of unpruned.recipeCandidates) {
      expect(Object.keys(c as object).filter((k) => /^c\d+$/.test(k))).toEqual(
        []
      )
    }
  })

  it('reports an empty space instead of throwing on an unfiltered plan', () => {
    const { wengine, empties } = sideSlots()
    const out = runTheoryPipeline({
      generator: {
        characterKey: CHAR,
        setFilter2: [],
        setFilter4: [],
      },
      before: [wengine[0]],
      after: empties,
      nodes: [read({ q: 'atk_' }, 'sum')] as unknown as NumTagFree[],
      minimum: [-Infinity],
      topN: TOP_N,
    })
    expect(out.totalRecipes).toBe(0)
    expect(out.recipeCandidates).toEqual([])
    expect(out.recipeIndex.length).toBe(0)
  })
})
