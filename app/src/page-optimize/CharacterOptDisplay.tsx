import { OptTargetTagRowSxProvider } from '@zenless-optimizer/zzz/formula-ui'
import { StatHighlightContext } from '@zenless-optimizer/zzz/ui'
import { useMemo, useState } from 'react'
import Optimize from './Optimize'

export function CharacterOptDisplay() {
  const [statHighlight, setStatHighlight] = useState('')
  const statHLContextObj = useMemo(
    () => ({ statHighlight, setStatHighlight }),
    [statHighlight, setStatHighlight]
  )

  return (
    <StatHighlightContext.Provider value={statHLContextObj}>
      <OptTargetTagRowSxProvider>
        <Optimize />
      </OptTargetTagRowSxProvider>
    </StatHighlightContext.Provider>
  )
}
