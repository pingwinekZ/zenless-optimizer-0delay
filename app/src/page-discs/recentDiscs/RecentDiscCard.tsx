import { Box, Stack, Text, Tooltip } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import { discDefIcon } from '../../assets'
import type { CharacterKey, DiscSubStatKey } from '../../consts'
import {
  rarityColor as discRarityColor,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '../../consts'
import { StatIcon } from '../../svgicons'
import { DiscSetName } from '../../ui'
import {
  getCharacterEffectiveStats,
  getCharacterSubstatWeights,
} from '../../util'
import type { IDisc, ISubstat } from '../../zood'
import { computeCurrentScore } from '../scoring/currentScore'
import { computeMaxPotential } from '../scoring/potentialScore'
import { formatScorePct } from '../scoring/scoreFormatting'

export function RecentDiscCard({
  disc,
  focusCharacter,
  isSelected,
  onClick,
}: {
  disc: IDisc
  focusCharacter: CharacterKey | null
  isSelected: boolean
  onClick?: () => void
}) {
  const effectiveStats = focusCharacter
    ? getCharacterEffectiveStats(focusCharacter)
    : []
  const weights = focusCharacter
    ? getCharacterSubstatWeights(focusCharacter)
    : {}
  const current = computeCurrentScore(disc, effectiveStats)
  const max = computeMaxPotential(disc, effectiveStats, weights)
  const rarityHex = discRarityColor[disc.rarity] as string

  return (
    <Box
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
        background: 'var(--layer-1)',
        border: isSelected
          ? '2px solid var(--primary-light-alpha)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `2px solid ${rarityHex}`,
            overflow: 'hidden',
            background: 'var(--layer-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ImgIcon src={discDefIcon(disc.setKey)} size={2.2} />
        </Box>
        <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Text size="xs" fw={700} truncate>
            <DiscSetName setKey={disc.setKey} />
          </Text>
          <Text size="xs" c="dimmed">
            Slot {disc.slotKey} · +{disc.level}
          </Text>
        </Box>
      </Box>
      <Text size="xs" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <StatIcon statKey={disc.mainStatKey} iconProps={{ style: {} }} />
        <Box component="span">
          {statKeyTextMap[disc.mainStatKey as keyof typeof statKeyTextMap] ??
            disc.mainStatKey}
        </Box>
        <Box component="span">
          {toPercent(
            getDiscMainStatVal(disc.rarity, disc.mainStatKey, disc.level),
            disc.mainStatKey
          ).toFixed(statKeyToFixed(disc.mainStatKey))}
          {getUnitStr(disc.mainStatKey)}
        </Box>
      </Text>
      <Stack gap={2}>
        {disc.substats.map((substat, i) => (
          <SubstatLine
            key={`${substat.key}-${i}`}
            substat={substat}
            rarity={disc.rarity}
          />
        ))}
      </Stack>
      {focusCharacter && (
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            padding: '2px 4px',
            background: 'var(--layer-2)',
            borderRadius: 4,
          }}
        >
          <Tooltip label="Current substat efficiency">
            <Text size="xs">{formatScorePct(current)}</Text>
          </Tooltip>
          <Tooltip label="Max potential with remaining rolls">
            <Text size="xs" fw={700}>
              {formatScorePct(max)}
            </Text>
          </Tooltip>
        </Box>
      )}
    </Box>
  )
}

function SubstatLine({
  substat,
  rarity,
}: {
  substat: ISubstat
  rarity: IDisc['rarity']
}) {
  if (!substat.key || substat.upgrades === 0) return null
  const value =
    getDiscSubStatBaseVal(substat.key as DiscSubStatKey, rarity) *
    substat.upgrades
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      <StatIcon statKey={substat.key} iconProps={{ style: { fontSize: 12 } }} />
      <Box
        component="span"
        style={{
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {statKeyTextMap[substat.key as keyof typeof statKeyTextMap] ??
          substat.key}
      </Box>
      <Box component="span">
        {toPercent(value, substat.key).toFixed(statKeyToFixed(substat.key))}
        {getUnitStr(substat.key)}
      </Box>
    </Box>
  )
}
