import {
  Alert,
  Badge,
  Box,
  Button,
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
} from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { discDefIcon, wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { WengineKey } from '@zenless-optimizer/zzz/consts'
import { allDiscSlotKeys, statKeyTextMap } from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { StatIcon } from '@zenless-optimizer/zzz/svgicons'
import { DiscSetName } from '@zenless-optimizer/zzz/ui/Disc/DiscTrans'
import { gradeColor, gradeDisplay } from '@zenless-optimizer/zzz/util'
import { useTranslation } from 'react-i18next'
import type { AnalysisData } from './ExpandedDataPanelController'

/**
 * Inner row background. The card itself is `var(--layer-2)`, so rows reuse the
 * upgrade-table tint (`rgba(0, 0, 0, 0.2)`) instead of disappearing into it.
 */
const ROW_BG = 'rgba(0, 0, 0, 0.2)'

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
 * Perfect-reference comparison for the selected build. Always rendered: with
 * no pinned reference it shows how to pin one, so the card never pops the
 * layout in and out.
 */
export function ReferenceComparison({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { t } = useTranslation('page_optimize', { keyPrefix: 'analysis' })
  const { database } = useDatabaseContext()
  const { referenceComparison, characterKey } = analysisData
  if (!referenceComparison)
    return (
      <CardThemed>
        <Box p="md">
          <Text fw={700} size="sm">
            {t('reference.title', 'Perfect Reference')}
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            {t(
              'reference.hint',
              'Selected build vs your pinned theoretical best.'
            )}
          </Text>
          <Text size="xs" c="dimmed">
            {t(
              'reference.empty',
              'No pinned reference for this character yet — run a theoretical optimization, select a theoretical build, and choose Pin as reference.'
            )}
          </Text>
        </Box>
      </CardThemed>
    )
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
        <Flex align="center" justify="space-between" gap="xs">
          <Flex align="center" gap="xs" style={{ minWidth: 0 }}>
            <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap' }}>
              {t('reference.title', 'Perfect Reference')}
            </Text>
            <Badge size="xs" variant="light" style={{ color: gradeHex }}>
              {gradeDisplay(grade)}
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
        <Text size="xs" c="dimmed" mb="sm">
          {t(
            'reference.hint',
            'Selected build vs your pinned theoretical best.'
          )}
        </Text>

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

        {/* Score + gear | mains | substats, side by side. */}
        <Flex gap="md" align="flex-start" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 220 }}>
            {/* Score hero */}
            <SectionTitle>Score</SectionTitle>
            <Flex align="center" gap="sm" mb="xs">
              <RingProgress
                size={72}
                thickness={8}
                roundCaps
                sections={[{ value: pct, color: gradeHex }]}
                label={
                  <Text
                    size="sm"
                    fw={800}
                    ta="center"
                    style={{ color: gradeHex }}
                  >
                    {pct.toFixed(0)}%
                  </Text>
                }
              />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed">
                  {Math.floor(selectedValue).toLocaleString()} vs{' '}
                  <Text span fw={700}>
                    {Math.floor(referenceValue).toLocaleString()}
                  </Text>
                </Text>
                <Progress value={pct} size="sm" color={gradeHex} mt={4} />
                <Text size="xs" c="dimmed" mt={4}>
                  Pinned {new Date(date).toLocaleDateString()}
                </Text>
              </Box>
            </Flex>
          </Box>
          <Box style={{ flex: 1, minWidth: 220 }}>
            {/* Perfect build gear */}
            <SectionTitle>Perfect build</SectionTitle>
            <Flex direction="column" gap="xs" mb="sm">
              {set4 ? (
                <Flex
                  align="center"
                  gap="xs"
                  p="xs"
                  style={{
                    borderRadius: 6,
                    backgroundColor: ROW_BG,
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
                  Set unknown (pinned before build details were saved — re-pin
                  to refresh)
                </Text>
              )}
              {set2 && set2 !== set4 && (
                <Flex
                  align="center"
                  gap="xs"
                  p="xs"
                  style={{
                    borderRadius: 6,
                    backgroundColor: ROW_BG,
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
                    borderRadius: 6,
                    backgroundColor: ROW_BG,
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
          </Box>
          <Box style={{ flex: 1, minWidth: 220 }}>
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
                      borderRadius: 6,
                      backgroundColor: ROW_BG,
                    }}
                  >
                    <Badge
                      size="sm"
                      variant="light"
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
                              style: {
                                fontSize: 17,
                                opacity: match ? 1 : 0.45,
                              },
                            }}
                          />
                          <Text
                            size="xs"
                            fw={match ? 600 : undefined}
                            c={match ? undefined : 'dimmed'}
                            style={
                              match
                                ? undefined
                                : { textDecoration: 'line-through' }
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
                          style={{ flexShrink: 0 }}
                          color="var(--mantine-color-dimmed)"
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
          </Box>
          <Box style={{ flex: 1, minWidth: 220 }}>
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
                        borderRadius: 6,
                        backgroundColor: ROW_BG,
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
                            <Text span fw={700}>
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
        </Flex>
      </Box>
    </CardThemed>
  )
}
