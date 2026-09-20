import type { Candidate } from '@zenless-optimizer/game-opt/solver'
import { buildCount } from '@zenless-optimizer/game-opt/solver'
import type { NumTagFree } from '@zenless-optimizer/pando/engine'
import { prune } from '@zenless-optimizer/pando/engine'

import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'
import {
  type GenerateTheoreticalOptions,
  generateTheoreticalDiscs,
  type TheoreticalDiscContext,
  type TheoreticalDiscStats,
} from './generateTheoreticalDiscs'

/**
 * Coarse phases of the theoretical-max pipeline. Reported so the caller can show
 * *something* while the two long synchronous stages run (in a worker).
 */
export type TheoryStage = 'generate' | 'prune' | 'done'

export interface TheoryPipelineGeneratorInput {
  characterKey: CharacterKey
  setFilter2: DiscSetKey[]
  setFilter4: DiscSetKey[]
  slotFilters?: {
    4?: DiscMainStatKey[]
    5?: DiscMainStatKey[]
    6?: DiscMainStatKey[]
  }
  substatRollTargets?: Partial<Record<DiscSubStatKey, number>>
  options?: GenerateTheoreticalOptions
}

/**
 * Everything the pipeline needs, and nothing else: pure data, so the whole
 * input is structured-cloneable. All arguments this generator and `prune`
 * accept are plain objects, arrays, numbers and strings — no calculators, no
 * tag resolvers, no closures.
 */
export interface TheoryPipelineInput {
  generator: TheoryPipelineGeneratorInput
  /** Candidate slots that precede the recipe slot (the w-engine slot). */
  before: Candidate<string>[][]
  /** Candidate slots that follow it (the empty dummy slots). */
  after: Candidate<string>[][]
  /** Prune inputs, exactly as `createSolverConfig` produced them. */
  nodes: NumTagFree[]
  minimum: number[]
  topN: number
  /**
   * Skip CPU prune entirely: generate the full pool and return it as-is.
   * Use this when the caller (e.g. the WebGPU engine) can evaluate all
   * permutations on the GPU and reject candidates in the shader, making
   * CPU-side dominance filtering pure overhead.
   */
  skipPrune?: boolean
}

export interface TheoryPipelineOutput {
  /**
   * Recipe candidates that survived pruning (or the full pool when
   * `skipPrune` was set), as the ORIGINAL (pre-`reaffine`) candidate objects.
   */
  recipeCandidates: Candidate<string>[]
  /**
   * Descriptor index for ALL generated recipes (`Uint16Array`), not just the
   * survivors, so any recipe the solver returns can be materialized. Transfer
   * this buffer rather than copying it.
   */
  recipeIndex: Uint16Array
  context: TheoreticalDiscContext
  stats: TheoreticalDiscStats
  /** Recipes generated before pruning. */
  totalRecipes: number
  /** Total combinations before / after pruning, for progress reporting. */
  beforeCount: number
  afterCount: number
  /** True if prune was skipped (GPU path). */
  pruned: boolean
}

/**
 * Generate the theoretical-max recipe space and prune it in one go.
 *
 * Both stages are pure functions of plain data, which is what lets them run in a
 * worker: the caller hands over a generator configuration plus the node graph
 * `createSolverConfig` built, and gets back only the survivors plus the
 * (transferable) descriptor index. The full pool — millions of candidate
 * objects for a wide configuration — never leaves the worker.
 */
export function runTheoryPipeline(
  input: TheoryPipelineInput,
  onStage?: (stage: TheoryStage) => void
): TheoryPipelineOutput {
  const { generator } = input

  onStage?.('generate')
  const result = generateTheoreticalDiscs(
    generator.characterKey,
    generator.setFilter2,
    generator.setFilter4,
    generator.slotFilters,
    generator.substatRollTargets,
    generator.options
  )

  const recipeSlot = input.before.length
  const candidates: Candidate<string>[][] = [
    ...input.before,
    result.recipes,
    ...input.after,
  ]
  const beforeCount = buildCount(candidates)

  // When skipPrune is set, return the full recipe pool — the caller (GPU)
  // evaluates every permutation directly and rejects candidates in the shader,
  // making CPU-side dominance filtering pure overhead.
  if (input.skipPrune) {
    onStage?.('done')
    return {
      recipeCandidates: result.recipes,
      recipeIndex: result.recipeIndex,
      context: result.context,
      stats: result.stats,
      totalRecipes: result.recipes.length,
      beforeCount,
      afterCount: beforeCount, // no pruning
      pruned: false,
    }
  }

  onStage?.('prune')
  const pruned = prune(input.nodes, candidates, 'q', input.minimum, input.topN)
  const survivors = pruned.candidates[recipeSlot]

  // `prune`'s `reaffine` pass REPLACES candidate objects with ones keyed by
  // synthetic read names (`c0`, `c7`, …) and no longer carrying the raw stat
  // keys. A solver that later prunes the pool itself would re-derive every stat
  // from those names and get zeros, so return the original objects instead.
  // Every prune stage preserves `id`, and recipe ids are unique, so matching on
  // it is exact — and it walks the original pool rather than the pruned one, so
  // the survivors come back in generation order.
  const keepIds = new Set(survivors.map((c) => String(c.id)))
  const recipeCandidates = result.recipes.filter((c) =>
    keepIds.has(String(c.id))
  )

  onStage?.('done')
  return {
    recipeCandidates,
    recipeIndex: result.recipeIndex,
    context: result.context,
    stats: result.stats,
    totalRecipes: result.recipes.length,
    beforeCount,
    afterCount: buildCount(pruned.candidates),
    pruned: true,
  }
}
