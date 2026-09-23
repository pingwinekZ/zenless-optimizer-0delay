import type { DiscSubStatKey } from '@zenless-optimizer/zzz/consts'
import { calculateDiscScore } from '@zenless-optimizer/zzz/util'
import type { IDisc } from '@zenless-optimizer/zzz/zood'

export function computeCurrentScore(
  disc: IDisc,
  effectiveStats: DiscSubStatKey[],
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
): number {
  const { efficiency } = calculateDiscScore(
    disc,
    effectiveStats,
    substatWeights
  )
  return efficiency
}
