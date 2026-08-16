import { Box, Flex, Text } from '@mantine/core'
import { useMemo } from 'react'
import { characterAsset, discDefIcon } from '../../assets'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '../../consts'
import type { ICachedDisc } from '../../db'
import { StatIcon } from '../../svgicons'
import { calculateDiscScore, gradeColor } from '../../util'
import {
  ShadowRings,
  showcaseShadow,
  showcaseShadowInsetAddition,
  showcaseTransition,
} from '../CharacterPreviewComponents'
import { defaultGap, discCardH, discCardW, parentW } from '../constantsUi'

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
        width: parentW,
        flexShrink: 0,
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
}: {
  slot: DiscSlotKey
  disc: ICachedDisc | undefined
  onClick?: () => void
  effectiveStats: DiscSubStatKey[]
  substatWeights?: Partial<Record<DiscSubStatKey, number>>
  effectiveMainStats?: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}) {
  const discScore = useMemo(
    () =>
      disc
        ? calculateDiscScore(disc, effectiveStats, substatWeights)
        : { grade: '', efficiency: 0, effectiveRolls: 0, totalRolls: 0 },
    [disc, effectiveStats, substatWeights]
  )

  if (!disc) {
    return (
      <Box
        onClick={() => onClick?.()}
        style={{
          position: 'relative',
          width: discCardW,
          height: discCardH,
          padding: 12,
          backgroundColor: 'var(--showcase-card-bg)',
          border: '1px solid var(--showcase-card-border)',
          transition: showcaseTransition,
          borderRadius: 6,
          boxShadow: showcaseShadow + showcaseShadowInsetAddition,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          cursor: onClick ? 'pointer' : undefined,
        }}
      >
        <ShadowRings />
        <Text
          style={{
            fontSize: 13,
            lineHeight: '22px',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
          }}
          c="dimmed"
          opacity={0.7}
        >
          Slot {slot}
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: '22px',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
          }}
          c="dimmed"
          opacity={0.5}
        >
          Empty
        </Text>
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
        width: discCardW,
        height: discCardH,
        padding: 12,
        backgroundColor: 'var(--showcase-card-bg)',
        border: '1px solid var(--showcase-card-border)',
        transition: showcaseTransition,
        borderRadius: 6,
        boxShadow: showcaseShadow + showcaseShadowInsetAddition,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <ShadowRings />
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
        {disc.location && (
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
            }}
          />
        )}
      </Flex>

      {/* Divider */}
      <Box
        style={{
          margin: '6px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
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
            <Flex gap={0} align="center">
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
        }}
      />

      {/* Sub stat rows */}
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
              <Flex gap={0} align="center">
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
                  }}
                >
                  {statKeyTextMap[sub.key as keyof typeof statKeyTextMap] ??
                    sub.key}
                </Text>
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
          )
        })}
      </Box>
      {/* Divider */}
      <Box
        style={{
          margin: '6px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
        }}
      />

      {/* Score footer */}
      <Flex justify="space-between" align="center">
        <Flex gap={4} align="center">
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: gradeColor(discScore.grade),
            }}
          />
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
        >
          {discScore.grade} ({(discScore.efficiency * 100).toFixed(0)}%)
        </Text>
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
