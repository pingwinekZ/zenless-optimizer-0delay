import { Button, Flex, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconFileExport, IconFileImport } from '@tabler/icons-react'
import { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import { allCharacterKeys } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { parseSavedBuild } from '../../zood'

export const ExportImportSection = memo(function ExportImportSection({
  characterKey,
}: {
  characterKey?: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const [exportOpened, { open: openExport, close: closeExport }] =
    useDisclosure(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = useCallback(() => {
    if (!characterKey) return
    const character = database.chars.get(characterKey)
    const builds = [...(character?.builds ?? [])]
    if (builds.length === 0) {
      alert(t('buildsSection.noBuildsToExport', 'No saved builds to export.'))
      return
    }

    const json = JSON.stringify(
      { builds, exportVersion: 1, characterKey },
      null,
      2
    )
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zzz-builds-${characterKey}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    closeExport()
  }, [database, characterKey, t, closeExport])

  const handleImport = useCallback(
    (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr)
        const rawBuilds = data.builds ?? (Array.isArray(data) ? data : [data])
        let imported = 0
        for (const raw of rawBuilds) {
          const build = parseSavedBuild(raw)
          if (!build || !build.name) continue
          const targetKey =
            (allCharacterKeys as readonly string[]).includes(
              build.characterKey
            ) && build.characterKey !== characterKey
              ? (build.characterKey as CharacterKey)
              : characterKey
          if (!targetKey) continue
          const char = database.chars.getOrCreate(targetKey)
          const builds = [...(char.builds ?? [])]
          const idx = builds.findIndex((b) => b.name === build.name)
          if (idx === -1) builds.push({ ...build, characterKey: targetKey })
          else
            builds[idx] = {
              ...build,
              characterKey: targetKey,
              createdAt: builds[idx].createdAt,
              updatedAt: Date.now(),
            }
          database.chars.set(targetKey, { builds })
          imported++
        }
        if (imported === 0) {
          alert(
            t(
              'buildsSection.importFailed',
              'Could not import any builds. Check the file format.'
            )
          )
        }
      } catch {
        alert(
          t(
            'buildsSection.invalidJson',
            'Invalid JSON format. Please check the file.'
          )
        )
      }
    },
    [database, characterKey, t]
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        handleImport(text)
      }
      reader.readAsText(file)
      // Reset input so same file can be re-imported
      e.target.value = ''
    },
    [handleImport]
  )

  return (
    <>
      <Flex gap={5}>
        <Button
          size="compact-sm"
          variant="subtle"
          leftSection={<IconFileExport size={12} />}
          onClick={openExport}
          style={{ flex: 1 }}
        >
          {t('buildsSection.export', 'Export')}
        </Button>
        <Button
          size="compact-sm"
          variant="subtle"
          leftSection={<IconFileImport size={12} />}
          onClick={() => fileInputRef.current?.click()}
          style={{ flex: 1 }}
        >
          {t('buildsSection.import', 'Import')}
        </Button>
      </Flex>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <Modal
        opened={exportOpened}
        onClose={closeExport}
        title={t('buildsSection.exportBuilds', 'Export Builds')}
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            {t(
              'buildsSection.exportDescription',
              'Export all saved builds as a JSON file for sharing or backup.'
            )}
          </Text>
          <Button onClick={handleExport}>
            {t('buildsSection.export', 'Export')}
          </Button>
        </Stack>
      </Modal>
    </>
  )
})
