import { Anchor, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import type { AdDims } from '../type'
import { DISCORD_LINK } from '../urlUtil'

function GODevAd({ children }: { children: ReactNode }) {
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
        minHeight: '100%',
        minWidth: '100%',
      }}
    >
      {children}
      <Title order={4} c="crimson">
        WE NEED HELP!
      </Title>
      <Text>
        Are you a web developer who is looking to contribute to the most
        over-engineered Genshin website ever made? Can you distinguish which one
        of the following is a pokemon?
      </Text>
      <Text c="coral" style={{ fontFamily: 'monospace' }}>
        React MaterialUI nx ekans GraphQL git metapod NextJS discord.js vite
        nodeJS emotion prisma Agumon tesseract.js typescript bun sawk webpack
        next-auth jest
      </Text>
      <Text>
        If you have knowledge in some(or any) of those technologies mentioned
        above, or are hoping to learn in an actively-developed app with
        thousands of users, please join our Discord! We'd love to work with you.
      </Text>
    </Anchor>
  )
}
export function getGODevAd(dims: AdDims) {
  if ((dims.height ?? 120) >= 120) return GODevAd
  return
}
