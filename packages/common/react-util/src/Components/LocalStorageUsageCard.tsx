import {
  ActionIcon,
  Alert,
  Box,
  Divider,
  Flex,
  Group,
  RingProgress,
  Table,
  Text,
} from '@mantine/core'
import { IconDatabase, IconRefresh } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { objMap } from '@zenless-optimizer/common/util'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_LOCAL_STORAGE_MB = 5
const COLORS = {
  activeZo: '#ff2255',
  zoDb1: '#aa55ff',
  zoDb2: '#aaff55',
  zoDb3: '#2255aa',
  zoDb4: '#22aa55',
  other: '#868e96',
} as const
type Category = keyof typeof COLORS
const DISPLAY_PERCENT_THRESH = 1
const WARNING_PERCENT_THRESH = 75
const ERROR_PERCENT_THRESH = 90

function scanStorage(): {
  totalBytes: number
  bytesByCategory: Record<Category, number>
} {
  let totalBytes = 0
  const bytesByCategory: Record<Category, number> = {
    activeZo: 0,
    zoDb1: 0,
    zoDb2: 0,
    zoDb3: 0,
    zoDb4: 0,
    other: 0,
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    // localStorage counts in UTF-16 code units (2 bytes per char)
    const value = localStorage.getItem(key)
    const size = (key.length + (value?.length ?? 0)) * 2
    totalBytes += size

    if (key.startsWith('zzz_extraDatabase')) {
      switch (key[key.length - 1]) {
        case '1':
          bytesByCategory.zoDb1 += size
          continue
        case '2':
          bytesByCategory.zoDb2 += size
          continue
        case '3':
          bytesByCategory.zoDb3 += size
          continue
        case '4':
          bytesByCategory.zoDb4 += size
          continue
      }
    } else if (key.startsWith('zzz_')) {
      bytesByCategory.activeZo += size
      continue
    }
    bytesByCategory.other += size
  }
  return { totalBytes, bytesByCategory }
}

export function LocalStorageUsageCard() {
  const { t } = useTranslation('common')
  const [refreshCount, setRefreshCount] = useState(0)
  // Re-scan when another tab writes to storage (`storage` events do not
  // fire in the tab that made the change, hence the manual refresh button).
  useEffect(() => {
    const onStorage = () => setRefreshCount((c) => c + 1)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const { totalBytes, bytesByCategory } = useMemo(() => {
    // Dependency doubles as the re-scan trigger (refresh button / other tabs)
    void refreshCount
    return scanStorage()
  }, [refreshCount])
  const MBByCategory = objMap(bytesByCategory, (v) => v / 1024 / 1024)
  const percentByCategory = objMap(
    MBByCategory,
    (v) => (v / MAX_LOCAL_STORAGE_MB) * 100
  )

  const totalMB = totalBytes / 1024 / 1024
  const percent = (totalMB / MAX_LOCAL_STORAGE_MB) * 100
  const sections = Object.entries(percentByCategory)
    .sort((a, b) => b[1] - a[1])
    .filter(([, p]) => p > DISPLAY_PERCENT_THRESH)
    .map(([key, p]) => ({
      value: p,
      color: COLORS[key as Category],
      tooltip: `${t(`storage.${key}`)} - ${p.toFixed(2)}%`,
    }))
  const severity =
    percent > ERROR_PERCENT_THRESH
      ? 'red'
      : percent > WARNING_PERCENT_THRESH
        ? 'yellow'
        : undefined

  return (
    <CardThemed bgt="light">
      <Box p="md" style={{ paddingBottom: 0 }}>
        <Group gap="xs" justify="space-between">
          <Group gap="xs">
            <IconDatabase size={24} />
            <Text fw={700}>{t('storage.title')}</Text>
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={() => setRefreshCount((c) => c + 1)}
            title={t('storage.refresh')}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Box>
      <Divider mt="sm" />
      <Box p="md">
        <Flex gap="md" wrap="wrap" justify="center" align="flex-start">
          {severity && (
            <Alert color={severity} style={{ width: '100%' }}>
              {t('storage.warning')}
            </Alert>
          )}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              flexBasis: 250,
              flexGrow: 1,
              gap: 8,
            }}
          >
            <Text size="sm" c="dimmed" style={{ width: '100%' }}>
              {t('storage.info')}
            </Text>
            <RingProgress
              size={140}
              thickness={14}
              roundCaps
              sections={sections}
              label={
                <Text ta="center">
                  <Text fw={700} {...(severity ? { c: severity } : {})}>
                    {totalMB.toFixed(2)}MB
                  </Text>
                  <Text size="xs" c="dimmed">
                    / {MAX_LOCAL_STORAGE_MB}MB ({percent.toFixed(1)}%)
                  </Text>
                </Text>
              }
            />
          </Box>
          <Box style={{ minWidth: 0 }}>
            <Table style={{ width: 'max-content', maxWidth: '100%' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('storage.category')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    {t('storage.size')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(MBByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, megabytes]) => (
                    <Table.Tr
                      key={key}
                      style={{
                        opacity:
                          percentByCategory[key as Category] >
                          DISPLAY_PERCENT_THRESH
                            ? undefined
                            : 0.5,
                      }}
                    >
                      <Table.Td>
                        <Group gap={8} wrap="nowrap">
                          <Box
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              flexShrink: 0,
                              backgroundColor:
                                percentByCategory[key as Category] >
                                DISPLAY_PERCENT_THRESH
                                  ? COLORS[key as Category]
                                  : undefined,
                              border: '1px solid var(--border-subtle)',
                            }}
                          />
                          <Text size="sm">{t(`storage.${key}`)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="sm">
                          {megabytes.toFixed(2)}MB (
                          {percentByCategory[key as Category].toFixed(2)}%)
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Flex>
      </Box>
    </CardThemed>
  )
}
