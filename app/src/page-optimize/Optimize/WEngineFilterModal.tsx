import {
  ActionIcon,
  Box,
  Divider,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { ModalWrapper, SqBadge } from '@zenless-optimizer/common/ui'
import { objKeyMap, stableArr } from '@zenless-optimizer/common/util'
import { Suspense, useContext, useMemo } from 'react'
import type { WengineKey } from '../../consts'
import {
  allSpecialityKeys,
  allWengineKeys,
  wengineMaxLevel,
} from '../../consts'
import type { TeamConditional } from '../../db'
import {
  OptConfigContext,
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '../../db-ui'
import {
  CharCalcMockCountProvider,
  WengineSheetDisplay,
} from '../../formula-ui'
import { getWengineStat } from '../../stats'
import { WengineLevelSlider, WengineToggle } from '../../ui'
import type { IWengine } from '../../zood'

export function WEngineFilterModal({
  show,
  onClose,
  wengines,
  disabled,
}: {
  show: boolean
  onClose: () => void
  wengines: WengineKey[]
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)

  return (
    <ModalWrapper opened={show} onClose={onClose}>
      <Stack gap={0}>
        <Group p="sm">
          <Text fw={700}>W-Engine Filter</Text>
          <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
            <IconX />
          </ActionIcon>
        </Group>
        <Divider />
        <Suspense fallback={<Skeleton width="100%" height={500} />}>
          <Stack gap="xs" p="sm">
            <Box>
              <Text fw={600} size="sm" mb={4}>
                W-Engine Level Filter
              </Text>
              <WengineLevelSlider
                levelLow={optConfig?.wlevelLow ?? wengineMaxLevel}
                levelHigh={optConfig?.wlevelHigh ?? wengineMaxLevel}
                setLow={(wlevelLow) =>
                  database.optConfigs.set(optConfigId, { wlevelLow })
                }
                setHigh={(wlevelHigh) =>
                  database.optConfigs.set(optConfigId, { wlevelHigh })
                }
                setBoth={(wlevelLow, wlevelHigh) =>
                  database.optConfigs.set(optConfigId, {
                    wlevelLow,
                    wlevelHigh,
                  })
                }
                disabled={disabled}
              />
            </Box>

            <Divider />

            <SpecialitySelectorInline disabled={disabled} />

            <Divider />

            <Switch
              label="Use equipped W-Engine"
              checked={!!optConfig.useEquippedWengine}
              onChange={() =>
                database.optConfigs.set(optConfigId, {
                  useEquippedWengine: !optConfig.useEquippedWengine,
                })
              }
              disabled={disabled}
              size="xs"
            />

            <Divider />

            <WengineCondSelectorInline wengines={wengines} />
          </Stack>
        </Suspense>
      </Stack>
    </ModalWrapper>
  )
}

function SpecialitySelectorInline({ disabled }: { disabled?: boolean }) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const { wEngineTypes } = optConfig
  const allWengineData = useDataManagerValues(database.wengines)
  const totals = useMemo(() => {
    return optConfig.optWengine
      ? allWengineData.reduce(
          (totals, { key }) => {
            const type = getWengineStat(key).type
            if (!type) return totals
            totals[type]++
            return totals
          },
          objKeyMap(allSpecialityKeys, () => 0)
        )
      : objKeyMap(allSpecialityKeys, () => 0)
  }, [allWengineData, optConfig.optWengine])
  return (
    <WengineToggle
      onChange={(wEngineTypes) =>
        database.optConfigs.set(optConfigId, { wEngineTypes })
      }
      value={wEngineTypes}
      disabled={disabled}
      totals={totals}
      fullWidth
    />
  )
}

function WengineCondSelectorInline({ wengines }: { wengines: WengineKey[] }) {
  const character = useCharacterContext()
  const team = useTeam(character?.key)
  const conditionals =
    team?.frames[0]?.conditionals ?? stableArr<TeamConditional>()
  const { optConfig } = useContext(OptConfigContext)
  const { wEngineTypes } = optConfig
  const wengineKeys = useMemo(
    () =>
      wEngineTypes.length
        ? allWengineKeys.filter((d) =>
            wEngineTypes.includes(getWengineStat(d).type)
          )
        : allWengineKeys,
    [wEngineTypes]
  )
  return (
    <Box>
      <Text fw={600} size="sm">
        W-Engine Conditional Configuration
      </Text>
      <Text size="xs" c="dimmed">
        Stats shown at Lvl 60/60, P1. Actual level/phase used in solver.
      </Text>
      {character && (
        <CharCalcMockCountProvider
          character={character}
          conditionals={conditionals}
        >
          <Box style={{ maxHeight: 300, overflowY: 'auto' }} mt="xs">
            <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {wengineKeys.map((d) => (
                <WengineCondCardInline
                  key={d}
                  wengineKey={d}
                  count={wengines.filter((w) => w === d).length}
                />
              ))}
            </SimpleGrid>
          </Box>
        </CharCalcMockCountProvider>
      )}
    </Box>
  )
}

function getWengine(key: WengineKey): IWengine {
  return {
    key,
    level: 60,
    modification: 5,
    phase: 1,
  }
}

function WengineCondCardInline({
  wengineKey,
  count,
}: {
  wengineKey: WengineKey
  count: number
}) {
  const wengine = useMemo(() => getWengine(wengineKey), [wengineKey])
  return (
    <WengineSheetDisplay
      wengine={wengine}
      headerAction={
        <SqBadge color={count ? 'primary' : 'secondary'}>{count}</SqBadge>
      }
      fade={!count}
    />
  )
}
