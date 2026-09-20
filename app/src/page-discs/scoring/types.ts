import type { IDisc } from '@zenless-optimizer/zzz/zood'

export type ScoredDisc = {
  id: string
  disc: IDisc
  scoreCurrent: number
  scoreMaxPotential: number
}
