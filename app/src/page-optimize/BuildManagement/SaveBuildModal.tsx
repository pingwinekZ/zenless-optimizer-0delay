import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { memo, useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import type { GeneratedBuild } from '../../db'
import {
  OptConfigContext,
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '../../db-ui'

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
  const { optConfig } = useContext(OptConfigContext)
  const character = useCharacterContext()
  const team = useTeam(characterKey ?? '')

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) =>
        value.trim().length < 1
          ? t('buildsSection.nameRequired', 'Name is required')
          : null,
    },
  })

  const handleSave = useCallback(
    (values: { name: string; description: string }) => {
      if (!selectedBuild) return
      const characterKey = character?.key ?? ''

      // Capture full optimizer settings
      const optimizerSettings: Record<string, unknown> = {
        statFilters: optConfig.statFilters,
        maxBuildsToShow: optConfig.maxBuildsToShow,
        levelLow: optConfig.levelLow,
        levelHigh: optConfig.levelHigh,
        slot4: optConfig.slot4,
        slot5: optConfig.slot5,
        slot6: optConfig.slot6,
        setFilter2: optConfig.setFilter2,
        setFilter4: optConfig.setFilter4,
        useEquipped: optConfig.useEquipped,
        useCharacterPriority: optConfig.useCharacterPriority,
        includeOffsets: optConfig.includeOffsets,
        optWengine: optConfig.optWengine,
        wlevelLow: optConfig.wlevelLow,
        wlevelHigh: optConfig.wlevelHigh,
        wEngineTypes: optConfig.wEngineTypes,
        useEquippedWengine: optConfig.useEquippedWengine,
      }

      // Capture team snapshot (teammates, conditionals, frames, enemy stats)
      const teamSnapshot = team
        ? {
            teammates: team.teammates,
            frames: team.frames,
            enemyLvl: team.enemyLvl,
            enemyDef: team.enemyDef,
            enemyStunMultiplier: team.enemyStunMultiplier,
          }
        : undefined

      database.savedBuilds.new({
        name: values.name,
        description: values.description,
        value: selectedBuild.value,
        wengineKey: selectedBuild.wengineKey,
        discIds: selectedBuild.discIds,
        characterKey,
        optimizerSettings,
        teamSnapshot,
      })

      form.reset()
      onClose()
    },
    [selectedBuild, optConfig, team, database, form, onClose, character?.key]
  )

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('buildsSection.saveBuild', 'Save Build')}
      size="sm"
    >
      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            {t(
              'buildsSection.saveDescription',
              'Save the current generated build list with a name so you can load it later.'
            )}
          </Text>
          <TextInput
            label={t('buildsSection.buildName', 'Build Name')}
            placeholder={t('buildsSection.namePlaceholder', 'My Build')}
            required
            {...form.getInputProps('name')}
          />
          <Textarea
            label={t('buildsSection.description', 'Description (optional)')}
            placeholder={t(
              'buildsSection.descPlaceholder',
              'Some notes about this build...'
            )}
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              {t('buildsSection.cancel', 'Cancel')}
            </Button>
            <Button type="submit">{t('buildsSection.save', 'Save')}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
})
