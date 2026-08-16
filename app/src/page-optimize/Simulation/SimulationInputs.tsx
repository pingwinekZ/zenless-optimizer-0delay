import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CardSection,
  CloseButton,
  Flex,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  allDiscSetKeys,
  allDiscSubStatKeys,
  discSlotToMainStatKeys,
  statKeyTextMap,
} from '../../consts'
import { StatDisplay } from '../../ui'

/**
 * A single simulation configuration — defines the stats of a hypothetical build.
 *
 * TODO: Connect these inputs to the optimizer solver so simulated builds
 * can be scored & compared against real builds.
 */
export interface SimulationConfig {
  name: string
  discSets: DiscSetKey[] // up to 2 disc sets (2-p or 4-p)
  wengineKey?: string
  mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey>>
  substatRolls: Partial<Record<DiscSubStatKey, number>> // max 54 total rolls
}

const emptyConfig = (): SimulationConfig => ({
  name: '',
  discSets: [],
  mainStats: {},
  substatRolls: {},
})

export const SimulationInputs = memo(function SimulationInputs({
  config,
  onChange,
}: {
  config?: SimulationConfig
  onChange?: (config: SimulationConfig) => void
}) {
  const { t } = useTranslation('page_optimize')
  const [localConfig, setLocalConfig] = useState<SimulationConfig>(
    config ?? emptyConfig()
  )

  const updateConfig = useCallback(
    (patch: Partial<SimulationConfig>) => {
      const next = { ...localConfig, ...patch }
      setLocalConfig(next)
      onChange?.(next)
    },
    [localConfig, onChange]
  )

  const totalRolls = Object.values(localConfig.substatRolls).reduce(
    (sum, v) => sum + (v ?? 0),
    0
  )
  const maxRolls = 54

  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap="xs" p="sm">
          <Text fw={700} size="sm">
            {t('simulation.simulationInputs', 'Simulation Inputs')}
          </Text>

          {/* Name field */}
          <TextInput
            size="xs"
            label={t('simulation.simName', 'Simulation Name')}
            placeholder={t(
              'simulation.namePlaceholder',
              'e.g. High Crit Build'
            )}
            value={localConfig.name}
            onChange={(e) => updateConfig({ name: e.currentTarget.value })}
          />

          {/* Disc Set Selection (up to 2) */}
          <Box>
            <Text size="xs" fw={600} mb={2}>
              {t('simulation.discSets', 'Disc Sets')}
            </Text>
            <Group gap={4}>
              {localConfig.discSets.map((setKey) => (
                <Badge
                  key={setKey}
                  variant="light"
                  color="blue"
                  size="sm"
                  rightSection={
                    <CloseButton
                      size="xs"
                      onMouseDown={() =>
                        updateConfig({
                          discSets: localConfig.discSets.filter(
                            (s) => s !== setKey
                          ),
                        })
                      }
                    />
                  }
                >
                  {setKey}
                </Badge>
              ))}
              {localConfig.discSets.length < 2 && (
                <DiscSetPicker
                  selectedSets={localConfig.discSets}
                  onSelect={(setKey) =>
                    updateConfig({
                      discSets: [...localConfig.discSets, setKey],
                    })
                  }
                />
              )}
            </Group>
          </Box>

          {/* W-Engine select placeholder */}
          <Box>
            <Text size="xs" fw={600} mb={2}>
              {t('simulation.wengine', 'W-Engine')}
            </Text>
            <Button
              size="compact-xs"
              variant="light"
              fullWidth
              leftSection={<IconPlus size={12} />}
              onClick={() => {
                // TODO: Open W-Engine selection modal
                updateConfig({
                  wengineKey: 'DEMO_WENGINE',
                })
              }}
            >
              {localConfig.wengineKey
                ? localConfig.wengineKey
                : t('simulation.selectWengine', 'Select W-Engine')}
            </Button>
          </Box>

          {/* Main Stat Selection (Slots 4, 5, 6) */}
          <Box>
            <Text size="xs" fw={600} mb={2}>
              {t('simulation.mainStats', 'Main Stats (Slots 4/5/6)')}
            </Text>
            {(['4', '5', '6'] as DiscSlotKey[]).map((slotKey) => (
              <Flex key={slotKey} align="center" gap={4} mb={2}>
                <Text size="xs" w={20} c="dimmed">
                  S{slotKey}
                </Text>
                <MainStatSelector
                  slotKey={slotKey}
                  selected={localConfig.mainStats[slotKey]}
                  onSelect={(statKey) =>
                    updateConfig({
                      mainStats: {
                        ...localConfig.mainStats,
                        [slotKey]: statKey,
                      },
                    })
                  }
                />
              </Flex>
            ))}
          </Box>

          {/* Substat Roll Inputs */}
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text size="xs" fw={600}>
                {t('simulation.substatRolls', 'Substat Rolls')}
              </Text>
              <Text size="xs" c={totalRolls > maxRolls ? 'red' : 'dimmed'}>
                {totalRolls}/{maxRolls}
              </Text>
            </Flex>
            <Stack gap={2}>
              {allDiscSubStatKeys.map((key) => {
                const val = localConfig.substatRolls[key] ?? 0
                return (
                  <Flex key={key} align="center" gap={4}>
                    <Text size="xs" style={{ minWidth: 65 }}>
                      <StatDisplay statKey={key} showPercent disableIcon />
                    </Text>
                    <NumberInput
                      size="xs"
                      min={0}
                      max={maxRolls}
                      value={val}
                      onChange={(v) =>
                        updateConfig({
                          substatRolls: {
                            ...localConfig.substatRolls,
                            [key]: Math.min(
                              Math.max(0, Number(v ?? 0)),
                              maxRolls - (totalRolls - val)
                            ),
                          },
                        })
                      }
                      style={{ width: 70 }}
                      hideControls
                    />
                    <Text size="xs" c="dimmed" style={{ minWidth: 20 }}>
                      / {maxRolls}
                    </Text>
                  </Flex>
                )
              })}
            </Stack>
            {totalRolls > maxRolls && (
              <Text size="xs" c="red" mt={2}>
                {t(
                  'simulation.rollsExceeded',
                  'Total rolls exceed maximum of 54'
                )}
              </Text>
            )}
          </Box>
        </Stack>
      </CardSection>
    </CardThemed>
  )
})

/**
 * Inline disc set picker — renders a segmented control of available disc sets.
 *
 * TODO: Replace with a proper modal/autocomplete that shows set icons & descriptions.
 */
function DiscSetPicker({
  selectedSets,
  onSelect,
}: {
  selectedSets: DiscSetKey[]
  onSelect: (key: DiscSetKey) => void
}) {
  const [mode, setMode] = useState<'choose' | 'idle'>('idle')

  if (mode !== 'choose')
    return (
      <ActionIcon size="sm" variant="subtle" onClick={() => setMode('choose')}>
        <IconPlus size={12} />
      </ActionIcon>
    )

  const available = allDiscSetKeys.filter((s) => !selectedSets.includes(s))

  return (
    <Box>
      <Group gap={2}>
        <SegmentedControl
          size="xs"
          data={available.map((k) => ({
            label: k.length > 12 ? k.slice(0, 10) + '…' : k,
            value: k,
          }))}
          onChange={(v) => {
            onSelect(v as DiscSetKey)
            setMode('idle')
          }}
        />
        <ActionIcon size="sm" variant="subtle" onClick={() => setMode('idle')}>
          <IconX size={12} />
        </ActionIcon>
      </Group>
    </Box>
  )
}

/**
 * Inline main stat selector — renders toggle buttons for a given slot.
 */
function MainStatSelector({
  slotKey,
  selected,
  onSelect,
}: {
  slotKey: DiscSlotKey
  selected?: DiscMainStatKey
  onSelect: (key: DiscMainStatKey) => void
}) {
  const validKeys = discSlotToMainStatKeys[slotKey]

  return (
    <Group gap={2}>
      {validKeys.map((key) => (
        <ActionIcon
          key={key}
          size="sm"
          variant={selected === key ? 'filled' : 'outline'}
          color={selected === key ? 'blue' : 'gray'}
          onClick={() => onSelect(key)}
          title={`${statKeyTextMap[key] ?? key}${getUnitStr(key)}`}
        >
          <StatDisplay statKey={key} showPercent disableIcon />
        </ActionIcon>
      ))}
    </Group>
  )
}
