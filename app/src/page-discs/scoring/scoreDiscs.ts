import type { CharacterKey, DiscSubStatKey } from '../../consts'
import type { ZzzDatabase } from '../../db'
import type { IDisc } from '../../zood'
import { computeCurrentScore } from './currentScore'
import { computeMaxPotential } from './potentialScore'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from './statWeightUtils'
import type { ScoredDisc } from './types'

export function scoreDisc(
  disc: IDisc,
  id: string,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): ScoredDisc {
  const scoreCurrent = computeCurrentScore(disc, effectiveStats, weights)
  const scoreMaxPotential = computeMaxPotential(disc, effectiveStats, weights)
  return {
    id,
    disc,
    scoreCurrent,
    scoreMaxPotential,
  }
}

export function scoreDiscs(
  discs: IDisc[],
  ids: string[],
  focusCharacter: CharacterKey | null,
  database?: ZzzDatabase
): ScoredDisc[] {
  if (discs.length === 0) return []
  const effectiveStats = focusCharacter
    ? getMergedEffectiveStats(focusCharacter, database)
    : []
  const weights = focusCharacter
    ? getMergedSubstatWeights(focusCharacter, database)
    : {}
  return discs.map((disc, i) =>
    scoreDisc(disc, ids[i] ?? '', effectiveStats, weights)
  )
}
