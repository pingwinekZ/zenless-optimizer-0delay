import type { CardBackgroundColor } from '@zenless-optimizer/common/ui'
import type { CSSProperties, FunctionComponent, ReactNode } from 'react'

export type AdDims = { width?: number; height?: number }
export type AdComponent = FunctionComponent<{ children: ReactNode }>

export type AdProps = {
  style?: CSSProperties
  bgt?: CardBackgroundColor
  children: ReactNode
}
