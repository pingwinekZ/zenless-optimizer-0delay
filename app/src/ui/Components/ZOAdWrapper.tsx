import type { AdDims, AdProps } from '@zenless-optimizer/common/ad'
import { getGOAd, getGODrakeAd } from '@zenless-optimizer/common/ad'
import { CardThemed } from '@zenless-optimizer/common/ui'
import {
  getRandomElementFromArray,
  notEmpty,
} from '@zenless-optimizer/common/util'
import type { FunctionComponent, ReactNode } from 'react'
import { useMemo } from 'react'
/**
 * A component that aggregates all ads shown on ZO
 */
export function ZOAdWrapper({ style = {}, bgt = 'light', children }: AdProps) {
  const maxHeight: number | undefined =
    (style as any)?.['maxHeight'] || (style as any)?.['height']
  const maxWidth: number | undefined =
    (style as any)?.['maxWidth'] || (style as any)?.['width']
  const Comp = useMemo(
    () =>
      getRandomElementFromArray(
        getAdComponents({ width: maxWidth, height: maxHeight })
      ),
    [maxHeight, maxWidth]
  )
  if (!Comp) return null
  return (
    <CardThemed
      bgt={bgt}
      className="zo-ad-wrapper"
      style={{ margin: 'auto', ...style }}
    >
      <Comp>{children}</Comp>
    </CardThemed>
  )
}

function getAdComponents(
  dims: AdDims
): Array<FunctionComponent<{ children: ReactNode }>> {
  return [
    getGOAd,
    // getGODevAd,
    getGODrakeAd,
  ]
    .map((c) => c(dims))
    .filter(notEmpty)
}
