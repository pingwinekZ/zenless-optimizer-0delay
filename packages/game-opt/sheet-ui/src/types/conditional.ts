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
}
