import { Box, Flex, Stack, Text } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { characterAsset, discDefIcon, wengineAsset } from '../../assets'
import type { CharacterKey, DiscSetKey, WengineKey } from '../../consts'
import { allDiscSlotKeys, isWengineKey } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import type { SavedBuild } from '../../zood'
import { HeaderText } from '../layout'
import { comboSummary } from './BuildList'
import styles from './BuildsModal.module.css'

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const BuildPreview = memo(function BuildPreview({
  build,
  characterKey,
}: {
  build: SavedBuild | null
  characterKey: CharacterKey
}) {
  const { t } = useTranslation('page_optimize')
  const { database } = useDatabaseContext()
  if (!build) return <div className={styles.emptyPreview}></div>

  const setup = build.charSetup
  const rawWengineKey = build.wengineSetup?.wengineKey ?? build.wengineKey ?? ''
  const wengineKey: WengineKey | '' = isWengineKey(rawWengineKey)
    ? rawWengineKey
    : ''
  const wenginePhase = build.wengineSetup?.wenginePhase ?? 1
  const combo = comboSummary(build)
  const teammates = (build.teamSnapshot?.teammates ?? []).slice(1)

  return (
    <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
      <Box
        component="img"
        src={characterAsset(characterKey, 'full')}
        style={{
          width: '100%',
          height: 320,
          objectFit: 'contain',
          objectPosition: 'center top',
          backgroundColor: 'var(--layer-2)',
          borderRadius: 6,
        }}
        alt={characterKey}
      />
      <Flex direction="column" gap={4}>
        <HeaderText style={{ fontSize: 16 }}>{build.name}</HeaderText>
        <Text size="xs" c="dimmed">
          {formatDate(build.updatedAt)}
          {build.value !== undefined &&
            ` — Val: ${build.value.toLocaleString()}`}
        </Text>
        {build.description && <Text size="sm">{build.description}</Text>}
      </Flex>

      {setup && (
        <Text size="xs" c="dimmed">
          Lv{setup.level} · M{setup.mindscape} · Core {setup.core} ·{' '}
          {setup.basic}/{setup.dodge}/{setup.special}/{setup.chain}/
          {setup.assist}
        </Text>
      )}

      <Flex gap="sm" align="center">
        {wengineKey ? (
          <>
            <ImgIcon size={2} src={wengineAsset(wengineKey)} />
            <Text size="sm">
              {wengineKey} P{wenginePhase}
            </Text>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            {t('buildsSection.noWengine', 'No W-Engine')}
          </Text>
        )}
      </Flex>

      <Flex gap={4}>
        {allDiscSlotKeys.map((slotKey) => {
          const discId = build.discIds[slotKey]
          const disc = discId ? database.discs.get(discId) : undefined
          return (
            <Flex
              key={slotKey}
              direction="column"
              align="center"
              gap={2}
              style={{ flex: 1 }}
            >
              {disc ? (
                <>
                  <ImgIcon
                    size={2}
                    src={discDefIcon(disc.setKey as DiscSetKey)}
                  />
                  <Text size="xs" c="dimmed">
                    +{disc.level}
                  </Text>
                </>
              ) : (
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: '1px dashed var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="xs" c="dimmed">
                    {slotKey}
                  </Text>
                </Box>
              )}
            </Flex>
          )
        })}
      </Flex>

      {teammates.length > 0 && (
        <Flex gap="sm">
          {teammates.map((ally: { characterKey: string }, idx: number) =>
            ally?.characterKey ? (
              <Flex key={idx} direction="column" align="center" gap={2}>
                <ImgIcon
                  size={2}
                  src={characterAsset(
                    ally.characterKey as CharacterKey,
                    'circle'
                  )}
                />
                <Text size="xs" c="dimmed">
                  {ally.characterKey}
                </Text>
              </Flex>
            ) : null
          )}
        </Flex>
      )}

      {combo && (
        <Text size="sm" c="dimmed">
          {combo}
        </Text>
      )}
    </Stack>
  )
})
