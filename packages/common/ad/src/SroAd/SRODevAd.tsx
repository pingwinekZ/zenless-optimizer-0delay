import { Anchor, Box, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { DISCORD_LINK } from '../urlUtil'
import sro from './sro.png'
export function SRODevAd({ children }: { children: ReactNode }) {
  return (
    <Anchor
      href={DISCORD_LINK}
      target="_blank"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '10px',
        cursor: 'pointer',
        gap: '8px',
        minHeight: '100%',
        minWidth: '100%',
      }}
    >
      {children}
      <Title order={4} c="crimson">
        DO YOU WANT A STAR RAIL OPTIMIZER?
      </Title>
      <Box component="img" src={sro} style={{ maxWidth: 100 }} />

      <Text>
        Exciting News! We're currently developing the Star Rail Optimizer, and
        we're on the lookout for talented web developers to join our team. If
        you're passionate about shaping the future of rail optimization, come be
        a part of our journey!
      </Text>
    </Anchor>
  )
}
export function getSRODevAd(dims: AdDims) {
  if ((dims.height ?? 120) < 120) return false
  return true
}
