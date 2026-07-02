import { Anchor, Box } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { isZOURL, ZO_LINK } from '../urlUtil'
import zo_banner_chat from './zo_banner_chat.png'

function ZOBannerAd({ children }: { children: ReactNode }) {
  return (
    <Anchor
      href={ZO_LINK}
      target="_blank"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        minWidth: '100%',
        height: '100%',
        gap: '8px',
      }}
    >
      {children}
      <Box
        component="img"
        src={zo_banner_chat}
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
export function getZOBannerAd(dims: AdDims) {
  if (isZOURL()) return
  if ((dims.height ?? 120) <= 120) return ZOBannerAd
  return
}
