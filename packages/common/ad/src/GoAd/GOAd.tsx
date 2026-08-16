import { Anchor, Box, Text } from '@mantine/core'
import { useRefSize } from '@zenless-optimizer/common/ui'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { GO_LINK, isGOURL } from '../urlUtil'
import go from './go.png'

function GOAd({ children }: { children: ReactNode }) {
  const { height, ref } = useRefSize<HTMLAnchorElement>()

  return (
    <Anchor
      ref={ref}
      href={GO_LINK}
      target="_blank"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        cursor: 'pointer',
        minHeight: '100%',
        minWidth: '100%',
        height: '100%',
        flexDirection: height > 90 ? 'column' : 'row',
        gap: '8px',
      }}
    >
      {children}
      <Box
        component="img"
        src={go}
        height={100}
        style={{ maxHeight: '100%' }}
      />
      <Text>
        The Ultimate Genshin Impact calculator, that allows you to min-max your
        characters according to how you play, using what you have.
      </Text>
    </Anchor>
  )
}
export function getGOAd(_: AdDims) {
  return isGOURL() ? undefined : GOAd
}
