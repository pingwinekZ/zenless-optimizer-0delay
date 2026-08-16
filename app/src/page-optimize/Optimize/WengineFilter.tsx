import {
  ActionIcon,
  Box,
  Button,
  CardSection,
  Divider,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconCheckbox, IconSquare, IconX } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { CardThemed, ModalWrapper, SqBadge } from '@zenless-optimizer/common/ui'
import { objKeyMap, stableArr } from '@zenless-optimizer/common/util'
import { Suspense, useContext, useMemo } from 'react'
import type { WengineKey } from '../../consts'
import { allSpecialityKeys, allWengineKeys } from '../../consts'
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
import { WengineToggle } from '../../ui'
import type { IWengine } from '../../zood'
import { WengineLevelFilter } from './WengineLevelFilter'
export function WengineFilter({
  wengines,
  disabled,
}: {
  wengines: WengineKey[]
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const [show, onOpen, onClose] = useBoolState()
  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap={1}>
          <Box
            style={{
              display: 'flex',
              gap: 2,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box
              style={{
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              Wengines:{' '}
              <SqBadge color={wengines.length ? 'primary' : 'error'}>
                {wengines.length}
              </SqBadge>
            </Box>
            <Button
              style={{ flexGrow: 1 }}
              leftSection={
                optConfig.optWengine ? (
                  <IconCheckbox size={16} />
                ) : (
                  <IconSquare size={16} />
                )
              }
              color={optConfig.optWengine ? 'green' : 'gray'}
              onClick={() =>
                database.optConfigs.set(optConfigId, {
                  optWengine: !optConfig.optWengine,
                })
              }
            >
              Optimize Wengine
            </Button>
          </Box>
          <WengineFilterModal
            show={show}
            onClose={onClose}
            wengines={wengines}
          />
          <Button
            color="blue"
            fullWidth
            onClick={onOpen}
            disabled={disabled || !optConfig.optWengine}
          >
            Wengine Filter Config
          </Button>
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

function WengineFilterModal({
  wengines,
  show,
  onClose,
  disabled,
}: {
  wengines: WengineKey[]
  show: boolean
  onClose: () => void
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  return (
    <ModalWrapper opened={show} onClose={onClose}>
      <CardThemed>
        <Group p="sm">
          <Text fw={700}>Wengine Filter</Text>
          <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
            <IconX />
          </ActionIcon>
        </Group>
        <Divider />
        <CardSection>
          <Suspense fallback={<Skeleton width="100%" height={500} />}>
            <Stack gap={1}>
              <WengineLevelFilter disabled={disabled} />
              <SpecialitySelector disabled={disabled} />
              <Button
                disabled={disabled}
                onClick={() =>
                  database.optConfigs.set(optConfigId, {
                    useEquippedWengine: !optConfig.useEquippedWengine,
                  })
                }
                color={optConfig.useEquippedWengine ? 'green' : 'gray'}
              >
                Use equipped Wengine
              </Button>
              <WengineCondSelector wengines={wengines} />
            </Stack>
          </Suspense>
        </CardSection>
      </CardThemed>
    </ModalWrapper>
  )
}

function SpecialitySelector({ disabled }: { disabled?: boolean }) {
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

function WengineCondSelector({ wengines }: { wengines: WengineKey[] }) {
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
      <Text fw={700}>Wengine Condtional Configuration</Text>
      <Text>
        Wengine stats are displayed to be Lvl 60/60, P1, actual level/phase of
        wengine will be used in the solver.
      </Text>
      {character && (
        <CharCalcMockCountProvider
          character={character}
          conditionals={conditionals}
        >
          <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing={1}>
            {wengineKeys.map((d) => (
              <WengineCondCard
                key={d}
                wengineKey={d}
                count={wengines.filter((w) => w === d).length}
              />
            ))}
          </SimpleGrid>
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
function WengineCondCard({
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
