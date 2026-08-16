import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CardSection,
  Flex,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconChecklist, IconPin, IconPinned } from '@tabler/icons-react'
import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { valueString } from '@zenless-optimizer/common/util'
import { memo, useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeneratedBuild } from '../../db'
import {
  OptConfigContext,
  useCharacterContext,
  useDatabaseContext,
  useDiscs,
  useTeam,
} from '../../db-ui'
import { CharCalcProvider, CharStatsDisplay } from '../../formula-ui'
import {
  CompactDiscCard,
  CompactWengineCard,
  DiscSetCardCompact,
} from '../../ui'
import { useOptimizerDisplayStore } from '../stores/useOptimizerDisplayStore'

function useGeneratedBuildList(listId: string) {
  const { database } = useDatabaseContext()
  return useDataManagerBase(database.generatedBuildList, listId)
}

const GeneratedBuildsDisplay = memo(function GeneratedBuildsDisplay() {
  const { optConfig } = useContext(OptConfigContext)
  const comparisonMode = useOptimizerDisplayStore((s) => s.comparisonMode)
  const compareBuildIndex = useOptimizerDisplayStore((s) => s.compareBuildIndex)
  const generatedBuildList = useGeneratedBuildList(
    optConfig.generatedBuildListId ?? ''
  )
  return (
    <Stack gap={1}>
      {generatedBuildList?.builds.map((build, i) => (
        <Box
          key={`${i}-${build.wengineKey}-${Object.values(build.discIds).join(
            '-'
          )}`}
          style={{
            outline:
              comparisonMode && compareBuildIndex === i
                ? '2px solid var(--mantine-color-yellow-6)'
                : undefined,
            borderRadius: 6,
          }}
        >
          <GeneratedBuildDisplay
            build={build}
            index={i}
            isCompareTarget={comparisonMode && compareBuildIndex === i}
          />
        </Box>
      ))}
    </Stack>
  )
})
export default GeneratedBuildsDisplay

function EquipBtn({
  build: { discIds, wengineKey },
}: {
  build: GeneratedBuild
}) {
  const { t } = useTranslation('build')

  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext() ?? {}
  const onEquip = useCallback(() => {
    if (!characterKey) return
    Object.entries(discIds).forEach(
      ([_slotKey, discId]) =>
        discId && database.discs.set(discId, { location: characterKey })
    )
    wengineKey &&
      database.chars.set(characterKey, { wengineKey: wengineKey as never })
  }, [characterKey, discIds, wengineKey, database.chars, database.discs])
  return (
    <Button
      color="blue"
      size="compact-sm"
      leftSection={<IconChecklist size={16} />}
      onClick={onEquip}
    >
      {t('buildDisplay.equipToCrr')}
    </Button>
  )
}

function PinBuildBtn({
  build,
  index,
}: {
  build: GeneratedBuild
  index: number
}) {
  const pinnedBuilds = useOptimizerDisplayStore((s) => s.pinnedBuilds)
  const addPinnedBuild = useOptimizerDisplayStore((s) => s.addPinnedBuild)
  const removePinnedBuild = useOptimizerDisplayStore((s) => s.removePinnedBuild)

  const buildId = `${build.wengineKey}-${Object.values(build.discIds).join('-')}`
  const isPinned = pinnedBuilds.some((b) => b.buildId === buildId)

  const handleTogglePin = useCallback(() => {
    if (isPinned) {
      removePinnedBuild(buildId)
    } else {
      addPinnedBuild({
        buildId,
        index,
        value: build.value,
        wengineKey: build.wengineKey,
        discIds: build.discIds,
      })
    }
  }, [
    isPinned,
    buildId,
    index,
    build.value,
    build.wengineKey,
    build.discIds,
    addPinnedBuild,
    removePinnedBuild,
  ])

  return (
    <ActionIcon
      size="sm"
      variant={isPinned ? 'filled' : 'subtle'}
      color={isPinned ? 'yellow' : 'gray'}
      onClick={handleTogglePin}
    >
      {isPinned ? <IconPinned size={14} /> : <IconPin size={14} />}
    </ActionIcon>
  )
}

function CompareBtn({ index }: { index: number }) {
  const comparisonMode = useOptimizerDisplayStore((s) => s.comparisonMode)
  const setComparisonMode = useOptimizerDisplayStore((s) => s.setComparisonMode)
  const compareBuildIndex = useOptimizerDisplayStore((s) => s.compareBuildIndex)
  const setCompareBuildIndex = useOptimizerDisplayStore(
    (s) => s.setCompareBuildIndex
  )

  const isSelected = comparisonMode && compareBuildIndex === index

  const handleClick = useCallback(() => {
    if (isSelected) {
      setComparisonMode(false)
      setCompareBuildIndex(null)
    } else {
      setComparisonMode(true)
      setCompareBuildIndex(index)
    }
  }, [isSelected, index, setComparisonMode, setCompareBuildIndex])

  return (
    <Button
      size="compact-sm"
      variant={isSelected ? 'filled' : 'light'}
      color={isSelected ? 'yellow' : 'gray'}
      onClick={handleClick}
    >
      {isSelected ? 'Comparing' : 'Compare'}
    </Button>
  )
}

function GeneratedBuildDisplay({
  build,
  index,
  isCompareTarget = false,
}: {
  build: GeneratedBuild
  index: number
  isCompareTarget?: boolean
}) {
  const character = useCharacterContext()!
  const team = useTeam(character.key)!
  const discs = useDiscs(build.discIds)
  const comparisonMode = useOptimizerDisplayStore((s) => s.comparisonMode)
  return (
    <CharCalcProvider character={character} team={team} discIds={build.discIds}>
      <CardThemed>
        <CardSection>
          <Stack gap={1}>
            <Box
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Flex gap="xs" align="center">
                {comparisonMode && (
                  <Badge
                    size="xs"
                    color={isCompareTarget ? 'yellow' : 'gray'}
                    variant={isCompareTarget ? 'filled' : 'outline'}
                  >
                    {isCompareTarget ? 'Target' : 'Baseline'}
                  </Badge>
                )}
                <Text>
                  Build {index + 1}: {valueString(build.value)}
                </Text>
              </Flex>
              <Flex gap={4} align="center">
                <CompareBtn index={index} />
                <PinBuildBtn build={build} index={index} />
                <EquipBtn build={build} />
              </Flex>
            </Box>
            <SimpleGrid cols={4} spacing={1}>
              <CharStatsDisplay />
              <Stack gap={1}>
                {(['1', '2', '3'] as const).map((slotKey) => (
                  <CompactDiscCard
                    key={slotKey}
                    disc={discs?.[slotKey]}
                    slotKey={slotKey}
                  />
                ))}
              </Stack>
              <Stack gap={1}>
                <CompactWengineCard wengineId={build.wengineKey} />
                <DiscSetCardCompact discs={discs} />
              </Stack>
              <Stack gap={1}>
                {(['6', '5', '4'] as const).map((slotKey) => (
                  <CompactDiscCard
                    key={slotKey}
                    disc={discs?.[slotKey]}
                    slotKey={slotKey}
                  />
                ))}
              </Stack>
            </SimpleGrid>
          </Stack>
        </CardSection>
      </CardThemed>
    </CharCalcProvider>
  )
}
