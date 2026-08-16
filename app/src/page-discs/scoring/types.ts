import type { IDisc } from '../../zood'

export type ScoredDisc = {
  id: string
  disc: IDisc
  scoreCurrent: number
  scoreMaxPotential: number
}
