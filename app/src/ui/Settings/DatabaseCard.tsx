import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  SimpleGrid,
  Text,
} from '@mantine/core'
import {
  IconClipboard,
  IconDownload,
  IconFileImport,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import {
  useDataEntryBase,
  useDataManagerKeys,
} from '@zenless-optimizer/common/database-ui'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  ModalWrapper,
  TextFieldLazy,
} from '@zenless-optimizer/common/ui'
import { range } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDatabaseContext } from '../../db-ui'
import { UploadCard } from './UploadCard'

export function DatabaseCard() {
  const { t } = useTranslation('page_settings')

  return (
    <CardThemed bgt="light">
      <Box p="md" style={{ paddingBottom: 0 }}>
        <Text fw={700}>{t('DatabaseCard.title')}</Text>
      </Box>
      <Divider />
      <Box p="md" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          {range(0, 3).map((i) => (
            <Box key={i}>
              <DataCard index={i} />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </CardThemed>
  )
}

function DataCard({ index }: { index: number }) {
  const { databases, database: mainDB, setDatabase } = useDatabaseContext()
  const database = databases[index]
  const { name, lastEdit } = useDataEntryBase(database.dbMeta)

  const current = mainDB === database
  const [uploadOpen, onOpen, onClose] = useBoolState()
  const { t } = useTranslation('page_settings')
  const numChar = useDataManagerKeys(database.chars).length
  const numDiscs = useDataManagerKeys(database.discs).length
  const numWengines = useDataManagerKeys(database.wengines).length
  const hasData = Boolean(numChar || numDiscs || numWengines)
  const copyToClipboard = useCallback(
    () =>
      navigator.clipboard
        .writeText(JSON.stringify(database.exportZOOD()))
        .then(() => alert('Copied database to clipboard.'))
        .catch(console.error),
    [database]
  )

  const onDelete = useCallback(() => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    database.clear()
    database.toExtraLocalDB()
  }, [database, name])

  const download = useCallback(() => {
    const date = new Date()
    const dateStr = date
      .toISOString()
      .split('.')[0]
      .replace('T', '_')
      .replaceAll(':', '-')
    const JSONStr = JSON.stringify(database.exportZOOD())
    const filename = `${name.trim().replaceAll(' ', '_')}_${dateStr}.json`
    const contentType = 'application/json;charset=utf-8'
    const a = document.createElement('a')
    a.download = filename
    a.href = `data:${contentType},${encodeURIComponent(JSONStr)}`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [database, name])

  const onSwap = useCallback(() => {
    if (current) return
    mainDB.toExtraLocalDB()
    database.swapStorage(mainDB)
    setDatabase(index, database)
  }, [index, setDatabase, mainDB, current, database])

  return (
    <CardThemed
      style={{
        height: '100%',
        boxShadow: current ? '0px 0px 0px 2px green inset' : undefined,
      }}
    >
      <Box
        p="md"
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextFieldLazy
          size="sm"
          value={name}
          style={{ borderRadius: 4, padding: '0 4px', flexGrow: 1 }}
          onChange={(name) => {
            database.dbMeta.set({ name })
            database.toExtraLocalDB()
          }}
        />
        {!current && (
          <Button
            leftSection={<IconFileImport />}
            onClick={onSwap}
            color="orange"
          >
            {t('DatabaseCard.button.swap')}
          </Button>
        )}
        <Badge
          color={current ? 'green' : 'gray'}
          style={{ alignSelf: 'center' }}
        >
          {current
            ? t('DatabaseCard.currentDB')
            : `${t('DatabaseCard.title')} ${database.dbIndex}`}
        </Badge>
      </Box>
      <Divider />
      <Box p="md">
        <Group gap="md" align="flex-start">
          <Box style={{ flexGrow: 1 }}>
            <Text>
              <Trans t={t} i18nKey="count.chars" /> <strong>{numChar}</strong>
            </Text>
            <Text>
              <Trans t={t} i18nKey="count.discs" /> <strong>{numDiscs}</strong>
            </Text>
            <Text>
              <Trans t={t} i18nKey="count.wengines" />{' '}
              <strong>{numWengines}</strong>
            </Text>
          </Box>
          <Box>
            <SimpleGrid cols={2} spacing="xs">
              <Button
                disabled={!hasData}
                color="cyan"
                onClick={copyToClipboard}
                leftSection={<IconClipboard />}
                size="sm"
              >
                <Trans t={t} i18nKey="DatabaseCard.button.copy" />
              </Button>
              <ModalWrapper
                opened={uploadOpen}
                onClose={onClose}
                containerProps={{ style: { minHeight: 'auto' } }}
              >
                <UploadCard index={index} onReplace={onClose} />
              </ModalWrapper>
              <Button
                color="cyan"
                leftSection={<IconUpload />}
                onClick={onOpen}
                size="sm"
              >
                {t('DatabaseCard.button.upload')}
              </Button>
              <Button
                disabled={!hasData}
                onClick={download}
                leftSection={<IconDownload />}
                size="sm"
              >
                {t('DatabaseCard.button.download')}
              </Button>
              <Button
                disabled={!hasData}
                color="red"
                onClick={onDelete}
                leftSection={<IconTrash />}
                size="sm"
              >
                {t('DatabaseCard.button.delete')}
              </Button>
            </SimpleGrid>
            {!!lastEdit && (
              <Text ta="center" pt="xl">
                <strong>{new Date(lastEdit).toLocaleString()}</strong>
              </Text>
            )}
          </Box>
        </Group>
      </Box>
    </CardThemed>
  )
}
