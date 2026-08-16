import {
  Button,
  Card,
  CloseButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { memo, useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'

export const LoadBuildModal = memo(function LoadBuildModal({
  opened,
  onClose,
  characterKey,
}: {
  opened: boolean
  onClose: () => void
  characterKey: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { optConfigId } = useContext(OptConfigContext)
  const [search, setSearch] = useState('')

  // Get all saved builds - we use the data manager's keys to access entries
  const savedBuildKeys = useMemo(
    () => database.savedBuilds.keys,
    [database.savedBuilds]
  )

  const savedBuilds = useMemo(
    () =>
      savedBuildKeys
        .map((key) => {
          const build = database.savedBuilds.get(key)
          return build ? { id: key, ...build } : null
        })
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .filter(
          (b) =>
            !search ||
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.description?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [savedBuildKeys, database.savedBuilds, search]
  )

  const handleLoad = useCallback(
    (buildId: string) => {
      const savedBuild = database.savedBuilds.get(buildId)
      if (!savedBuild || !characterKey) return

      // 1. Restore optimizer settings (filters, slots, set filters, wengine options, etc.)
      if (savedBuild.optimizerSettings) {
        database.optConfigs.set(optConfigId, {
          ...savedBuild.optimizerSettings,
        })
      }

      // 2. Restore team snapshot (teammates with overrides, frames, enemy stats)
      if (savedBuild.teamSnapshot) {
        database.teams.set(characterKey, {
          teammates: savedBuild.teamSnapshot.teammates ?? [{ characterKey }],
          frames: savedBuild.teamSnapshot.frames ?? [],
          enemyLvl: savedBuild.teamSnapshot.enemyLvl ?? 80,
          enemyDef: savedBuild.teamSnapshot.enemyDef ?? 953,
          enemyStunMultiplier:
            savedBuild.teamSnapshot.enemyStunMultiplier ?? 150,
        })
      }

      // 3. Create a generated build list from the saved build and link it to the optConfig
      database.optConfigs.newOrSetGeneratedBuildList(optConfigId, {
        builds: [
          {
            wengineKey: savedBuild.wengineKey,
            discIds: savedBuild.discIds,
            value: savedBuild.value,
          },
        ],
        buildDate: Date.now(),
      })

      onClose()
    },
    [database, characterKey, optConfigId, onClose]
  )

  const handleDelete = useCallback(
    (buildId: string) => {
      database.savedBuilds.remove(buildId)
    },
    [database.savedBuilds]
  )

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('buildsSection.loadBuild', 'Load Build')}
      size="md"
    >
      <Stack gap="sm">
        <TextInput
          placeholder={t('buildsSection.searchPlaceholder', 'Search builds...')}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        {savedBuilds.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {search
              ? t(
                  'buildsSection.noSearchResults',
                  'No builds match your search.'
                )
              : t(
                  'buildsSection.noSavedBuilds',
                  'No saved builds yet. Run an optimization and save a build!'
                )}
          </Text>
        ) : (
          savedBuilds.map((build) => (
            <Card key={build.id} padding="sm" withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>
                    {build.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(build.updatedAt)} — Val:{' '}
                    {build.value.toLocaleString()}
                  </Text>
                  {build.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {build.description}
                    </Text>
                  )}
                </Stack>
                <Group gap={4}>
                  <Button
                    size="compact-xs"
                    variant="light"
                    onClick={() => handleLoad(build.id!)}
                  >
                    {t('buildsSection.load', 'Load')}
                  </Button>
                  <CloseButton
                    size="sm"
                    onClick={() => handleDelete(build.id!)}
                    aria-label={t('buildsSection.delete', 'Delete')}
                  />
                </Group>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Modal>
  )
})
