import { Box, Button, Flex, Text } from '@mantine/core'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { allDiscSlotKeys, statKeyTextMap } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { DiscSet2p, DiscSetName } from '../../ui/Disc/DiscTrans'
import { gradeColor } from '../../util'
import type { AnalysisData } from './ExpandedDataPanelController'

const combatStatRows = [
  { key: 'atk', label: 'ATK', isPercent: false },
  { key: 'hp', label: 'HP', isPercent: false },
  { key: 'def', label: 'DEF', isPercent: false },
  { key: 'impact', label: 'Impact', isPercent: false },
  { key: 'critRate', label: 'CRIT Rate', isPercent: true },
  { key: 'critDmg', label: 'CRIT DMG', isPercent: true },
  { key: 'penRatio', label: 'PEN Ratio', isPercent: true },
  { key: 'pen', label: 'PEN', isPercent: false },
  { key: 'dmgBonus', label: 'DMG Bonus', isPercent: true },
  { key: 'anomProf', label: 'Anomaly Prof.', isPercent: false },
  { key: 'anomMas', label: 'Anomaly Mastery', isPercent: false },
  { key: 'enerRegen', label: 'Energy Regen', isPercent: false },
  { key: 'sheerForce', label: 'Sheer Force', isPercent: false },
  { key: 'defIgn', label: 'DEF Ignore', isPercent: true },
] as const

function formatCombatStat(value: number | undefined, isPercent: boolean) {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return isPercent
    ? `${(value * 100).toFixed(1)}%`
    : Math.round(value).toLocaleString()
}

/**
 * Perfect-reference comparison for the selected build. Rendered only when
 * the character has a pinned theoretical reference; otherwise the whole
 * reference feature stays invisible.
 */
export function ReferenceComparison({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { database } = useDatabaseContext()
  const { referenceComparison, characterKey } = analysisData
  if (!referenceComparison) return null
  const {
    ratio,
    grade,
    selectedValue,
    referenceValue,
    date,
    stale,
    tips,
    mainMismatches,
    set4,
    set2,
    wengineKey,
    mainsBySlot,
    perfectRolls,
    combatStats,
  } = referenceComparison

  const rollEntries = Object.entries(perfectRolls ?? {})
    .filter(([, rolls]) => (rolls ?? 0) > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))

  return (
    <CardThemed>
      <Box p="md">
        <Flex align="center" justify="space-between" gap="xs" mb="xs">
          <Text fw={700} size="sm">
            Perfect Reference Comparison
          </Text>
          <Button
            size="xs"
            variant="default"
            onClick={() => database.theoReferences.clearReference(characterKey)}
            title="Remove the pinned theoretical reference for this character"
          >
            Clear reference
          </Button>
        </Flex>
        <Text size="xs" c="dimmed" mb="sm">
          Selected build {Math.floor(selectedValue).toLocaleString()} vs perfect{' '}
          {Math.floor(referenceValue).toLocaleString()} (pinned{' '}
          {new Date(date).toLocaleDateString()}).
        </Text>
        {stale && (
          <Text size="xs" c="orange" mb="sm">
            The pinned reference was created under a different optimization
            target or set filter, so this comparison may be outdated. Re-run
            theoretical max and pin again to refresh it.
          </Text>
        )}
        <Flex align="baseline" gap="xs" mb="sm">
          <Text size="xl" fw={700} style={{ color: gradeColor(grade) }}>
            {(ratio * 100).toFixed(1)}%
          </Text>
          <Text size="sm" c="dimmed">
            of perfect ({grade})
          </Text>
        </Flex>

        <Text size="xs" fw={600} mb={4}>
          Perfect build
        </Text>
        <Flex gap="xs" wrap="wrap" mb="xs">
          {set4 ? (
            <Text size="xs">
              <DiscSetName setKey={set4} /> 4pc
            </Text>
          ) : (
            <Text size="xs" c="dimmed">
              4pc set unknown (pinned before build details were saved — re-pin
              to refresh)
            </Text>
          )}
          {set2 && set2 !== set4 && (
            <Text size="xs">
              <DiscSet2p setKey={set2} /> 2pc
            </Text>
          )}
          {wengineKey && <Text size="xs">W-Engine: {wengineKey}</Text>}
        </Flex>
        {mainsBySlot && Object.keys(mainsBySlot).length > 0 && (
          <Flex gap="xs" wrap="wrap" mb="xs">
            {allDiscSlotKeys.map((slot) => {
              const main = mainsBySlot[slot]
              if (!main) return null
              return (
                <Text key={slot} size="xs" c="dimmed">
                  Slot {slot}: {main}
                </Text>
              )
            })}
          </Flex>
        )}
        {rollEntries.length > 0 && (
          <Flex gap="xs" wrap="wrap" mb="sm">
            {rollEntries.map(([key, rolls]) => (
              <Text key={key} size="xs" c="dimmed">
                {statKeyTextMap[key] ?? key}:{' '}
                {Number.isInteger(rolls ?? 0) ? rolls : (rolls ?? 0).toFixed(1)}{' '}
                rolls
              </Text>
            ))}
          </Flex>
        )}

        {combatStats ? (
          <>
            <Text size="xs" fw={600} mb={4}>
              Perfect in-combat stats
            </Text>
            <Box mb="sm">
              {combatStatRows.map(({ key, label, isPercent }) => (
                <Flex key={key} justify="space-between" gap="xs">
                  <Text size="xs" c="dimmed">
                    {label}
                  </Text>
                  <Text size="xs">
                    {formatCombatStat(combatStats[key], isPercent)}
                  </Text>
                </Flex>
              ))}
            </Box>
          </>
        ) : (
          <Text size="xs" c="dimmed" mb="sm">
            No in-combat snapshot for this reference — re-pin to capture one.
          </Text>
        )}

        {tips.length === 0 && mainMismatches.length === 0 ? (
          <Text size="xs" c="dimmed">
            Matches the pinned reference build — no substat gaps.
          </Text>
        ) : (
          <>
            {tips.length > 0 && (
              <>
                <Text size="xs" fw={600} mb={4}>
                  Farming tips
                </Text>
                {tips.map((tip) => (
                  <Text key={tip.key} size="xs" mb={2}>
                    Get more {tip.label} substats (+{tip.deficit} roll
                    {tip.deficit !== 1 ? 's' : ''} vs perfect — you have{' '}
                    {tip.localRolls}, perfect averages{' '}
                    {Number.isInteger(tip.perfectRolls)
                      ? tip.perfectRolls
                      : tip.perfectRolls.toFixed(1)}
                    ).
                  </Text>
                ))}
              </>
            )}
            {mainMismatches.length > 0 && (
              <>
                <Text size="xs" fw={600} mt="xs" mb={4}>
                  Main stat mismatches
                </Text>
                {mainMismatches.map((m) => (
                  <Text key={m.slot} size="xs" mb={2}>
                    Slot {m.slot}: yours is {m.localMain} — perfect uses{' '}
                    {m.perfectMain}.
                  </Text>
                ))}
              </>
            )}
          </>
        )}
      </Box>
    </CardThemed>
  )
}
