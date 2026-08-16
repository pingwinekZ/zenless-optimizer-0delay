import { useBoolState } from '@zenless-optimizer/common/react-util'
import type { CardBackgroundColor } from '@zenless-optimizer/common/ui'
import type { CSSProperties, FunctionComponent, MouseEventHandler } from 'react'
import { useContext } from 'react'
import { IsAdBlockedContext } from '../context'
import type { AdProps } from '../type'
import { AdButtons } from './AdButtons'
import { AdSenseUnit } from './AdSenseUnit'

export function AdWrapper({
  dataAdSlot,
  fullWidth = false,
  style,
  onClose,
  bgt = 'light',
  Ad,
}: {
  dataAdSlot: string
  height?: number
  width?: number
  style?: CSSProperties
  fullWidth?: boolean
  onClose?: MouseEventHandler
  bgt?: CardBackgroundColor
  Ad: FunctionComponent<AdProps>
}) {
  const [show, _, onHide] = useBoolState(true)
  const adblockEnabled = useContext(IsAdBlockedContext)
  const hostname = window.location.hostname

  if (hostname === 'frzyc.github.io' && !adblockEnabled)
    return (
      <AdSenseUnit
        dataAdSlot={dataAdSlot}
        style={style}
        fullWidth={fullWidth}
      />
    )
  if (!show) return null
  return (
    <Ad style={style} bgt={bgt}>
      <AdButtons
        onClose={
          onClose ??
          ((e) => {
            e.preventDefault()
            e.stopPropagation()
            onHide()
          })
        }
      />
    </Ad>
  )
}
