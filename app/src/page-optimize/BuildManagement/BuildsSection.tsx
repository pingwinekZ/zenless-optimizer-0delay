import { Button, Flex, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDownload, IconUpload } from '@tabler/icons-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import type { GeneratedBuild } from '../../db'
import { ExportImportSection } from './ExportImportSection'
import { LoadBuildModal } from './LoadBuildModal'
import { SaveBuildModal } from './SaveBuildModal'

export const BuildsSection = memo(function BuildsSection({
  selectedBuild = null,
  characterKey = null,
}: {
  selectedBuild?: GeneratedBuild | null
  characterKey?: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const [saveOpened, { open: openSave, close: closeSave }] =
    useDisclosure(false)
  const [loadOpened, { open: openLoad, close: closeLoad }] =
    useDisclosure(false)
  const [_exportOpened, { open: _openExport, close: _closeExport }] =
    useDisclosure(false)

  return (
    <>
      <Flex direction="column" gap={5}>
        <Text fw={700} size="sm">
          {t('buildsSection.title', 'Build Management')}
        </Text>
        <Flex gap={5} wrap="wrap">
          <Button
            size="compact-sm"
            variant="light"
            leftSection={<IconDownload size={14} />}
            onClick={openSave}
            style={{ flex: 1 }}
          >
            {t('buildsSection.save', 'Save')}
          </Button>
          <Button
            size="compact-sm"
            variant="light"
            leftSection={<IconUpload size={14} />}
            onClick={openLoad}
            style={{ flex: 1 }}
          >
            {t('buildsSection.load', 'Load')}
          </Button>
        </Flex>
        <ExportImportSection />
      </Flex>

      <SaveBuildModal
        opened={saveOpened}
        onClose={closeSave}
        selectedBuild={selectedBuild}
        characterKey={characterKey}
      />
      <LoadBuildModal
        opened={loadOpened}
        onClose={closeLoad}
        characterKey={characterKey}
      />
    </>
  )
})
