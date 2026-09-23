import { Alert, Anchor, Flex, SimpleGrid, Title } from '@mantine/core'
import { IconMessageReport } from '@tabler/icons-react'
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

export default function PageHome() {
  return (
    <Flex direction="column" gap="md" maw={1400} w="100%" mx="auto">
      <IntroCard />
      <FeedbackBanner />
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" verticalSpacing="md">
        <Flex direction="column" gap="md" style={{ gridColumn: 'span 2' }}>
          <Roadmap />
        </Flex>
        <Flex direction="column" gap="md">
          <QuickLinksCard />
          <TeamCard />
        </Flex>
      </SimpleGrid>
    </Flex>
  )
}
