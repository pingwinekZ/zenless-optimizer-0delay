import { Box, Flex, Text } from '@mantine/core'
import { IconMedal } from '@tabler/icons-react'
import { type CSSProperties, useMemo } from 'react'
import { characterAsset, discDefIcon } from '../../assets'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  discMaxLevel,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '../../consts'
import type { ICachedDisc } from '../../db'
import { computeCurrentScore } from '../../page-discs/scoring/currentScore'
import { computeMaxPotential } from '../../page-discs/scoring/potentialScore'
import { StatIcon } from '../../svgicons'
import { efficiencyToGrade, gradeColor } from '../../util'
import {
  showcaseShadow,
  showcaseShadowInsetAddition,
  showcaseTransition,
} from '../CharacterPreviewComponents'
import { defaultGap, discCardH, parentW, separatorColor } from '../constantsUi'

const LEFT_SLOTS: DiscSlotKey[] = ['1', '2', '3']
const RIGHT_SLOTS: DiscSlotKey[] = ['6', '5', '4']

export function ShowcaseDiscPanel({
  discs,
  onSlotClick,
  effectiveStats,
  substatWeights,
  effectiveMainStats,
}: {
  discs: Record<DiscSlotKey, ICachedDisc | undefined>
  onSlotClick?: (slot: DiscSlotKey) => void
  effectiveStats: DiscSubStatKey[]
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
  effectiveMainStats?: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}) {
  return (
    <Box
      style={{
        display: 'flex',
        gap: defaultGap,
        zIndex: 1,
        flex: 2,
        minWidth: parentW,
      }}
    >
      <DiscColumn
        slots={LEFT_SLOTS}
        discs={discs}
        onSlotClick={onSlotClick}
        effectiveStats={effectiveStats}
        substatWeights={substatWeights}
        effectiveMainStats={effectiveMainStats}
      />
      <DiscColumn
        slots={RIGHT_SLOTS}
        discs={discs}
        onSlotClick={onSlotClick}
        effectiveStats={effectiveStats}
        substatWeights={substatWeights}
        effectiveMainStats={effectiveMainStats}
      />
    </Box>
  )
}

function DiscColumn({
  slots,
  discs,
  onSlotClick,
  effectiveStats,
  substatWeights,
  effectiveMainStats,
}: {
  slots: DiscSlotKey[]
  discs: Record<DiscSlotKey, ICachedDisc | undefined>
  onSlotClick?: (slot: DiscSlotKey) => void
  effectiveStats: DiscSubStatKey[]
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
  effectiveMainStats?: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}) {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: defaultGap,
        flex: 1,
      }}
    >
      {slots.map((slot) => {
        const disc = discs[slot]
        return (
          <ShowcaseDiscCard
            key={slot}
            slot={slot}
            disc={disc}
            onClick={() => onSlotClick?.(slot)}
            effectiveStats={effectiveStats}
            substatWeights={substatWeights}
            effectiveMainStats={effectiveMainStats}
          />
        )
      })}
    </Box>
  )
}

export function ShowcaseDiscCard({
  slot,
  disc,
  onClick,
  effectiveStats,
  substatWeights,
  effectiveMainStats,
  style,
}: {
  slot: DiscSlotKey
  disc: ICachedDisc | undefined
  onClick?: () => void
  effectiveStats: DiscSubStatKey[]
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
  effectiveMainStats?: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
  style?: CSSProperties
}) {
  const discScore = useMemo(() => {
    if (!disc)
      return {
        grade: '',
        efficiency: 0,
        maxPotential: 0,
        maxGrade: '',
      }
    const efficiency = computeCurrentScore(disc, effectiveStats, substatWeights)
    const maxPotential = computeMaxPotential(
      disc,
      effectiveStats,
      substatWeights ?? {}
    )
    return {
      efficiency,
      grade: efficiencyToGrade(efficiency),
      maxPotential,
      maxGrade: efficiencyToGrade(maxPotential),
    }
  }, [disc, effectiveStats, substatWeights])

  if (!disc) {
    return (
      <Box
        onClick={() => onClick?.()}
        style={{
          position: 'relative',
          width: '100%',
          height: discCardH,
          padding: 12,
          backgroundColor: 'var(--showcase-card-bg-bridge-high)',
          border: '1px solid var(--showcase-card-edge-medium)',
          backgroundClip: 'padding-box',
          boxSizing: 'border-box',
          transition: showcaseTransition,
          borderRadius: 6,
          boxShadow: showcaseShadow + showcaseShadowInsetAddition,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onClick ? 'pointer' : undefined,
          ...style,
        }}
      >
        <Flex justify="space-between" align="center">
          <Box style={{ width: 50, height: 50, flexShrink: 0 }} />
          <Flex gap={8} align="center">
            <Text style={{ fontSize: 13, lineHeight: '22px' }}></Text>
          </Flex>
          <Box
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
        </Flex>

        <Box
          style={{
            margin: '6px 0',
            borderBottom: `1px solid ${separatorColor}`,
          }}
        />

        <Flex justify="space-between" align="center" style={{ height: 22 }}>
          <Box style={{ width: 22, height: 22 }} />
        </Flex>

        <Box
          style={{
            margin: '6px 0',
            borderBottom: `1px solid ${separatorColor}`,
          }}
        />

        <Box style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3].map((i) => (
            <Flex
              key={i}
              justify="space-between"
              align="center"
              style={{ height: 22 }}
            />
          ))}
        </Box>

        <Box
          style={{
            margin: '6px 0',
            borderBottom: `1px solid ${separatorColor}`,
          }}
        />

        <Flex justify="space-between" align="center">
          <Flex gap={0} align="center">
            <Box style={{ width: 22, height: 22 }} />
            <Text style={{ fontSize: 13, lineHeight: '22px' }}></Text>
          </Flex>
          <Text style={{ fontSize: 13, lineHeight: '22px' }}></Text>
        </Flex>
      </Box>
    )
  }

  const GRADES: Record<string, string> = {
    S: '#efb679',
    A: '#cc52f1',
  }

  return (
    <Box
      onClick={() => onClick?.()}
      style={{
        position: 'relative',
        width: '100%',
        height: discCardH,
        padding: 12,
        backgroundColor: 'var(--showcase-card-bg-bridge-high)',
        border: '1px solid var(--showcase-card-edge-medium)',
        backgroundClip: 'padding-box',
        boxSizing: 'border-box',
        transition: showcaseTransition,
        borderRadius: 6,
        boxShadow: showcaseShadow + showcaseShadowInsetAddition,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* Top row: set icon | rarity + level */}
      <Flex justify="space-between" align="center">
        <Box
          component="img"
          src={discDefIcon(disc.setKey as any)}
          alt=""
          style={{
            width: 50,
            height: 50,
            borderRadius: 4,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
        <Flex gap={8} align="center">
          <Box
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: GRADES[disc.rarity] ?? '#bdbdbd',
              display: 'inline-block',
            }}
          />
          <Text style={{ fontSize: 13, lineHeight: '22px' }}>
            +{disc.level}
          </Text>
        </Flex>
        {disc.location ? (
          <Box
            component="img"
            src={characterAsset(disc.location as CharacterKey, 'circle')}
            alt=""
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid rgba(150, 150, 150, 0.25)',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
        )}
      </Flex>

      {/* Divider */}
      <Box
        style={{
          margin: '6px 0',
          borderBottom: `1px solid ${separatorColor}`,
        }}
      />

      {/* Main stat row */}
      {(() => {
        const effectiveMainKeys =
          effectiveMainStats?.[slot as DiscSlotKey] ?? []
        const isMainEffective = (effectiveMainKeys as string[]).includes(
          disc.mainStatKey
        )
        const mainStatColor = isMainEffective ? '#FFA54C' : '#fff'
        return (
          <Flex justify="space-between" align="center">
            <Flex gap={0} align="center" style={{ minWidth: 0 }}>
              <Flex style={{ marginLeft: -3, marginRight: 2 }} align="center">
                <StatIcon
                  statKey={disc.mainStatKey}
                  iconProps={{ style: { fontSize: 22, fill: mainStatColor } }}
                />
              </Flex>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: '22px',
                  color: isMainEffective ? '#FFA54C' : undefined,
                  textShadow: isMainEffective
                    ? '0 1px 4px rgba(0, 0, 0, 0.9)'
                    : undefined,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {statKeyTextMap[
                  disc.mainStatKey as keyof typeof statKeyTextMap
                ] ?? disc.mainStatKey}
              </Text>
            </Flex>
            <Text
              style={{
                fontSize: 13,
                lineHeight: '22px',
                color: isMainEffective ? '#FFA54C' : undefined,
                textShadow: isMainEffective
                  ? '0 1px 4px rgba(0, 0, 0, 0.9)'
                  : undefined,
              }}
            >
              {formatStatValue(
                disc.mainStatKey,
                getDiscMainStatValueAtLevel(disc)
              )}
            </Text>
          </Flex>
        )
      })()}

      {/* Divider */}
      <Box
        style={{
          margin: '6px 0',
          borderBottom: `1px solid ${separatorColor}`,
        }}
      />

      {/* Sub stat rows — always 4 rows like HSR (fillers keep cards uniform) */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {disc.substats.slice(0, 4).map((sub, i) => {
          if (!sub.key) return null
          const isEffective = effectiveStats.includes(sub.key as DiscSubStatKey)
          const statColor = isEffective
            ? '#FFA54C'
            : 'rgba(255, 255, 255, 0.75)'
          const statTextShadow = '0 1px 4px rgba(0, 0, 0, 0.9)'
          return (
            <Flex key={i} justify="space-between" align="center">
              <Flex gap={0} align="center" style={{ minWidth: 0 }}>
                <Flex style={{ marginLeft: -3, marginRight: 2 }} align="center">
                  <StatIcon
                    statKey={sub.key}
                    iconProps={{
                      style: {
                        fontSize: 22,
                        fill: statColor,
                      },
                    }}
                  />
                </Flex>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: '22px',
                    color: statColor,
                    textShadow: statTextShadow,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {statKeyTextMap[sub.key as keyof typeof statKeyTextMap] ??
                    sub.key}
                </Text>
              </Flex>
              <Flex
                align="center"
                justify="space-between"
                style={{ width: '37%' }}
              >
                <Flex align="center" style={{ color: statColor }}>
                  {<RollChevrons count={sub.upgrades - 1} />}
                </Flex>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: '22px',
                    color: statColor,
                    textShadow: statTextShadow,
                  }}
                >
                  {formatStatValue(
                    sub.key,
                    getDiscSubStatValue(sub, disc.rarity)
                  )}
                </Text>
              </Flex>
            </Flex>
          )
        })}
        {Array.from({
          length: Math.max(
            0,
            4 - disc.substats.filter((sub) => sub.key).length
          ),
        }).map((_, i) => (
          <Flex
            key={`filler-${i}`}
            justify="space-between"
            align="center"
            style={{ height: 22 }}
          />
        ))}
      </Box>
      {/* Divider */}
      <Box
        style={{
          margin: '6px 0',
          borderBottom: `1px solid ${separatorColor}`,
        }}
      />

      {/* Score footer: current vs max-potential, same as the discs tab.
          Max potential is hidden at max level — no rolls remain, so it
          would just duplicate the current score. */}
      <Flex direction="column" gap={2}>
        <Flex justify="space-between" align="center">
          <Flex gap={0} align="center">
            <Flex style={{ marginLeft: -3, marginRight: 2 }} align="center">
              <IconMedal
                size={22}
                style={{ color: gradeColor(discScore.grade) }}
              />
            </Flex>
            <Text
              style={{
                fontSize: 13,
                lineHeight: '22px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
              }}
            >
              Score
            </Text>
          </Flex>
          <Text
            style={{
              fontSize: 13,
              lineHeight: '22px',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
            }}
            title="Current substat efficiency"
          >
            {(discScore.efficiency * 100).toFixed(1)} ({discScore.grade})
          </Text>
        </Flex>
        {disc.level < discMaxLevel[disc.rarity] && (
          <Flex justify="space-between" align="center">
            <Text
              style={{
                fontSize: 11,
                lineHeight: '18px',
                color: 'rgba(255, 255, 255, 0.6)',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
              }}
            >
              Max potential
            </Text>
            <Text
              style={{
                fontSize: 11,
                lineHeight: '18px',
                color: gradeColor(discScore.maxGrade),
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
              }}
              title="Best score with remaining rolls"
            >
              {(discScore.maxPotential * 100).toFixed(1)} ({discScore.maxGrade})
            </Text>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

function formatStatValue(statKey: string, value: number): string {
  if (
    statKey.endsWith('_') ||
    statKey === 'crit_' ||
    statKey === 'crit_dmg_' ||
    statKey === 'pen_' ||
    statKey === 'dmg_'
  ) {
    return `${(value * 100).toFixed(1)}%`
  }
  if (value >= 1000) return value.toFixed(0)
  if (value >= 10) return parseFloat(value.toFixed(1)).toString()
  return parseFloat(value.toFixed(2)).toString()
}

function getDiscMainStatValueAtLevel(disc: ICachedDisc): number {
  const { mainStatKey, rarity, level } = disc
  return getDiscMainStatVal(rarity, mainStatKey, level)
}

function getDiscSubStatValue(
  sub: { key: string; upgrades: number },
  rarity: DiscRarityKey
): number {
  return (
    getDiscSubStatBaseVal(
      sub.key as Parameters<typeof getDiscSubStatBaseVal>[0],
      rarity
    ) * sub.upgrades
  )
}

// Roll chevrons marking substat enhancement procs after the initial roll
// (mirrors HSR's RelicStatRow indicators). One chevron per proc, max 5,
// packed at a tight 5px advance like HSR's precomputed sprites.
function RollChevrons({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 0), 5)
  if (!n) return null
  const width = 5 * n + 1
  return (
    <svg
      width={width}
      height={10}
      viewBox={`0 0 ${width} 10`}
      style={{ display: 'block', opacity: 0.75 }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <path
          key={i}
          d={`M${5 * i + 1.5} 1.5 L${5 * i + 5} 5 L${5 * i + 1.5} 8.5`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
