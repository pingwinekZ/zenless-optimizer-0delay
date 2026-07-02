import { Box, Stack, Text } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { Trans, useTranslation } from 'react-i18next'
import { discDefIcon } from '../../assets'
import type { CharacterKey } from '../../consts'
import { rarityColor as discRarityColor } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { DiscSetName } from '../../ui'
import type { IDisc } from '../../zood'
import {
  DiscMainStatValueDisplay,
  DiscSubstatRow,
} from '../discPreview/DiscStatRow'
import { computeCurrentScore as scoreCurrent } from '../scoring/currentScore'
import { computeMaxPotential } from '../scoring/potentialScore'
import { formatScorePct } from '../scoring/scoreFormatting'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from '../scoring/statWeightUtils'

export function DiscPreview({
  disc,
  focusCharacter,
}: {
  disc: IDisc | null
  focusCharacter: CharacterKey | null
}) {
  const { database } = useDatabaseContext()
  const { t } = useTranslation('discTab')

  if (!disc) {
    return (
      <Box
        style={{
          width: '100%',
          minHeight: 320,
          padding: 16,
          background: 'var(--layer-1)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text c="dimmed" size="sm">
          {t('BottomDock.NoDiscSelected')}
        </Text>
      </Box>
    )
  }

  const effectiveStats = focusCharacter
    ? getMergedEffectiveStats(focusCharacter, database)
    : []
  const weights = focusCharacter
    ? getMergedSubstatWeights(focusCharacter, database)
    : {}
  const current = scoreCurrent(disc, effectiveStats)
  const max = computeMaxPotential(disc, effectiveStats, weights)
  const rarityHex = discRarityColor[disc.rarity] as string

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        background: 'var(--layer-1)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        minHeight: 320,
      }}
    >
      <Box style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Box
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `3px solid ${rarityHex}`,
            overflow: 'hidden',
            background: 'var(--layer-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ImgIcon src={discDefIcon(disc.setKey)} size={3.2} />
        </Box>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={700} truncate>
            <DiscSetName setKey={disc.setKey} />
          </Text>
          <Text size="xs" c="dimmed">
            Slot {disc.slotKey} · +{disc.level} · {disc.rarity}
          </Text>
        </Box>
      </Box>
      <DiscMainStatValueDisplay
        statKey={disc.mainStatKey}
        rarity={disc.rarity}
        level={disc.level}
      />
      <Stack gap={2}>
        {disc.substats.map((sub, i) => (
          <DiscSubstatRow
            key={`${sub.key}-${i}`}
            substat={sub}
            rarity={disc.rarity}
            highlighted={!!sub.key && effectiveStats.includes(sub.key)}
          />
        ))}
      </Stack>
      {focusCharacter && (
        <Box
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 4,
            padding: 6,
            background: 'var(--layer-2)',
            borderRadius: 4,
            justifyContent: 'space-between',
          }}
        >
          <Box style={{ textAlign: 'center', flex: 1 }}>
            <Text size="xs" c="dimmed">
              {t('RelicGrid.ValueColumns.CurrentScore')}
            </Text>
            <Text fw={700} size="sm">
              {formatScorePct(current)}
            </Text>
          </Box>
          <Box style={{ textAlign: 'center', flex: 1 }}>
            <Text size="xs" c="dimmed">
              {t('RelicGrid.ValueColumns.MaxPotential')}
            </Text>
            <Text fw={700} size="sm">
              {formatScorePct(max)}
            </Text>
          </Box>
        </Box>
      )}
      {!focusCharacter && (
        <Text size="xs" c="dimmed">
          <Trans
            t={t}
            i18nKey="BottomDock.SelectCharacterHint"
            defaults="Select a focus character in the top bar to see scores."
          />
        </Text>
      )}
      {current === 0 && scoreCurrent(disc, []) === 0 && null}
    </Box>
  )
}
