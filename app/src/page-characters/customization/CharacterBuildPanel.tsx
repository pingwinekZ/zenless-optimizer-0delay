import { Button, Text, TextInput, Tooltip } from '@mantine/core'
import {
  IconDeviceFloppy,
  IconPlayerPlay,
  IconTrash,
} from '@tabler/icons-react'
import { deepClone, objKeyMap } from '@zenless-optimizer/common/util'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey, WengineKey } from '../../consts'
import { allDiscSlotKeys } from '../../consts'
import type { CharacterBuild } from '../../db'
import {
  useCharacter,
  useCharacterBuilds,
  useDatabaseContext,
} from '../../db-ui'
import classes from './CharacterBuildPanel.module.css'

interface CharacterBuildPanelProps {
  characterKey: CharacterKey | null
}

export function CharacterBuildPanel({
  characterKey,
}: CharacterBuildPanelProps) {
  const { t } = useTranslation('page_characters')
  const { database } = useDatabaseContext()
  const character = useCharacter(characterKey ?? undefined)
  const builds = useCharacterBuilds(characterKey ?? undefined)
  const [buildName, setBuildName] = useState('')

  // Reset build name when character changes
  useEffect(() => {
    setBuildName('')
  }, [characterKey])

  const handleSave = useCallback(() => {
    if (!characterKey || !character) return
    const name =
      buildName.trim() ||
      `${t('characterBuilds.defaultName')} #${builds.length + 1}`
    database.characterBuilds.new({
      name,
      characterKey,
      wengineKey: character.wengineKey ?? '',
      wenginePhase: character.wenginePhase ?? 1,
      discIds: deepClone(character.equippedDiscs),
    })
    setBuildName('')
  }, [
    characterKey,
    character,
    buildName,
    builds.length,
    database.characterBuilds,
    t,
  ])

  const handleLoad = useCallback(
    (build: CharacterBuild) => {
      if (!characterKey) return

      // Build up the new equippedDiscs map
      const newEquippedDiscs = objKeyMap(allDiscSlotKeys, (slotKey) => {
        const buildDiscId = build.discIds[slotKey]
        return buildDiscId && database.discs.get(buildDiscId) ? buildDiscId : ''
      })

      // 1. Swap discs: for each slot, equip/unequip discs
      //    Must spread the full disc object (not partial) when calling setCached,
      //    because DiscDataManager.deCache expects the full ICachedDisc shape.
      for (const slotKey of allDiscSlotKeys) {
        const buildDiscId = newEquippedDiscs[slotKey]
        const currentChar = database.chars.get(characterKey)
        const currentDiscId = currentChar?.equippedDiscs[slotKey]

        // Unequip current disc if different from build
        if (currentDiscId && currentDiscId !== buildDiscId) {
          const disc = database.discs.get(currentDiscId)
          if (disc) {
            database.discs.setCached(currentDiscId, { ...disc, location: '' })
          }
        }
        // Equip the build's disc (relocation handled by DiscDataManager.toCache)
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

      // 2. Update character wengine AND equippedDiscs atomically
      //    Directly set the cached character so all subscribers see the change.
      const currentChar = database.chars.get(characterKey)
      if (currentChar) {
        database.chars.setCached(characterKey, {
          ...currentChar,
          wengineKey: build.wengineKey as WengineKey | '',
          wenginePhase: build.wenginePhase,
          equippedDiscs: newEquippedDiscs,
        })
      }
    },
    [characterKey, database]
  )

  const handleDelete = useCallback(
    (buildId: string) => {
      if (!window.confirm(t('characterBuilds.confirmDelete'))) return
      database.characterBuilds.remove(buildId)
    },
    [database.characterBuilds, t]
  )

  const charBuilds = useMemo(
    () => builds.filter((b): b is CharacterBuild => !!b),
    [builds]
  )

  if (!characterKey || !character) return null

  return (
    <div className={classes.buildsContainer}>
      <Text fw={600} size="sm" ta="center">
        {t('characterBuilds.title')}
      </Text>

      {/* Name input + save button */}
      <TextInput
        placeholder={t('characterBuilds.buildName')}
        value={buildName}
        onChange={(e) => setBuildName(e.currentTarget.value)}
        size="xs"
        className={classes.nameInput}
        rightSection={
          <Tooltip label={t('characterBuilds.saveCurrent')}>
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={handleSave}
              px={4}
            >
              <IconDeviceFloppy size={14} />
            </Button>
          </Tooltip>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
        }}
      />

      {/* Build list */}
      <div className={classes.buildList}>
        {charBuilds.length === 0 && (
          <Text className={classes.emptyState}>
            {t('characterBuilds.noBuilds')}
          </Text>
        )}
        {charBuilds.map((build) => (
          <div key={(build as any).id} className={classes.buildItem}>
            <Text className={classes.buildName}>{build.name}</Text>
            <div className={classes.buildActions}>
              <Tooltip label={t('characterBuilds.load')}>
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => handleLoad(build)}
                  px={4}
                >
                  <IconPlayerPlay size={12} />
                </Button>
              </Tooltip>
              <Tooltip label={t('characterBuilds.delete')}>
                <Button
                  size="compact-xs"
                  variant="light"
                  color="red"
                  onClick={() => handleDelete((build as any).id)}
                  px={4}
                >
                  <IconTrash size={12} />
                </Button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
