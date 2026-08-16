import type { DiscSubStatKey } from '../../consts'
import { calculateDiscScore } from '../../util'
import type { IDisc } from '../../zood'

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
