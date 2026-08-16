import { Button, Flex, Select, Text } from '@mantine/core'
import { useDataManagerKeys } from '@zenless-optimizer/common/database-ui'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey, WengineKey } from '../../consts'
import { allDiscSlotKeys } from '../../consts'
import { useCharacter, useDatabaseContext } from '../../db-ui'

export function CharacterBuildSelector({
  characterKey,
  label,
  compact = false,
}: {
  characterKey: CharacterKey | undefined
  label?: string
  compact?: boolean
}) {
  const { t } = useTranslation('page_characters')
  const { database } = useDatabaseContext()
  const character = useCharacter(characterKey ?? undefined)
  const buildKeys = useDataManagerKeys(database.characterBuilds)
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)

  // Pair build keys with data — build objects from useCharacterBuilds
  // don't include the database key/id, so we cross-reference by characterKey
  const charBuilds = useMemo(() => {
    if (!characterKey) return []
    return buildKeys
      .map((key) => {
        const build = database.characterBuilds.get(key)
        if (!build || build.characterKey !== characterKey) return null
        return { value: key, label: build.name }
      })
      .filter((b): b is { value: string; label: string } => !!b)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [buildKeys, characterKey, database.characterBuilds])

  const handleLoad = useCallback(
    (buildId: string) => {
      if (!characterKey || !character) return
      const build = database.characterBuilds.get(buildId)
      if (!build) return

      // Build up the new equippedDiscs map
      const newEquippedDiscs = objKeyMap(allDiscSlotKeys, (slotKey) => {
        const buildDiscId = build.discIds[slotKey]
        return buildDiscId && database.discs.get(buildDiscId) ? buildDiscId : ''
      })

      // 1. Swap discs: unequip current, equip build's
      for (const slotKey of allDiscSlotKeys) {
        const buildDiscId = newEquippedDiscs[slotKey]
        const currentChar = database.chars.get(characterKey)
        const currentDiscId = currentChar?.equippedDiscs[slotKey]

        if (currentDiscId && currentDiscId !== buildDiscId) {
          const disc = database.discs.get(currentDiscId)
          if (disc) {
            database.discs.setCached(currentDiscId, { ...disc, location: '' })
          }
        }
        if (buildDiscId) {
          const disc = database.discs.get(buildDiscId)
          if (disc) {
            database.discs.setCached(buildDiscId, {
              ...disc,
              location: characterKey,
            })
          }
        }
      }

      // 2. Update character wengine and equippedDiscs
      const currentChar = database.chars.get(characterKey)
      if (currentChar) {
        database.chars.setCached(characterKey, {
          ...currentChar,
          wengineKey: build.wengineKey as WengineKey | '',
          wenginePhase: build.wenginePhase,
          equippedDiscs: newEquippedDiscs,
        })
      }

      setSelectedBuildId(null)
    },
    [characterKey, character, database]
  )

  if (!characterKey || !character) return null

  if (compact) {
    // Compact variant: inline select + load button
    return (
      <Flex align="center" gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Select
          data={charBuilds}
          value={selectedBuildId}
          onChange={(val) => setSelectedBuildId(val)}
          placeholder={label ?? t('characterBuilds.title')}
          size="xs"
          clearable
          searchable
          nothingFoundMessage={t('characterBuilds.noBuilds') as string}
          style={{ flex: 1, minWidth: 0 }}
          comboboxProps={{ withinPortal: false }}
        />
        <Button
          size="compact-xs"
          variant="light"
          disabled={!selectedBuildId}
          onClick={() => {
            if (selectedBuildId) handleLoad(selectedBuildId)
          }}
        >
          {t('characterBuilds.load')}
        </Button>
      </Flex>
    )
  }

  // Full variant: label + select + load button
  return (
    <Flex direction="column" gap={4}>
      {label && (
        <Text size="xs" fw={600}>
          {label}
        </Text>
      )}
      <Flex align="center" gap={4}>
        <Select
          data={charBuilds}
          value={selectedBuildId}
          onChange={(val) => setSelectedBuildId(val)}
          placeholder={t('characterBuilds.title')}
          size="xs"
          clearable
          searchable
          nothingFoundMessage={t('characterBuilds.noBuilds') as string}
          style={{ flex: 1 }}
          comboboxProps={{ withinPortal: false }}
        />
        <Button
          size="compact-xs"
          variant="light"
          disabled={!selectedBuildId}
          onClick={() => {
            if (selectedBuildId) handleLoad(selectedBuildId)
          }}
        >
          {t('characterBuilds.load')}
        </Button>
      </Flex>
    </Flex>
  )
}
