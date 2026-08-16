import type { MilestoneKey, PhaseKey, WengineKey } from '../../consts'

export interface ICachedWengine {
  id: string
  key: WengineKey
  level: number
  modification: MilestoneKey
  phase: PhaseKey
}
