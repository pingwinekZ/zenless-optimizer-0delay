import type { CalcMeta, Tag } from '@zenless-optimizer/game-opt/engine'
import type { CalcResult } from '@zenless-optimizer/pando/engine'
import { createContext } from 'react'
import type { FormulaText } from '../types'

export type FormulaTextFunc = (
  _data: CalcResult<number, CalcMeta<Tag, string>>,
  _cache: Map<CalcResult<number, CalcMeta<Tag, string>>, FormulaText>
) => FormulaText

export const FormulaTextContext = createContext<FormulaTextFunc>(() => ({
  name: undefined,
  formula: undefined,
  sheet: undefined,
  prec: 0,
  deps: [],
}))
