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
}
