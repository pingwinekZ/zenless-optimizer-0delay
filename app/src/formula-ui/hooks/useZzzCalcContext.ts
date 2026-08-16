import { CalcContext, TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { useContext, useMemo } from 'react'
import type { Calculator } from '../../formula'

export function useZzzCalcContext() {
  const _calc = useContext(CalcContext) as Calculator | null
  const tag = useContext(TagContext)

  return useMemo(() => _calc?.withTag(tag), [_calc, tag])
}
