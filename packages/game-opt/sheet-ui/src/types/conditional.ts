import type {
  Calculator,
  IConditionalData,
} from '@zenless-optimizer/game-opt/engine'
import type { ReactNode } from 'react'
import type { Field } from './field'
import type { Header } from './header'

export type Conditional = {
  metadata: IConditionalData
  label: ReactNode | ((calc: Calculator, value: number) => ReactNode)
  description?: ReactNode | ((calc: Calculator, value: number) => ReactNode)
  badge?: ReactNode | ((calc: Calculator, value: number) => ReactNode)
  header?: Header
  fields?: Field[]
  targeted?: boolean
  /**
   * Explicit display section for this conditional in the optimizer's conditionals
   * list. Only needed when a conditional lives in the merged `core` sheet section
   * but belongs to a different category (e.g. an Additional Ability toggle that
   * has no `ability_`-prefixed field, so the field-name heuristic can't classify
   * it). Overrides the default core/ability classification.
   */
  section?: 'core' | 'ability'
  /** When set, toggling this conditional also toggles the linked conditional(s) */
  linked?: string | string[]
  /**
   * For num conditionals: maps a mindscape threshold to the conditional's max
   * value (e.g. `{ 2: 2, 6: 4 }`). Mindscapes below the lowest threshold clamp
   * the max to the conditional's base min.
   */
  maxByMindscape?: Record<number, number>
  /** When true, fields are not dimmed when the conditional value is 0 (e.g. a passive base effect still applies) */
  noDimWhenZero?: boolean
  /** Show this conditional in the teammate view even when it has no fields (e.g. a self-state toggle gating team-wide effects) */
  showInTeammateView?: boolean
}
