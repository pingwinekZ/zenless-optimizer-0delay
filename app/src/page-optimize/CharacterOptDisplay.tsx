import { useMemo, useState } from 'react'
import { OptTargetTagRowSxProvider } from '../formula-ui'
import { StatHighlightContext } from '../ui'
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
