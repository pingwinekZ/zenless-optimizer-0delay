import { Anchor, Box } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { GO_LINK, isGOURL } from '../urlUtil'
import drake from './drake.png'

function GODrakeAd({ children }: { children: ReactNode }) {
  return (
    <Anchor
      href={GO_LINK}
      target="_blank"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        maxWidth: '100%',
        maxHeight: '100%',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
      <Box
        component="img"
        src={drake}
        style={{
          objectFit: 'contain',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
        }}
      />
    </Anchor>
  )
}
export function getGODrakeAd(dim: AdDims) {
  if (isGOURL()) return
  if ((dim.height ?? 120) < 120) return
  if ((dim.width ?? 300) < 300) return
  return GODrakeAd
}
