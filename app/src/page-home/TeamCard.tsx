import { Anchor, CardSection, Group, Text, Title } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { ZCard } from '../ui'

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
        <CardThemed bgt="light">
          <CardSection>
            <Text>
              Thanks to the{' '}
              <Anchor
                href="https://github.com/frzyc/genshin-optimizer"
                target="_blank"
                rel="noreferrer"
              >
                original genshin-optimizer repo
              </Anchor>{' '}
              and{' '}
              <Anchor
                href="https://github.com/fribbels/hsr-optimizer"
                target="_blank"
                rel="noreferrer"
              >
                fribbels-hsr-optimizer
              </Anchor>{' '}
              for the foundation this project was built on.
            </Text>
            <Text>
              Thanks to{' '}
              <Anchor
                href="https://nanoka.cc/"
                target="_blank"
                rel="noreferrer"
              >
                nanoka.cc
              </Anchor>{' '}
              and{' '}
              <Anchor
                href="https://leifa.carrd.co/"
                target="_blank"
                rel="noreferrer"
              >
                Leifa
              </Anchor>{' '}
              for the asset hosting and datamine data.
            </Text>
          </CardSection>
        </CardThemed>
      </CardSection>
    </ZCard>
  )
}
