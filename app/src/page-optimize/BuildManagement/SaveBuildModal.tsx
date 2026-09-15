import { Button, Divider, Flex, Modal, TextInput, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { memo, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import type { GeneratedBuild } from '../../db'
import {
  OptConfigContext,
  useCharacter,
  useDatabaseContext,
  useTeam,
} from '../../db-ui'
import { Message } from '../../ui'
import { BuildSource } from '../../zood'
import { BuildList } from './BuildList'
import { BuildPreview } from './BuildPreview'
import { serializeFromOptimizer } from './buildConverter'
import { saveBuild } from './buildService'
import styles from './SaveBuildModal.module.css'

export const SaveBuildModal = memo(function SaveBuildModal({
  opened,
  onClose,
  selectedBuild,
  characterKey,
}: {
  opened: boolean
  onClose: () => void
  selectedBuild: GeneratedBuild | null
  characterKey: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { optConfigId } = useContext(OptConfigContext)
  const character = useCharacter(characterKey ?? '')
  const team = useTeam(characterKey ?? '')

  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [inputName, setInputName] = useState('')

  useEffect(() => {
    if (opened) {
      setSelectedName(null)
      setInputName('')
    }
  }, [opened])

  const builds = useMemo(
    () =>
      [...(character?.builds ?? [])].sort((a, b) => b.updatedAt - a.updatedAt),
    [character]
  )

  const setSelectedWrapped = (name: string | null) => {
    setSelectedName(name)
    if (name !== null) {
      const build = builds.find((b) => b.name === name)
      setInputName(build?.name ?? '')
    } else {
      setInputName('')
    }
  }

  // Live preview: the selected saved build, or the current form serialized
  const previewBuild = useMemo(() => {
    if (!character || !characterKey) return null
    if (selectedName !== null)
      return builds.find((b) => b.name === selectedName) ?? null
    const optConfig = database.optConfigs.get(optConfigId)
    return serializeFromOptimizer(
      '',
      characterKey,
      character,
      team,
      optConfig,
      selectedBuild
        ? {
            discIds: selectedBuild.discIds,
            wengineKey: selectedBuild.wengineKey,
            value: selectedBuild.value,
          }
        : {
            discIds: { ...character.equippedDiscs },
            wengineKey: character.wengineKey || undefined,
          }
    )
  }, [
    selectedName,
    builds,
    character,
    characterKey,
    team,
    database,
    optConfigId,
    selectedBuild,
  ])

  if (!characterKey) return null

  const nameTaken = builds.some((b) => b.name === inputName.trim())
  const saveDisabled = nameTaken || inputName.trim() === ''
  const overwriteDisabled = !nameTaken || inputName.trim() === ''

  function handleSave(mode: 'overwrite' | 'save') {
    if (!characterKey) return
    const result = saveBuild(database, {
      name: inputName,
      characterKey,
      optConfigId,
      source: BuildSource.Optimizer,
      overwrite: mode === 'overwrite',
      ...(selectedBuild && {
        equipped: {
          discIds: selectedBuild.discIds,
          wengineKey: selectedBuild.wengineKey,
          value: selectedBuild.value,
        },
      }),
    })
    if (result.error) {
      Message.error(result.error)
      return
    }
    Message.success(
      mode === 'overwrite'
        ? t('buildsSection.successOverwrite', 'Overwrote build {{name}}', {
            name: inputName.trim(),
          })
        : t('buildsSection.successSave', 'Saved build {{name}}', {
            name: inputName.trim(),
          })
    )
    onClose()
  }

  function handleOverwrite() {
    modals.openConfirmModal({
      title: t('buildsSection.overwrite', 'Overwrite'),
      children: t(
        'buildsSection.confirmOverwrite',
        'Overwrite the existing build with the current setup?'
      ),
      labels: {
        confirm: t('buildsSection.overwrite', 'Overwrite'),
        cancel: t('buildsSection.cancel', 'Cancel'),
      },
      centered: true,
      onConfirm: () => handleSave('overwrite'),
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} size={1550} centered>
      <Flex gap={10} className={styles.outerFlex}>
        <Flex direction="column" className={styles.leftColumn}>
          <TextInput
            label={t('buildsSection.label', 'Build name')}
            value={inputName}
            onChange={(e) => {
              const value = e.currentTarget.value
              setInputName(value)
              const match = builds.find((b) => b.name === value)
              setSelectedName(match ? match.name : null)
            }}
          />
          <Divider className={styles.divider} />
          <Button
            variant="default"
            onClick={onClose}
            className={styles.actionButton}
          >
            {t('buildsSection.cancel', 'Cancel')}
          </Button>
          <Tooltip
            label={
              saveDisabled
                ? nameTaken
                  ? t(
                      'buildsSection.saveDisabledNameTaken',
                      'A build with this name already exists — use Overwrite to replace it'
                    )
                  : t(
                      'buildsSection.saveDisabledNoName',
                      'Enter a name to save the build'
                    )
                : ''
            }
            position="right"
          >
            <Button
              onClick={() => handleSave('save')}
              className={styles.actionButton}
              disabled={saveDisabled}
            >
              {t('buildsSection.save', 'Save')}
            </Button>
          </Tooltip>
          <Tooltip
            label={
              overwriteDisabled
                ? t(
                    'buildsSection.overwriteDisabled',
                    'No saved build matches this name'
                  )
                : ''
            }
            position="right"
          >
            <Button
              onClick={handleOverwrite}
              className={styles.actionButton}
              disabled={overwriteDisabled}
            >
              {t('buildsSection.overwrite', 'Overwrite')}
            </Button>
          </Tooltip>
          <Divider className={styles.divider} />
          <BuildList
            preview
            builds={builds}
            selectedName={selectedName}
            onSelect={setSelectedWrapped}
            style={{ height: '100%' }}
          />
        </Flex>
        <BuildPreview build={previewBuild} characterKey={characterKey} />
      </Flex>
    </Modal>
  )
})
