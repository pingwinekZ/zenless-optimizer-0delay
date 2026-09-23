import { objKeyMap } from '@zenless-optimizer/common/util'
import type { BuildResult } from '@zenless-optimizer/game-opt/solver'
import type { DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import { allDiscSlotKeys } from '@zenless-optimizer/zzz/consts'
import type {
  BuildRecipe,
  ICachedDisc,
  TargetTag,
  Team,
} from '@zenless-optimizer/zzz/db'
import { getComboFrames, targetTag } from '@zenless-optimizer/zzz/db'
import { createRecipeDiscs } from './optimizeUtils'

/** Solver result reshaped for display/stat computation. */
export type StoredBuild = {
  wengineKey: string
  discIds: Record<DiscSlotKey, string | undefined>
  value: number
}

/**
 * Solver frames for the run: combo frames carry per-hit tags/multipliers
 * (each maps to calc preset${i}); without any tagged frame the single
 * target falls back to a multiplier-1 frame.
 */
export function resolveSolverFrames(
  team: Team,
  target: TargetTag
): Array<{ tag: ReturnType<typeof targetTag>; multiplier: number }> {
  const frames = getComboFrames(team)
    .filter((frame) => frame.tag)
    .map((frame) => ({
      tag: targetTag(frame.tag!),
      multiplier: frame.multiplier,
    }))
  if (frames.length === 0)
    frames.push({ tag: targetTag(target), multiplier: 1 })
  return frames
}

/**
 * Map raw solver results to stored builds: recipe IDs in slot 1 expand to
 * per-slot disc IDs, duplicates (same wengine + disc combination via
 * different search paths) are dropped, and the survivors re-sort by value
 * descending since dedup can leave holes in the solver ordering.
 */
export function toStoredBuilds(results: BuildResult<string>[]): StoredBuild[] {
  return results
    .map(({ ids, value }) => {
      // Recipe builds: the solver stores the recipe ID (e.g. 'recipe_0')
      // in slot 1. We need to expand it to per-slot disc IDs
      // ('recipe_0_1', 'recipe_0_2', etc.) so the stat computation
      // and display can find the fake discs in theoreticalDiscMap.
      const recipeId =
        ids[1] && String(ids[1]).startsWith('recipe_')
          ? String(ids[1])
          : undefined
      return {
        wengineKey: ids[0],
        discIds: objKeyMap(allDiscSlotKeys, (slot, _index) =>
          recipeId ? `${recipeId}_${slot}` : ids[_index + 1]
        ),
        value,
      }
    })
    .filter(
      (() => {
        const seen = new Set<string>()
        return (build: {
          wengineKey?: string
          discIds: { [key: string]: string | undefined }
        }) => {
          const id = `${build.wengineKey ?? ''}-${Object.values(build.discIds).join('-')}`
          if (seen.has(id)) return false
          seen.add(id)
          return true
        }
      })()
    )
    .sort((a, b) => b.value - a.value)
}

/**
 * Materialize disc objects only for the returned builds (avoids OOM from
 * pre-creating discs for ALL recipes) via the recipe metadata resolver.
 */
export function materializeReturnedDiscs(
  storedBuilds: StoredBuild[],
  resolveRecipe: (recipeId: string) => BuildRecipe | undefined
): Record<string, ICachedDisc> {
  const returnedDiscMap: Record<string, ICachedDisc> = {}
  for (const build of storedBuilds) {
    const rid = build.discIds['1']?.replace(/_\d+$/, '')
    const recipe = rid ? resolveRecipe(rid) : undefined
    if (rid && recipe) {
      const discs = createRecipeDiscs(recipe, rid)
      for (const disc of discs) {
        returnedDiscMap[disc.id] = disc
      }
    }
  }
  return returnedDiscMap
}
