import {
  Alert,
  Anchor,
  CardSection,
  Flex,
  Group,
  SimpleGrid,
  Title,
} from '@mantine/core'
import { IconFileDescription, IconMessageReport } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ZCard } from '../ui'
import { IntroCard } from './IntroCard'
import QuickLinksCard from './QuickLinksCard'
import { Roadmap } from './Roadmap'
import TeamCard from './TeamCard'

const ISSUES_URL =
  'https://github.com/pingwinekZ/zenless-optimizer-0delay/issues'

function FeedbackBanner() {
  return (
    <Anchor
      href={ISSUES_URL}
      target="_blank"
      rel="noreferrer"
      underline="never"
    >
      <Alert icon={<IconMessageReport />} color="yellow">
        <Title order={5}>Please report ANY issues/suggestions here</Title>
      </Alert>
    </Anchor>
  )
}

declare const __VERSION__: string
export default function PageHome() {
  return (
    <Flex direction="column" gap="md" maw={1400} w="100%" mx="auto">
      <IntroCard />
      <FeedbackBanner />
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" verticalSpacing="md">
        <Flex direction="column" gap="md" style={{ gridColumn: 'span 2' }}>
          <Roadmap />
          <ZCard>
            <PatchNotesCard />
          </ZCard>
        </Flex>
        <Flex direction="column" gap="md">
          <QuickLinksCard />
          <TeamCard />
        </Flex>
      </SimpleGrid>
    </Flex>
  )
}

function PatchNotesCard() {
  const { t } = useTranslation('page_home')
  const [{ isLoaded, text }, setState] = useState({ isLoaded: false, text: '' })
  useEffect(() => {
    const regex = /^(\d+)\.(\d+)\.(\d+)$/
    const minorVersion = __VERSION__.replace(regex, `$1.$2.${0}`)
    fetch(process.env['NX_URL_GITHUB_API_GO_RELEASES'] + minorVersion)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decoder = new TextDecoder('utf-8')
        const data = decoder.decode(buffer)
        const release = JSON.parse(data)
        setState({ isLoaded: true, text: release.body })
      })
      .catch((err) => console.log('Error: ' + err.message))
  }, [])

  return (
    <CardThemed>
      <Group p="md" style={{ paddingBottom: 0 }}>
        <IconFileDescription />
        <Title order={5}>{t('quickLinksCard.buttons.patchNotes.title')}</Title>
      </Group>
      <CardSection>
        {isLoaded ? (
          <ReactMarkdown children={text} remarkPlugins={[remarkGfm]} />
        ) : (
          'Loading...'
        )}
      </CardSection>
    </CardThemed>
  )
}
