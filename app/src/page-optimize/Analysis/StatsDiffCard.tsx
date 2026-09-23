import { Flex, Image, Text } from '@mantine/core'
import { characterAsset, wengineAsset } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import { StatIcon } from '@zenless-optimizer/zzz/svgicons'
import { useTranslation } from 'react-i18next'
import type {
  AnalysisData,
  StatComparisonEntry,
} from './ExpandedDataPanelController'
import { buildStatComparisons } from './ExpandedDataPanelController'
import { arrowColor, arrowDirection, formatInt } from './format'
import classes from './StatsDiffCard.module.css'

const WENGINE_CARD_H = 80
const CARD_GAP = 8
const STAT_IMAGE_W = 200

/**
 * Side-by-side of the equipped build and the selected build. Mirrors
 * hsr-optimizer's `StatsDiffCard`: character + W-Engine art on the left, a
 * diff row per stat on the right, target damage on top.
 */
export function StatsDiffCard({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { t } = useTranslation('page_optimize', { keyPrefix: 'analysis' })
  const {
    equippedStats,
    selectedStats,
    equippedTargetValue,
    targetValue,
    characterKey,
    selectedWengineKey,
  } = analysisData
  const comparisons = buildStatComparisons(equippedStats, selectedStats)
  const hasComparison = comparisons.length > 0

  return (
    <div className={classes.outerCard} style={{ display: 'flex', gap: 10 }}>
      <CardImage characterKey={characterKey} wengineKey={selectedWengineKey} />

      <div className={classes.statsPanel}>
        <Text fw={700} size="sm" mb="sm">
          {t('statsDiff.title', 'Equipped → Selected')}
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <DiffRow
            label={t('statsDiff.target', 'Target')}
            iconKey=""
            oldValue={equippedTargetValue}
            newValue={targetValue}
            isPercent={false}
            diffAsPercent
          />
          {hasComparison ? (
            comparisons.map((stat) => (
              <StatDiffRow key={stat.key} stat={stat} />
            ))
          ) : (
            <Text size="xs" c="dimmed">
              {t('statsDiff.empty', 'Select a build to compare stats.')}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}

function StatDiffRow({ stat }: { stat: StatComparisonEntry }) {
  return (
    <DiffRow
      label={stat.label}
      iconKey={stat.iconKey}
      oldValue={stat.current}
      newValue={stat.improved}
      isPercent={stat.isPercent}
    />
  )
}

function DiffRow({
  label,
  iconKey,
  oldValue,
  newValue,
  isPercent,
  diffAsPercent,
}: {
  label: string
  iconKey: string
  oldValue: number
  newValue: number
  isPercent: boolean
  /** Render the delta as a relative % change (used for the damage row). */
  diffAsPercent?: boolean
}) {
  const delta = newValue - oldValue
  const increase = delta > 0
  const changed = Math.abs(delta) > 1e-4

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className={classes.oldStatColumn}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Flex align="center" gap={6} style={{ minWidth: 0 }}>
            {iconKey && (
              <StatIcon
                statKey={iconKey}
                iconProps={{ style: { fontSize: 17 } }}
              />
            )}
            <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
              {label}
            </Text>
          </Flex>
          <Text size="xs" c="dimmed">
            {formatStatValue(oldValue, isPercent)}
          </Text>
        </div>
      </div>

      <span className={classes.arrow}>➤</span>

      <div
        className={classes.newValueColumn}
        style={{ display: 'flex', justifyContent: 'flex-end' }}
      >
        <Text size="xs" fw={600}>
          {formatStatValue(newValue, isPercent)}
        </Text>
      </div>

      <div className={classes.diffColumn}>
        {changed && (
          <>
            <Text size="xs" c={arrowColor(increase)}>
              {diffAsPercent
                ? formatPercentDelta(oldValue, newValue)
                : formatStatDelta(delta, isPercent)}
            </Text>
            <span className={classes.arrowIcon}>
              {arrowDirection(increase)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function formatStatValue(value: number, isPercent: boolean): string {
  if (isPercent) return `${(value * 100).toFixed(1)}%`
  return formatInt(value)
}

function formatStatDelta(delta: number, isPercent: boolean): string {
  if (isPercent) {
    return `${delta >= 0 ? '+' : '−'}${Math.abs(delta * 100).toFixed(1)}%`
  }
  return `${delta >= 0 ? '+' : '−'}${formatInt(Math.abs(delta))}`
}

/** Relative change of the damage row (`+12.3%`). */
function formatPercentDelta(oldValue: number, newValue: number): string {
  if (!(oldValue > 0)) return '—'
  const ratio = (newValue / oldValue - 1) * 100
  return `${ratio >= 0 ? '+' : '−'}${Math.abs(ratio).toFixed(1)}%`
}

function CardImage({
  characterKey,
  wengineKey,
}: {
  characterKey: CharacterKey
  wengineKey?: string
}) {
  const charImg = characterAsset(characterKey, 'full')
  const wengineImg = wengineKey
    ? wengineAsset(wengineKey as WengineKey)
    : undefined

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: CARD_GAP,
        width: STAT_IMAGE_W,
        flexShrink: 0,
      }}
    >
      <div
        className={classes.cardImageContainer}
        style={{
          flex: 1,
          minHeight: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {charImg ? (
          <Image src={charImg} alt="" fit="contain" w="100%" h="100%" />
        ) : (
          <Text size="xs" c="dimmed">
            {characterKey}
          </Text>
        )}
      </div>
      {wengineImg && (
        <div className={classes.wengineCard} style={{ height: WENGINE_CARD_H }}>
          <Image src={wengineImg} alt="" fit="contain" h={WENGINE_CARD_H - 8} />
        </div>
      )}
    </div>
  )
}
