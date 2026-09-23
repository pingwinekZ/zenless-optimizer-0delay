import type { DiscSubStatKey } from '@zenless-optimizer/zzz/consts'
import {
  computeMaxPossibleWeighted,
  getDiscAbsoluteMax,
} from '@zenless-optimizer/zzz/util'
import type { IDisc } from '@zenless-optimizer/zzz/zood'
import {
  materializeBoostedSubstats,
  planPotentialRolls,
} from './potentialDiscs'

function applyRolls(
  disc: IDisc,
  rolls: DiscSubStatKey[],
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  const next = materializeBoostedSubstats(disc, rolls)
  let total = 0
  let weightedEffective = 0
  for (const sub of next) {
    total += sub.upgrades
    if (effectiveStats.includes(sub.key))
      weightedEffective += sub.upgrades * (weights[sub.key] ?? 1)
  }
  if (total === 0) return 0
  const { maxRolls, maxSubstats } = getDiscAbsoluteMax(disc.rarity)
  const maxPossible = computeMaxPossibleWeighted(
    maxRolls,
    maxSubstats,
    effectiveStats,
    weights
  )
  return maxPossible > 0 ? weightedEffective / maxPossible : 0
}

export function computeMaxPotential(
  disc: IDisc,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  const rolls = planPotentialRolls(disc, effectiveStats, weights)
  return applyRolls(disc, rolls, effectiveStats, weights)
}
