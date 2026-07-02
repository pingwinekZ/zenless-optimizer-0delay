import { Anchor, Box } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { isZOURL, ZO_LINK } from '../urlUtil'
import zo_rect_chat from './zo_rect_chat.png'

function ZORectAd({ children }: { children: ReactNode }) {
  return (
    <Anchor
      href={ZO_LINK}
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
        src={zo_rect_chat}
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
export function getZORectAd(dim: AdDims) {
  if (isZOURL()) return
  if ((dim.height ?? 120) < 120) return
  if ((dim.width ?? 300) < 300) return
  return ZORectAd
}
