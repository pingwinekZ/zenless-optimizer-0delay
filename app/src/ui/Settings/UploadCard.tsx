import {
  Box,
  Button,
  Divider,
  Group,
  SimpleGrid,
  Text,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconCheckbox,
  IconFile,
  IconFileDescription,
  IconSquare,
  IconUpload,
} from '@tabler/icons-react'
import { SandboxStorage } from '@zenless-optimizer/common/database'
import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { ImportResult, ImportResultCounter } from '../../db'
import { ZzzDatabase } from '../../db'
import { useDatabaseContext } from '../../db-ui'

export function UploadCard({
  index,
  onReplace,
}: {
  index: number
  onReplace: () => void
}) {
  const { databases } = useDatabaseContext()
  const database = databases[index]
  const { t } = useTranslation('page_settings')
  const [data, setData] = useState('')
  const [filename, setFilename] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [keepNotInImport, setKeepNotInImport] = useState(false)
  const [ignoreDups, setIgnoreDups] = useState(false)
  const { importResult, importedDatabase } =
    useMemo(() => {
      if (!data) return undefined
      let parsed: any
      try {
        parsed = JSON.parse(data)
        if (typeof parsed !== 'object') {
          setErrorMsg('uploadCard.error.jsonParse')
          return undefined
        }
      } catch (e) {
        setErrorMsg('uploadCard.error.jsonParse')
        return undefined
      }
      // Figure out the file format
      if (parsed.format === 'ZOOD' || parsed.format === 'ZOD') {
        // Parse as ZOOD format
        const copyStorage = new SandboxStorage(undefined, 'zzz')
        copyStorage.copyFrom(database.storage)
        const importedDatabase = new ZzzDatabase(
          (index + 1) as 1 | 2 | 3 | 4,
          copyStorage
        )
        const importResult = importedDatabase.importZOOD(
          parsed,
          keepNotInImport,
          ignoreDups
        )
        if (!importResult) {
          setErrorMsg('uploadCard.error.sroInvalid')
          return undefined
        }

        return { importResult, importedDatabase }
      }
      setErrorMsg('uploadCard.error.unknown')
      return undefined
    }, [data, database, keepNotInImport, ignoreDups, index]) ?? {}
  const reset = () => {
    setData('')
    setFilename('')
    onReplace()
  }
  const onUpload = async (e: any) => {
    const file = e.target.files[0]
    e.target.value = null // Reset the value so the same file can be uploaded again...
    if (file) setFilename(file.name)
    const reader = new FileReader()
    reader.onload = () => setData(reader.result as string)
    reader.readAsText(file)
  }
  const onDrop = async (e: any) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    e.target.value = null // Reset the value so the same file can be uploaded again...
    if (file) setFilename(file.name)
    const reader = new FileReader()
    reader.onload = () => setData(reader.result as string)
    reader.readAsText(file)
  }

  return (
    <CardThemed
      bgt="light"
      style={{ height: '100%' }}
      {...({ onDragOver: (e: any) => e.preventDefault(), onDrop } as any)}
    >
      <Box p="md" style={{ paddingBottom: 4 }}>
        <Trans t={t} i18nKey="uploadCard.title" />
      </Box>
      <Box p="md">
        <Group mb="sm" gap="sm">
          <label htmlFor="icon-button-file">
            <input
              accept=".json"
              id="icon-button-file"
              type="file"
              onChange={onUpload}
              style={{ display: 'none' }}
            />
            <Button component="span" color="cyan" leftSection={<IconFile />}>
              {t('uploadCard.buttons.open')}
            </Button>
          </label>
          <Box style={{ flexGrow: 1 }}>
            <CardThemed style={{ padding: '4px 8px' }}>
              <Text>
                {filename ? (
                  <span>
                    <IconFileDescription {...iconInlineProps} /> {filename}
                  </span>
                ) : (
                  <span>
                    <IconArrowLeft {...iconInlineProps} />{' '}
                    <Trans t={t} i18nKey="uploadCard.hint" />
                  </span>
                )}
              </Text>
            </CardThemed>
          </Box>
        </Group>
        <Group gap="sm" wrap="wrap">
          <Tooltip
            label={
              ignoreDups
                ? t('uploadCard.tooltip.ignoreDup')
                : t('uploadCard.tooltip.detectdup')
            }
          >
            <Box style={{ flexGrow: 1, flexBasis: '10em' }}>
              <Button
                fullWidth
                disabled={!data}
                color={ignoreDups ? 'blue' : 'green'}
                onClick={() => setIgnoreDups(!ignoreDups)}
                leftSection={ignoreDups ? <IconSquare /> : <IconCheckbox />}
              >
                {t('uploadCard.buttons.detectDups')}
              </Button>
            </Box>
          </Tooltip>
          <Tooltip
            label={
              keepNotInImport
                ? t('uploadCard.tooltip.keepNotInImport')
                : t('uploadCard.tooltip.delNotInImport')
            }
          >
            <Box style={{ flexGrow: 1, flexBasis: '10em' }}>
              <Button
                fullWidth
                disabled={!data}
                color={keepNotInImport ? 'blue' : 'green'}
                onClick={() => setKeepNotInImport(!keepNotInImport)}
                leftSection={
                  keepNotInImport ? <IconSquare /> : <IconCheckbox />
                }
              >
                {t('uploadCard.buttons.delNotInImport')}
              </Button>
            </Box>
          </Tooltip>
        </Group>
        <Text size="xs" mb="xs">
          <Trans t={t} i18nKey="uploadCard.hintPaste" />
        </Text>
        <Box
          component="textarea"
          style={{
            width: '100%',
            fontFamily: 'monospace',
            minHeight: '10em',
            marginBottom: 8,
            resize: 'vertical',
          }}
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        {importResult && importedDatabase ? (
          <ZOODUploadInfo
            importResult={importResult}
            importedDatabase={importedDatabase}
          />
        ) : (
          <Text>{t(errorMsg)}</Text>
        )}
      </Box>
      <ZOUploadAction
        index={index}
        importedDatabase={importedDatabase}
        reset={reset}
      />
    </CardThemed>
  )
}

function ZOODUploadInfo({
  importResult: { source, discs },
  importedDatabase,
}: {
  importResult: ImportResult
  importedDatabase: ZzzDatabase
}) {
  const { t } = useTranslation('page_settings')
  return (
    <CardThemed>
      <Box p="md" style={{ paddingBottom: 4 }}>
        <Text>
          <Trans t={t} i18nKey="uploadCard.dbSource" />
          <strong> {source}</strong>
        </Text>
      </Box>
      <Divider />
      <Box p="md">
        <SimpleGrid spacing="sm" cols={2}>
          <Box style={{ flexGrow: 1 }}>
            <MergeResult
              result={discs}
              dbTotal={importedDatabase.discs.values.length}
              type="discs"
            />
          </Box>
        </SimpleGrid>
      </Box>
    </CardThemed>
  )
}

function MergeResult({
  result,
  dbTotal,
  type,
}: {
  result: ImportResultCounter<any>
  dbTotal: number
  type: string
}) {
  const { t } = useTranslation('page_settings')
  const total = result.import
  return (
    <CardThemed bgt="light">
      <Box p="md" style={{ paddingBottom: 4 }}>
        <Text>
          <Trans t={t} i18nKey={`count.${type}`} /> {total}
        </Text>
      </Box>
      <Divider />
      <Box p="md">
        {'new' in result && (
          <Text>
            <Trans t={t} i18nKey="count.new" />{' '}
            <strong>{result.new.length}</strong> / {total}
          </Text>
        )}
        {'unchanged' in result && (
          <Text>
            <Trans t={t} i18nKey="count.unchanged" />{' '}
            <strong>{result.unchanged.length}</strong> / {total}
          </Text>
        )}
        {'upgraded' in result && (
          <Text>
            <Trans t={t} i18nKey="count.upgraded" />{' '}
            <strong>{result.upgraded.length}</strong> / {total}
          </Text>
        )}
        {'remove' in result && !!result.remove.length && (
          <Text c="orange">
            <Trans t={t} i18nKey="count.removed" />{' '}
            <strong>{result.remove.length}</strong>
          </Text>
        )}
        {'notInImport' in result && !!result.notInImport && (
          <Text>
            <Trans t={t} i18nKey="count.notInImport" />{' '}
            <strong>{result.notInImport}</strong>
          </Text>
        )}
        <Text>
          <Trans t={t} i18nKey="count.dbTotal" />{' '}
          <strong>{result.beforeMerge}</strong> -&gt; <strong>{dbTotal}</strong>
        </Text>
        {'invalid' in result && !!result.invalid?.length && (
          <div>
            <Text c="red">
              <Trans t={t} i18nKey="count.invalid" />{' '}
              <strong>{result.invalid.length}</strong> / {total}
            </Text>
            <Box
              component="textarea"
              style={{
                width: '100%',
                fontFamily: 'monospace',
                minHeight: '10em',
                resize: 'vertical',
              }}
              value={JSON.stringify(result.invalid, undefined, 2)}
              readOnly
            />
          </div>
        )}
      </Box>
    </CardThemed>
  )
}

function ZOUploadAction({
  index,
  importedDatabase,
  reset,
}: {
  index: number
  importedDatabase?: ZzzDatabase
  reset: () => void
}) {
  const { databases, setDatabase } = useDatabaseContext()
  const database = databases[index]
  const { t } = useTranslation('page_settings')
  const replaceDB = useCallback(() => {
    if (!importedDatabase) return
    importedDatabase.swapStorage(database)
    setDatabase(index, importedDatabase)
    importedDatabase.toExtraLocalDB()
    reset()
  }, [database, index, importedDatabase, reset, setDatabase])

  return (
    <>
      <Divider />
      <Box p="md" style={{ paddingTop: 4 }}>
        <Button
          color={importedDatabase ? 'green' : 'red'}
          disabled={!importedDatabase}
          onClick={replaceDB}
          leftSection={<IconUpload />}
        >
          <Trans t={t} i18nKey="uploadCard.replaceDatabase" />
        </Button>
      </Box>
    </>
  )
}
