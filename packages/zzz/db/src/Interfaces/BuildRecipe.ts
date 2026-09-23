import type {
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'

/**
 * A theoretical disc recipe: main stats per slot, substat roll distribution,
 * and set assignment. Owned by the db layer because reference profiles
 * persist it (`TheoReferenceDataManager.bestRecipe`); the solver materializes
 * it via `generateTheoreticalDiscs`.
 */
export interface BuildRecipe {
  id: string
  mainStats: Record<DiscSlotKey, DiscMainStatKey>
  totalRolls: Partial<Record<DiscSubStatKey, number>>
  appearances: Partial<Record<DiscSubStatKey, number>>
  perDiscSubstats: { key: DiscSubStatKey; upgrades: number }[][]
  set4: DiscSetKey
  set2: DiscSetKey
}
