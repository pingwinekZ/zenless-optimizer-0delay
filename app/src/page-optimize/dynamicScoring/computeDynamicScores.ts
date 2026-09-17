import type { DiscSlotKey } from '../../consts'
import type { DiscIds } from '../../db'

export type DynamicScoreEntry = {
  discId: string
  slot: DiscSlotKey
  /** Best local build value among scored builds containing this disc. */
  bestWithDisc: number
  /** Raw ratio vs theoretical best: bestWithDisc / theoBest, clamped to [0, 1]. */
  baseRatio: number
  /**
   * Score shown in disc cards: % of the theoretical best build value.
   * Same as baseRatio — the local best disc per slot scores
   * localBest / theoBest, not 1.0, so the gap to perfect stays visible.
   */
  score: number
  /** Number of scored builds containing this disc. */
  buildCount: number
  /**
   * Perfect-context value: theoretical-best build with this disc plugged
   * into its slot. Damage lens of the dynamic score.
   */
  plugValue?: number
  /**
   * Weighted premium rolls on this disc / weighted premium rolls on the
   * theoretical-best disc in the same slot. Roll lens of the dynamic
   * score; score is the lower of the two lenses.
   */
  rollRatio?: number
}

export type DynamicRunMeta = {
  characterKey: string
  theoBest: number
  localBest: number
  /** Overall inventory efficiency: localBest / theoBest. */
  ratio: number
  scoredBuilds: number
  scoredDiscs: number
  date: number
}

export type ScoredBuildInput = {
  value: number
  discIds: DiscIds
}

/**
 * Compute dynamic disc scores as % of the theoretical best.
 *
 * - score(disc) = maxValue(builds containing disc) / theoBest
 *
 * The local best disc per slot therefore shows localBest / theoBest — the
 * gap to a perfect build stays visible instead of being renormalized to 1.0.
 *
 * Discs that appear in no scored build get no entry; callers fall back to
 * the static efficiency score for those.
 */
export function computeDynamicDiscScores(
  localBuilds: ScoredBuildInput[],
  theoBest: number,
  getSlot: (discId: string) => DiscSlotKey | undefined
): {
  entries: Record<string, DynamicScoreEntry>
  localBest: number
  ratio: number
} {
  const bestByDisc = new Map<string, { best: number; count: number }>()
  let localBest = 0
  for (const build of localBuilds) {
    if (!Number.isFinite(build.value)) continue
    if (build.value > localBest) localBest = build.value
    for (const id of Object.values(build.discIds)) {
      if (!id) continue
      const prev = bestByDisc.get(id)
      if (!prev) bestByDisc.set(id, { best: build.value, count: 1 })
      else {
        prev.count += 1
        if (build.value > prev.best) prev.best = build.value
      }
    }
  }

  const ratio =
    theoBest > 0 && localBest > 0 ? Math.min(1, localBest / theoBest) : 0

  const entries: Record<string, DynamicScoreEntry> = {}
  if (theoBest > 0) {
    for (const [discId, { best, count }] of bestByDisc) {
      const slot = getSlot(discId)
      if (!slot) continue
      const base = Math.max(0, Math.min(1, best / theoBest))
      entries[discId] = {
        discId,
        slot,
        bestWithDisc: best,
        baseRatio: base,
        score: base,
        buildCount: count,
      }
    }
  }
  return { entries, localBest, ratio }
}
