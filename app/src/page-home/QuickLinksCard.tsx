import { Button, CardSection, Group, Stack, Title } from '@mantine/core'
import { IconGitFork, IconLink } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { ZCard } from '../ui'

const links = [
  {
    title: () => 'Github',
    icon: <IconGitFork />,
    url: process.env['NX_URL_GITHUB_GO'],
  },
] as const

export default function QuickLinksCard() {
  const { t } = useTranslation(['page_home', 'ui'])
  return (
    <ZCard>
      <CardSection>
        <Group>
          <IconLink />
          <Title order={5}>{t('quickLinksCard.title')}</Title>
        </Group>
      </CardSection>
      <CardSection>
        <Stack gap={1}>
          {links.map(({ title, icon, url }) => (
            <Button
              key={url}
              color="blue"
              fullWidth
              leftSection={icon}
              component="a"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {title()}
            </Button>
          ))}
        </Stack>
      </CardSection>
    </ZCard>
  )
}
