import { Flex, Select, Switch, Text } from '@mantine/core'
import {
  OptConfigContext,
  useDatabaseContext,
} from '@zenless-optimizer/zzz/db-ui'
import { useCallback, useContext } from 'react'
import { HeaderText } from '../layout'

/**
 * The "Optimizer options" card: equipped-discs / priority switches, the
 * theoretical-max toggle with its recipe-space heuristics, min-enhance level,
 * and the passives toggles. Verbatim move from `OptimizerForm`.
 */
export function OptimizerOptionsSection({
  disabled,
  showCharPassives,
  setShowCharPassives,
  showWenginePassives,
  setShowWenginePassives,
  useTheoreticalMax,
  setUseTheoreticalMax,
}: {
  disabled?: boolean
  showCharPassives: boolean
  setShowCharPassives: (v: boolean) => void
  showWenginePassives: boolean
  setShowWenginePassives: (v: boolean) => void
  useTheoreticalMax: boolean
  setUseTheoreticalMax: (v: boolean) => void
}) {
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const { database } = useDatabaseContext()

  const setOption = useCallback(
    <K extends keyof typeof optConfig>(
      field: K,
      value: (typeof optConfig)[K]
    ) => {
      database.optConfigs.set(optConfigId, { [field]: value })
    },
    [database, optConfigId]
  )

  const minEnhanceOptions = [
    { value: '0', label: '+0' },
    { value: '3', label: '+3' },
    { value: '6', label: '+6' },
    { value: '9', label: '+9' },
    { value: '12', label: '+12' },
    { value: '15', label: '+15' },
  ]

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Optimizer options</HeaderText>

      <Flex align="center" gap={5}>
        <Switch
          checked={!!optConfig.useEquipped}
          onChange={(e) => setOption('useEquipped', e.currentTarget.checked)}
          disabled={disabled}
          size="xs"
        />
        <Text size="xs">Use Equipped Discs</Text>
      </Flex>

      {optConfig.useEquipped && (
        <Flex align="center" gap={5}>
          <Switch
            checked={!!optConfig.useCharacterPriority}
            onChange={(e) =>
              setOption('useCharacterPriority', e.currentTarget.checked)
            }
            disabled={disabled}
            size="xs"
          />
          <Text size="xs">Use Character Priority</Text>
        </Flex>
      )}

      <Flex align="center" gap={5}>
        <Switch
          checked={useTheoreticalMax}
          onChange={(e) => setUseTheoreticalMax(e.currentTarget.checked)}
          disabled={disabled}
          size="xs"
        />
        <Text size="xs">Theoretical Max Discs</Text>
      </Flex>

      {useTheoreticalMax && (
        <>
          <Text size="xs" c="orange" style={{ lineHeight: 1.3 }}>
            Select exactly 1 four-piece and 1 two-piece set in Disc Set Filter.
            Real discs are ignored — perfect S-rank +15 discs are generated from
            the character's effective stats.
          </Text>
          {/* Recipe-space heuristics. The defaults reproduce the historical
              recipe set exactly; loosening them only adds recipes (a slower,
              wider search), it never drops builds from the results. */}
          <Flex align="center" gap={5}>
            <Text size="xs">Min effective substats</Text>
            <Select
              data={[
                { value: '3', label: '3 (default)' },
                { value: '2', label: '2 (more recipes)' },
                { value: '4', label: '4 (fewer recipes)' },
              ]}
              value={String(optConfig.theoreticalMinEffectivePerCombo ?? 3)}
              onChange={(val) => {
                if (val == null) return
                setOption('theoreticalMinEffectivePerCombo', Number(val))
              }}
              size="xs"
              disabled={disabled}
              style={{ width: 140 }}
            />
          </Flex>
          <Flex align="center" gap={5}>
            <Switch
              checked={optConfig.theoreticalApplyDominanceFilter ?? true}
              onChange={(e) =>
                setOption(
                  'theoreticalApplyDominanceFilter',
                  e.currentTarget.checked
                )
              }
              disabled={disabled}
              size="xs"
            />
            <Text size="xs">Skip dominated distributions</Text>
          </Flex>
        </>
      )}

      <Flex align="center" gap={5}>
        <Text size="xs">Min enhance</Text>
        <Select
          data={minEnhanceOptions}
          value={String(optConfig.levelLow)}
          onChange={(val) => {
            if (val == null) return
            const v = Number(val)
            setOption('levelLow', v)
            if (optConfig.levelHigh < v) setOption('levelHigh', v)
          }}
          size="xs"
          disabled={disabled}
          style={{ width: 70 }}
        />
      </Flex>

      <Flex align="center" gap={5}>
        <Switch
          checked={showCharPassives}
          onChange={(e) => setShowCharPassives(e.currentTarget.checked)}
          size="xs"
        />
        <Text size="xs">Show character passives</Text>
      </Flex>

      <Flex align="center" gap={5}>
        <Switch
          checked={showWenginePassives}
          onChange={(e) => setShowWenginePassives(e.currentTarget.checked)}
          size="xs"
        />
        <Text size="xs">Show w-engine passives</Text>
      </Flex>
    </Flex>
  )
}
