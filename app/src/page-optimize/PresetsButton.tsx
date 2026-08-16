import { Menu, Stack, Text } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../consts'
import { OptConfigContext, useDatabaseContext } from '../db-ui'
import {
  getRecommendedPresets,
  mergeStatFilters,
  type RecommendedPreset,
} from './data/recommendedPresets'

export function PresetsButton({
  characterKey,
}: {
  characterKey: CharacterKey
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  const { optConfigId } = useContext(OptConfigContext)
  const presets = getRecommendedPresets(characterKey)

  const applyPreset = useCallback(
    (preset: RecommendedPreset) => {
      database.teams.setFrame0(characterKey, { tag: preset.target })
      database.optConfigs.set(optConfigId, {
        setFilter2: preset.setFilter2,
        setFilter4: preset.setFilter4,
        slot4: preset.mainStats['4'] ?? [],
        slot5: preset.mainStats['5'] ?? [],
        slot6: preset.mainStats['6'] ?? [],
      })
      const current = database.optConfigs.get(optConfigId)
      database.optConfigs.set(optConfigId, {
        statFilters: mergeStatFilters(
          current?.statFilters ?? [],
          preset.statFilters
        ),
      })
    },
    [database, characterKey, optConfigId]
  )

  return (
    <DropdownButton
      title={t('presets.title', 'Recommended Presets')}
      variant="light"
      size="sm"
      fullWidth
    >
      {presets.length === 0 ? (
        <Menu.Item disabled>
          <Menu.Label>
            {t('presets.noPresets', 'No presets available')}
          </Menu.Label>
        </Menu.Item>
      ) : (
        presets.map((preset) => (
          <Menu.Item key={preset.id} onClick={() => applyPreset(preset)}>
            <Stack gap={2}>
              <Text size="xs" fw={600}>
                {preset.name}
              </Text>
              {preset.description && (
                <Text size="xs" c="dimmed">
                  {preset.description}
                </Text>
              )}
            </Stack>
          </Menu.Item>
        ))
      )}
    </DropdownButton>
  )
}
