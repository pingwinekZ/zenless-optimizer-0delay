import type { DiscSlotKey, DiscSubStatKey } from '../../consts'
import type { DiscIds, ICachedDisc } from '../../db'
import {
  computeDynamicDiscScores,
  type DynamicScoreEntry,
} from './computeDynamicScores'

export type ReplacementScoredBuild = {
  value: number
  wengineKey?: string
  discIds: DiscIds
}

/**
 * Evaluates an optimization-target value for a concrete set of 6 discs.
 * Returns `undefined` when the value cannot be computed.
 */
export type ReplacementEvaluator = (
  discs: Record<DiscSlotKey, ICachedDisc | undefined>,
  wengineKey?: string
) => number | undefined

export type ReplacementOptions = {
  isCancelled?: () => boolean
  /** Yield to the browser every N evaluations so the page keeps painting. */
  yieldEvery?: number
}

/** Roll-counting context: which subs count and at what weight. */
export type RollContext = {
  effectiveStats: DiscSubStatKey[]
  weights: Partial<Record<DiscSubStatKey, number>>
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function weightedEffectiveRolls(
  disc: ICachedDisc,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  let total = 0
  for (const sub of disc.substats) {
    if (!sub.key || !sub.upgrades) continue
    const key = sub.key as DiscSubStatKey
    if (!effectiveStats.includes(key)) continue
    total += sub.upgrades * (weights[key] ?? 1)
  }
  return total
}

/**
 * Score each local disc against the perfect slot disc, gated by damage.
 *
 * Two lenses, lower governs:
 * - roll lens: weighted premium rolls on your disc / weighted premium rolls
 *   on the theoretical-best disc in the same slot. One premium roll short
 *   is strictly below 1 — roll counting with the perfect disc (not an
 *   abstract ceiling) as the denominator.
 * - damage lens: value(theoBest with your disc plugged in) / theoBest.
 *   Guards what roll counting cannot see: a wrong main stat or a set that
 *   breaks the perfect setup.
 *
 * In the common case (right main/set) the roll lens governs; on mismatch
 * the damage lens governs. Discs whose neither lens evaluates keep the
 * build-ratio score as a fallback.
 */
export async function computeDynamicScoresWithReplacement(
  sortedLocalBuilds: ReplacementScoredBuild[],
  theoBestValue: number,
  theoBestDiscs: Record<DiscSlotKey, ICachedDisc | undefined> | undefined,
  theoWengineKey: string | undefined,
  getDisc: (discId: string) => ICachedDisc | undefined,
  evaluate: ReplacementEvaluator,
  rollContext?: RollContext,
  options?: ReplacementOptions
): Promise<{
  entries: Record<string, DynamicScoreEntry>
  localBest: number
  ratio: number
  completed: boolean
}> {
  const base = computeDynamicDiscScores(
    sortedLocalBuilds,
    theoBestValue,
    (id) => getDisc(id)?.slotKey
  )
  const { entries, localBest, ratio } = base
  if (!theoBestDiscs || !(theoBestValue > 0))
    return { ...base, completed: true }

  const isCancelled = options?.isCancelled
  const yieldEvery = options?.yieldEvery ?? 10
  let evals = 0
  const safeEval = (
    discs: Record<DiscSlotKey, ICachedDisc | undefined>,
    wengineKey?: string
  ): number | undefined => {
    try {
      const v = evaluate(discs, wengineKey)
      return typeof v === 'number' && Number.isFinite(v) ? v : undefined
    } catch {
      return undefined
    }
  }

  // Perfect-slot denominators for the roll lens.
  const perfectRollsBySlot = new Map<DiscSlotKey, number>()
  if (rollContext) {
    for (const [slot, disc] of Object.entries(theoBestDiscs)) {
      if (!disc) continue
      const denom = weightedEffectiveRolls(
        disc,
        rollContext.effectiveStats,
        rollContext.weights
      )
      if (denom > 0) perfectRollsBySlot.set(slot as DiscSlotKey, denom)
    }
  }

  for (const [discId, entry] of Object.entries(entries)) {
    if (isCancelled?.()) return { entries, localBest, ratio, completed: false }
    const disc = getDisc(discId)
    if (!disc) continue
    const candidates: number[] = []
    let rollRatio: number | undefined
    if (rollContext) {
      const denom = perfectRollsBySlot.get(entry.slot)
      if (denom !== undefined && denom > 0) {
        rollRatio = clamp01(
          weightedEffectiveRolls(
            disc,
            rollContext.effectiveStats,
            rollContext.weights
          ) / denom
        )
        candidates.push(rollRatio)
      }
    }
    const variant = { ...theoBestDiscs, [entry.slot]: disc }
    const plugValue = safeEval(variant, theoWengineKey)
    evals += 1
    if (evals % yieldEvery === 0)
      await new Promise<void>((r) => setTimeout(r, 0))
    if (plugValue !== undefined)
      candidates.push(clamp01(plugValue / theoBestValue))
    if (candidates.length === 0) continue
    entries[discId] = {
      ...entry,
      score: Math.min(...candidates),
      ...(plugValue !== undefined ? { plugValue } : {}),
      ...(rollRatio !== undefined ? { rollRatio } : {}),
    }
  }
  return { entries, localBest, ratio, completed: true }
}
