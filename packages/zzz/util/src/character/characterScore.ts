import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'
import {
  discMaxLevel,
  discSubstatRollData,
} from '@zenless-optimizer/zzz/consts'
import type { IDisc } from '@zenless-optimizer/zzz/zood'
import {
  getCharacterEffectiveMainStats,
  getCharacterEffectiveStats,
  getCharacterSubstatWeights,
} from './effectiveStats'

export type CharacterScoreResult = {
  totalRolls: number
  effectiveRolls: number
  efficiency: number
  grade: string
  mainStatMatchCount: number
  mainStatTotal: number
}

/**
 * Absolute ceiling for a disc of a given rarity: the best distribution a
 * max-level disc could achieve (e.g. S-rank = 9 total rolls across 4 substats).
 * Scoring normalizes against this so a 3-initial disc (max 8 rolls) can never
 * reach 1.0 / SSS+ Crown.
 */
export function getDiscAbsoluteMax(rarity: DiscRarityKey = 'S'): {
  maxRolls: number
  maxSubstats: number
} {
  const { high } = discSubstatRollData[rarity]
  return {
    maxRolls: high + Math.floor(discMaxLevel[rarity] / 3),
    maxSubstats: 4,
  }
}

/**
 * Compute the maximum possible weighted score for a disc given its total roll
 * count, number of substats, and the character's effective stats + weights.
 *
 * Formula: allocate 1 roll to each of the N best-weight effective stats (where
 * N = disc's substat count), then put all remaining rolls into the single
 * highest-weight stat. This is the best possible distribution a disc of this
 * roll count could achieve.
 */
export function computeMaxPossibleWeighted(
  totalRolls: number,
  numSubstats: number,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  if (totalRolls === 0 || numSubstats === 0 || effectiveStats.length === 0)
    return totalRolls

  const statWeights = effectiveStats.map((key) => weights[key] ?? 1)
  statWeights.sort((a, b) => b - a)

  const topWeights = statWeights.slice(0, numSubstats)
  const highestWeight = topWeights[0] ?? 1
  const remaining = Math.max(0, totalRolls - numSubstats)

  return topWeights.reduce((sum, w) => sum + w, 0) + remaining * highestWeight
}

const GRADE_THRESHOLDS: [number, string][] = [
  [1.0, 'SSS+ Crown'],
  [0.95, 'SSS+'],
  [0.9, 'SSS'],
  [0.8, 'SS+'],
  [0.7, 'SS'],
  [0.6, 'S+'],
  [0.5, 'S'],
  [0.4, 'A'],
  [0.3, 'B'],
]

// Hoyolab-equivalent grade colors (sourced from official Hoyolab client code)
export const GRADE_COLORS: Record<string, string> = {
  'SSS+ Crown': '#FF799F',
  'SSS+': '#FB650A',
  SSS: '#FB650A',
  'SS+': '#FB650A',
  SS: '#FB650A',
  'S+': '#FB650A',
  S: '#FB650A',
  A: '#FB0ACB',
  B: '#0A72FB',
}

export function gradeColor(grade: string): string {
  return GRADE_COLORS[grade] ?? '#0A72FB'
}

/**
 * Display label for a grade. The max tier is styled distinctly (pink) but
 * reads as plain `SSS+` — the `Crown` suffix is internal only, so grading
 * stays `SSS+` in orange below the ceiling and `SSS+` in pink at it.
 */
export function gradeDisplay(grade: string): string {
  return grade === 'SSS+ Crown' ? 'SSS+' : grade
}

export function calculateCharacterScore(
  discs: (IDisc | undefined)[],
  charKey: CharacterKey
): CharacterScoreResult {
  const effectiveStats = getCharacterEffectiveStats(charKey)
  const effectiveMainStats = getCharacterEffectiveMainStats(charKey)
  const substatWeights = getCharacterSubstatWeights(charKey)
  return calculateSubstatEfficiency(
    discs,
    effectiveStats,
    effectiveMainStats,
    substatWeights
  )
}

export function calculateDiscScore(
  disc: IDisc,
  effectiveStats: DiscSubStatKey[],
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
): {
  totalRolls: number
  effectiveRolls: number
  efficiency: number
  grade: string
} {
  let totalRolls = 0
  let effectiveRolls = 0
  let weightedEffectiveRolls = 0

  for (const substat of disc.substats) {
    if (!substat.key || substat.upgrades === 0) continue

    // Raw counts (unweighted, always tracked)
    totalRolls += substat.upgrades
    if (effectiveStats.includes(substat.key as DiscSubStatKey))
      effectiveRolls += substat.upgrades

    // Weighted counts
    if (substatWeights) {
      const weight = substatWeights[substat.key as DiscSubStatKey] ?? 1
      if (effectiveStats.includes(substat.key as DiscSubStatKey))
        weightedEffectiveRolls += substat.upgrades * weight
    }
  }

  const { maxRolls, maxSubstats } = getDiscAbsoluteMax(disc.rarity)

  const efficiency =
    totalRolls > 0
      ? substatWeights && effectiveStats.length > 0
        ? weightedEffectiveRolls /
          computeMaxPossibleWeighted(
            maxRolls,
            maxSubstats,
            effectiveStats,
            substatWeights
          )
        : effectiveRolls / maxRolls
      : 0

  return {
    totalRolls,
    effectiveRolls,
    efficiency,
    grade: efficiencyToGrade(efficiency),
  }
}

export function calculateSubstatEfficiency(
  discs: (IDisc | undefined)[],
  effectiveStats: DiscSubStatKey[],
  effectiveMainStats?: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>,
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
): CharacterScoreResult {
  let totalRolls = 0
  let effectiveRolls = 0
  let weightedEffectiveRolls = 0
  let sumMaxPossible = 0

  for (const disc of discs) {
    if (!disc) continue

    // Per-disc aggregation for absolute-max normalization
    let discRolls = 0

    for (const substat of disc.substats) {
      if (!substat.key || substat.upgrades === 0) continue

      discRolls += substat.upgrades
      totalRolls += substat.upgrades

      if (effectiveStats.includes(substat.key as DiscSubStatKey)) {
        effectiveRolls += substat.upgrades

        if (substatWeights) {
          const weight = substatWeights[substat.key as DiscSubStatKey] ?? 1
          weightedEffectiveRolls += substat.upgrades * weight
        }
      }
    }

    if (substatWeights && discRolls > 0 && effectiveStats.length > 0) {
      const { maxRolls, maxSubstats } = getDiscAbsoluteMax(disc.rarity)
      sumMaxPossible += computeMaxPossibleWeighted(
        maxRolls,
        maxSubstats,
        effectiveStats,
        substatWeights
      )
    }
  }

  const substatEfficiency =
    totalRolls > 0
      ? substatWeights && effectiveStats.length > 0
        ? sumMaxPossible > 0
          ? weightedEffectiveRolls / sumMaxPossible
          : 0
        : effectiveRolls /
          discs.reduce(
            (sum, d) => sum + (d ? getDiscAbsoluteMax(d.rarity).maxRolls : 0),
            0
          )
      : 0

  // Main stat validation for slots 4, 5, 6
  // Slots 1/2/3 have fixed main stats (HP/ATK/DEF) — not evaluated
  let mainStatMatchCount = 0
  let mainStatTotal = 0
  if (effectiveMainStats) {
    for (const disc of discs) {
      if (!disc) continue
      const slot = disc.slotKey as DiscSlotKey
      const validMainStats = effectiveMainStats[slot]
      if (validMainStats) {
        mainStatTotal++
        if (validMainStats.includes(disc.mainStatKey as DiscMainStatKey))
          mainStatMatchCount++
      }
    }
  }

  const mainStatRatio =
    mainStatTotal > 0 ? mainStatMatchCount / mainStatTotal : 0

  // Combined efficiency: 75% substat quality + 25% main stat alignment
  // Falls back to pure substat efficiency when no main stat recs exist
  const efficiency =
    mainStatTotal > 0
      ? totalRolls > 0
        ? substatEfficiency * 0.75 + mainStatRatio * 0.25
        : mainStatRatio * 0.25
      : totalRolls > 0
        ? substatEfficiency
        : 0

  return {
    totalRolls,
    effectiveRolls,
    efficiency,
    grade: efficiencyToGrade(efficiency),
    mainStatMatchCount,
    mainStatTotal,
  }
}

export function efficiencyToGrade(efficiency: number): string {
  for (const [threshold, grade] of GRADE_THRESHOLDS)
    if (efficiency >= threshold) return grade
  return 'B'
}
