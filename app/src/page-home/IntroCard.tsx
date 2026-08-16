import { Anchor, CardSection, Text, Title } from '@mantine/core'
import { Trans, useTranslation } from 'react-i18next'
import { ZCard } from '../ui'
export function IntroCard() {
  const { t } = useTranslation('page_home')
  return (
    <ZCard p="lg">
      <CardSection style={{ textAlign: 'center' }}>
        <Title order={2}>Zenless Optimizer</Title>
        <Text size="md" c="dimmed">
          {/* TODO: translation, will likely change as project evolve more */}
          <Trans t={t} i18nKey="intro_TODO">
            Your <strong>ultimate</strong>{' '}
            <Anchor
              href="https://zenless.hoyoverse.com/"
              target="_blank"
              rel="noreferrer"
            >
              <i>Zenless Zone Zero</i>
            </Anchor>{' '}
            calculator! ZO will craft the best build, with what you have.
          </Trans>
        </Text>
      </CardSection>
    </ZCard>
  )
}
