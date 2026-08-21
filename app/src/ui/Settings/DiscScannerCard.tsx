import { Box, Button, Divider, SimpleGrid, Text } from '@mantine/core'
import { IconCapture, IconScan } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'

const links = [
  {
    title: 'AdeptiScanner-ZZZ',
    icon: <IconScan />,
    url: 'https://nightly.link/pingwinekZ/AdeptiScanner-ZZZ/actions/runs/31162349083/AdeptiScanner_ZZZ.fe613a4.zip',
  },
  {
    title: 'zzz_packet_capture',
    icon: <IconCapture />,
    url: 'https://github.com/pingwinekZ/zzz_packet_capture_0delay/releases/latest',
  },
] as const

export function DiscScannerCard() {
  const { t } = useTranslation('page_settings')

  return (
    <CardThemed bgt="light">
      <Box p="md" style={{ paddingBottom: 0 }}>
        <Text fw={700}>{t('discScannerCard.title')}</Text>
      </Box>
      <Divider />
      <Box p="md" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Text size="sm" c="dimmed">
          {t('discScannerCard.description')}
        </Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          {links.map(({ title, icon, url }) => (
            <Button
              key={url}
              color="blue"
              leftSection={icon}
              component="a"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {title}
            </Button>
          ))}
        </SimpleGrid>
      </Box>
    </CardThemed>
  )
}
