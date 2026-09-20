import type {
  MilestoneKey,
  PhaseKey,
  WengineKey,
} from '@zenless-optimizer/zzz/consts'

export interface ICachedWengine {
  id: string
  key: WengineKey
  level: number
  modification: MilestoneKey
  phase: PhaseKey
}
