import {
  Anchor,
  Box,
  CardSection,
  Group,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { ZCard } from '../ui'
import failchon from './teamIcons/failchon.png'
import frzyc from './teamIcons/frzyc.png'
import lantua from './teamIcons/lantua.png'
import lunik from './teamIcons/lunik.png'
import van from './teamIcons/van.webp'

const team = [
  {
    name: 'frzyc',
    img: frzyc,
    title: (t: TFunction) => t('teamCard.jobTitle.leadDev'),
    subtitle: 'Chief Corner Cutter',
    url: process.env['NX_URL_GITHUB_FRZYC'],
  },
  {
    name: 'Van',
    img: van,
    title: (t: TFunction) => t('teamCard.jobTitle.dev'),
    subtitle: 'Pando Cultivator',
    url: process.env['NX_URL_GITHUB_VAN'],
  },
  {
    name: 'Lantua',
    img: lantua,
    title: (t: TFunction) => t('teamCard.jobTitle.dev'),
    subtitle: 'Pando Arboreal Architect',
    url: process.env['NX_URL_GITHUB_LANTUA'],
  },
  {
    name: 'Failchon',
    img: failchon,
    title: (t: TFunction) => t('teamCard.jobTitle.dev'),
    subtitle: 'TODO Deletist',
    url: '',
  },
  {
    name: 'Lunik',
    img: lunik,
    title: (t: TFunction) => t('teamCard.jobTitle.designer'),
    subtitle: 'Figma Finger Painter',
    url: '',
  },
] as const

export default function TeamCard() {
  const { t } = useTranslation(['page_home', 'ui'])
  return (
    <ZCard>
      <CardSection>
        <Group>
          <IconUsers />
          <Title order={5}>{t('teamCard.title')}</Title>
        </Group>
      </CardSection>
      <CardSection style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={1}>
          {team.map(({ name, img, title, subtitle, url = '' }) => (
            <CardThemed key={name} bgt="light" style={{ height: '100%' }}>
              <CardSection>
                <Box
                  component="img"
                  src={img}
                  style={{ width: '100%', height: 'auto', borderRadius: '50%' }}
                />
                <Box style={{ display: 'flex', flexDirection: 'column' }}>
                  {url ? (
                    <Anchor href={url} target="_blank" rel="noopener">
                      <strong>{name}</strong>
                    </Anchor>
                  ) : (
                    <Text style={{ textAlign: 'center' }}>
                      <strong>{name}</strong>
                    </Text>
                  )}
                  <Text style={{ textAlign: 'center' }}>{title(t)}</Text>
                  <Text style={{ textAlign: 'center' }}>{subtitle}</Text>
                </Box>
              </CardSection>
            </CardThemed>
          ))}
        </SimpleGrid>
        <CardThemed bgt="light">
          <CardSection>
            <Text>
              Thanks to{' '}
              <Anchor
                href="https://zzz.hakush.in/"
                target="_blank"
                rel="noreferrer"
              >
                hakushin.in
              </Anchor>{' '}
              for providing the API data.
            </Text>
            <Text>
              Thanks to{' '}
              <Anchor
                href="https://enka.network/?zzz"
                target="_blank"
                rel="noreferrer"
              >
                enka.network
              </Anchor>{' '}
              for supplying the SVGs for stats.
            </Text>
            <Text>
              A huge thank you to our community for using Zenless Optimizer and
              supporting the project!
            </Text>
          </CardSection>
        </CardThemed>
      </CardSection>
    </ZCard>
  )
}
