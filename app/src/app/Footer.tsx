import { Flex, Skeleton, Text } from '@mantine/core'
import { Suspense } from 'react'
import { Trans, useTranslation } from 'react-i18next'

declare const __VERSION__: string

export default function Footer() {
  return (
    <Suspense fallback={<Skeleton h={64} />}>
      <FooterContent />
    </Suspense>
  )
}

function FooterContent() {
  const { t } = useTranslation('ui')
  return (
    <Flex
      component="footer"
      bg="dark.8"
      justify="space-between"
      px="md"
      py={4}
      gap="md"
    >
      <Text size="xs" c="dark.2">
        <Trans t={t} i18nKey="ui:rightsDisclaimer">
          Zenless Optimizer is not affiliated with or endorsed by HoYoverse.
        </Trans>
      </Text>
      <Text size="xs" c="dark.2" ta="right">
        <Trans t={t} i18nKey="ui:appVersion" values={{ version: __VERSION__ }}>
          Zenless Optimizer Version:
          <a
            href={
              process.env.NX_URL_GITHUB_GO_CURRENT_VERSION ||
              `${process.env.NX_URL_GITHUB_GO}/releases`
            }
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', marginLeft: 2 }}
          >
            {{ version: __VERSION__ } as any}
          </a>
        </Trans>
      </Text>
    </Flex>
  )
}
