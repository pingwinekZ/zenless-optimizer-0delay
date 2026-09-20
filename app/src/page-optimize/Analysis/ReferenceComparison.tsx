import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Progress,
  RingProgress,
  Text,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconTrophy,
} from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { discDefIcon, wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { allDiscSlotKeys, statKeyTextMap } from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { StatIcon } from '@zenless-optimizer/zzz/svgicons'
import { DiscSetName } from '@zenless-optimizer/zzz/ui/Disc/DiscTrans'
import { gradeColor } from '@zenless-optimizer/zzz/util'
import type { AnalysisData } from './ExpandedDataPanelController'

const GOLD = '#fcc419'

// Flat stats share their label with the % variant in statKeyTextMap
// (HP vs HP%), so disambiguate the percent ones explicitly.
const percentSuffixedKeys = new Set(['hp_', 'atk_', 'def_'])

function statLabel(key: string): string {
  const base = statKeyTextMap[key] ?? key
  return percentSuffixedKeys.has(key) ? `${base} %` : base
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size="xs"
      fw={700}
      c="dimmed"
      mb="xs"
      style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
    >
      {children}
    </Text>
  )
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
    localRolls,
    localMains,
  } = referenceComparison

  const substatKeys = [
    ...new Set([
      ...Object.keys(localRolls ?? {}),
      ...Object.keys(perfectRolls ?? {}),
    ]),
  ]
    .filter(
      (key) => (localRolls?.[key] ?? 0) > 0 || (perfectRolls?.[key] ?? 0) > 0
    )
    .sort(
      (a, b) =>
        (perfectRolls?.[b] ?? 0) - (perfectRolls?.[a] ?? 0) ||
        (localRolls?.[b] ?? 0) - (localRolls?.[a] ?? 0)
    )
  const gradeHex = gradeColor(grade)
  const pct = Math.max(0, Math.min(100, ratio * 100))
  const wengineImg = wengineKey
    ? wengineAsset(wengineKey as WengineKey)
    : undefined
  const allMatch = tips.length === 0 && mainMismatches.length === 0

  return (
    <CardThemed>
      <Box p="md">
        <Flex align="center" justify="space-between" gap="xs" mb="xs">
          <Flex align="center" gap="xs" style={{ minWidth: 0 }}>
            <IconTrophy size={16} style={{ color: GOLD, flexShrink: 0 }} />
            <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap' }}>
              Perfect Reference
            </Text>
            <Badge size="xs" variant="light" style={{ color: gradeHex }}>
              {grade}
            </Badge>
          </Flex>
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => database.theoReferences.clearReference(characterKey)}
            title="Remove the pinned theoretical reference for this character"
          >
            Clear
          </Button>
        </Flex>

        {stale && (
          <Alert
            color="orange"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
            mb="sm"
          >
            <Text size="xs">
              Pinned under a different target or set filter — re-run theoretical
              max and pin again to refresh it.
            </Text>
          </Alert>
        )}

        {/* Score hero */}
        <Flex align="center" gap="sm" mb="xs">
          <RingProgress
            size={72}
            thickness={8}
            roundCaps
            sections={[{ value: pct, color: gradeHex }]}
            label={
              <Text size="sm" fw={800} ta="center" style={{ color: gradeHex }}>
                {pct.toFixed(0)}%
              </Text>
            }
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              {Math.floor(selectedValue).toLocaleString()} vs{' '}
              <Text span fw={700} style={{ color: GOLD }}>
                {Math.floor(referenceValue).toLocaleString()}
              </Text>
            </Text>
            <Progress value={pct} size="sm" color={gradeHex} mt={4} />
            <Text size="xs" c="dimmed" mt={4}>
              Pinned {new Date(date).toLocaleDateString()}
            </Text>
          </Box>
        </Flex>

        <Divider my="sm" />

        {/* Perfect build gear */}
        <SectionTitle>Perfect build</SectionTitle>
        <Flex direction="column" gap="xs" mb="sm">
          {set4 ? (
            <Flex
              align="center"
              gap="xs"
              p="xs"
              style={{
                borderRadius: 8,
                backgroundColor: 'var(--layer-2)',
              }}
            >
              <Box
                component="img"
                src={discDefIcon(set4)}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={700}>
                  <DiscSetName setKey={set4} />
                </Text>
                <Text size="xs" c="dimmed">
                  4-piece set
                </Text>
              </Box>
              <Badge size="sm" variant="light" color="yellow">
                4PC
              </Badge>
            </Flex>
          ) : (
            <Text size="xs" c="dimmed">
              Set unknown (pinned before build details were saved — re-pin to
              refresh)
            </Text>
          )}
          {set2 && set2 !== set4 && (
            <Flex
              align="center"
              gap="xs"
              p="xs"
              style={{
                borderRadius: 8,
                backgroundColor: 'var(--layer-2)',
              }}
            >
              <Box
                component="img"
                src={discDefIcon(set2)}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={700}>
                  <DiscSetName setKey={set2} />
                </Text>
                <Text size="xs" c="dimmed">
                  2-piece set
                </Text>
              </Box>
              <Badge size="sm" variant="light" color="grape">
                2PC
              </Badge>
            </Flex>
          )}
          {wengineImg && (
            <Flex
              align="center"
              gap="xs"
              p="xs"
              style={{
                borderRadius: 8,
                backgroundColor: 'var(--layer-2)',
              }}
            >
              <Box
                component="img"
                src={wengineImg}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  objectFit: 'contain',
                  flexShrink: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" fw={700}>
                  {wengineKey}
                </Text>
                <Text size="xs" c="dimmed">
                  W-Engine
                </Text>
              </Box>
            </Flex>
          )}
        </Flex>

        {/* Main stat comparison: yours vs perfect per slot */}
        <SectionTitle>Main stats — yours vs perfect</SectionTitle>
        <Flex direction="column" gap={4} mb="sm">
          {allDiscSlotKeys.map((slot) => {
            const local = localMains?.[slot]
            const perfect = mainsBySlot?.[slot]
            if (!local && !perfect) return null
            const match = !!local && local === perfect
            return (
              <Flex
                key={slot}
                align="center"
                gap="xs"
                px="xs"
                py={4}
                style={{
                  borderRadius: 8,
                  backgroundColor: 'var(--layer-2)',
                }}
              >
                <Badge
                  size="sm"
                  variant={match ? 'light' : 'filled'}
                  color={match ? 'gray' : 'red'}
                >
                  {slot}
                </Badge>
                {local ? (
                  <Tooltip label={`Your slot ${slot}`} openDelay={400}>
                    <Flex align="center" gap={4}>
                      <StatIcon
                        statKey={local}
                        iconProps={{
                          style: { fontSize: 17, opacity: match ? 1 : 0.45 },
                        }}
                      />
                      <Text
                        size="xs"
                        fw={match ? 600 : undefined}
                        c={match ? undefined : 'dimmed'}
                        style={
                          match ? undefined : { textDecoration: 'line-through' }
                        }
                      >
                        {statLabel(local)}
                      </Text>
                    </Flex>
                  </Tooltip>
                ) : (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                )}
                {match ? (
                  <IconCheck
                    size={14}
                    style={{ color: '#38d9a9', marginLeft: 'auto' }}
                  />
                ) : (
                  <>
                    <IconArrowRight
                      size={13}
                      style={{ color: GOLD, flexShrink: 0 }}
                    />
                    {perfect && (
                      <Tooltip label="Perfect main stat" openDelay={400}>
                        <Flex align="center" gap={4}>
                          <StatIcon
                            statKey={perfect}
                            iconProps={{ style: { fontSize: 17 } }}
                          />
                          <Text size="xs" fw={700} c="green">
                            {statLabel(perfect)}
                          </Text>
                        </Flex>
                      </Tooltip>
                    )}
                  </>
                )}
              </Flex>
            )
          })}
        </Flex>

        {/* Substat comparison: yours vs perfect */}
        <SectionTitle>Substats — yours vs perfect</SectionTitle>
        {substatKeys.length > 0 ? (
          <Flex direction="column" gap={4}>
            {substatKeys.map((key) => {
              const local = localRolls?.[key] ?? 0
              const perfect = perfectRolls?.[key] ?? 0
              const deficit = Math.max(0, perfect - local)
              // Over-invested rolls aren't good — they ate budget perfect
              // spends elsewhere. Mark them neutral, never with a check.
              const excess = Math.max(0, local - perfect)
              const fill =
                perfect > 0
                  ? Math.max(0, Math.min(100, (local / perfect) * 100))
                  : 100
              return (
                <Flex
                  key={key}
                  align="center"
                  gap="xs"
                  p="xs"
                  style={{
                    borderRadius: 8,
                    backgroundColor: 'var(--layer-2)',
                  }}
                >
                  <StatIcon
                    statKey={key}
                    iconProps={{ style: { fontSize: 18 } }}
                  />
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap="xs">
                      <Text size="xs" fw={700}>
                        {statLabel(key)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {local} →{' '}
                        <Text span fw={700} style={{ color: GOLD }}>
                          {perfect}
                        </Text>
                      </Text>
                    </Flex>
                    <Progress
                      value={fill}
                      size="xs"
                      color={
                        deficit > 0 ? 'teal' : excess > 0 ? 'gray' : 'green'
                      }
                      mt={4}
                    />
                  </Box>
                  {deficit > 0 ? (
                    <Badge size="sm" variant="light" color="teal">
                      +{deficit}
                    </Badge>
                  ) : excess > 0 ? (
                    <Badge size="sm" variant="light" color="gray">
                      +{excess} over
                    </Badge>
                  ) : (
                    <IconCheck size={14} style={{ color: '#38d9a9' }} />
                  )}
                </Flex>
              )
            })}
          </Flex>
        ) : (
          <Text size="xs" c="dimmed">
            {allMatch
              ? 'Matches the pinned reference build — nothing left to farm.'
              : 'No substat data for this comparison.'}
          </Text>
        )}
      </Box>
    </CardThemed>
  )
}
