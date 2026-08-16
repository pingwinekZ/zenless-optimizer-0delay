import type { Calculator } from '@zenless-optimizer/pando/engine'
import type { ReactNode } from 'react'
import type { Conditional } from './conditional'
import type { Field } from './field'
import type { Header } from './header'

export type Document = TextDocument | FieldsDocument | ConditionalDocument

export interface TextDocument extends BaseDocument {
  type: 'text'
  text: ReactNode | ((calc: Calculator) => ReactNode)
}
export interface FieldsDocument extends BaseDocument {
  type: 'fields'
  fields: Field[]
  /** Override the auto-computed paragraph index used for hover card description lookup */
  paragraph?: number
  /** Override the full locale key for the hover card description (e.g. "special.EXSpecialAttackSymphonyOfTheReaperDaybreak.desc.0") */
  descKey?: string
}
export interface ConditionalDocument extends BaseDocument {
  type: 'conditional'
  conditional: Conditional
}

export interface BaseDocument {
  type: string
  header?: Header
}
