import { Image, Text } from '@mantine/core'
import { characterAsset, wengineAsset } from '../../assets'
import type { CharacterKey, WengineKey } from '../../consts'
import type { AnalysisData } from './ExpandedDataPanelController'
import { buildStatComparisons } from './ExpandedDataPanelController'
import classes from './StatsDiffCard.module.css'

const baseCardHeight = 340
const lcCardH = 80
const cardGap = 8

export function StatsDiffCard({
  analysisData,
}: {
  analysisData: AnalysisData
}) {
  const { equippedStats, selectedStats, characterKey, selectedWengineKey } =
    analysisData
  const comparisons = buildStatComparisons(equippedStats, selectedStats)
  const cardHeight = baseCardHeight

  return (
    <div
      className={classes.outerCard}
      style={{ display: 'flex', height: cardHeight, gap: 10 }}
    >
      <CardImage
        characterKey={characterKey}
        wengineKey={selectedWengineKey}
        cardHeight={cardHeight}
      />
      <div className={classes.statsPanel}>
        <Text fw={700} size="sm" mb="md">
          Equipped → Selected
        </Text>
        {comparisons.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {comparisons.map((stat) => {
              const diff = stat.improved - stat.current
              const isImprovement = diff > 0.001
              const isDegradation = diff < -0.001
              const isNeutral = !isImprovement && !isDegradation

              return (
                <div
                  key={stat.key}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <div className={classes.oldStatColumn}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text size="xs" style={{ flex: 1 }}>
                        {stat.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatStatValue(stat.current, stat)}
                      </Text>
                    </div>
                  </div>
                  <span className={classes.arrow}>➤</span>
                  <div className={classes.newValueColumn}>
                    <Text
                      size="xs"
                      fw={600}
                      c={
                        isImprovement
                          ? 'green'
                          : isDegradation
                            ? 'red'
                            : undefined
                      }
                      style={{ textAlign: 'right' }}
                    >
                      {formatStatValue(stat.improved, stat)}
                    </Text>
                  </div>
                  {!isNeutral && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        alignItems: 'center',
                        width: 80,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Text size="xs" c={isImprovement ? 'green' : 'red'}>
                        {isImprovement && '+'}
                        {formatStatValue(diff, stat)}
                      </Text>
                      <span className={classes.arrowIcon}>
                        {isImprovement ? '\u2191' : '\u2193'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <Text size="xs" c="dimmed">
            Select a build to compare stats.
          </Text>
        )}
      </div>
    </div>
  )
}

function formatStatValue(
  value: number,
  stat: { unit: string; isPercent: boolean }
): string {
  if (stat.isPercent) {
    return `${(value * 100).toFixed(1)}%`
  }
  return Math.round(value).toLocaleString()
}

function CardImage({
  characterKey,
  wengineKey,
  cardHeight,
}: {
  characterKey: CharacterKey
  wengineKey?: string
  cardHeight: number
}) {
  const charCardH = cardHeight - lcCardH - cardGap
  const charImg = characterAsset(characterKey, 'full')
  const wengineImg = wengineKey
    ? wengineAsset(wengineKey as WengineKey)
    : undefined

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: cardGap,
        height: '100%',
        width: 200,
      }}
    >
      <div
        className={classes.cardImageContainer}
        style={{
          height: charCardH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {charImg ? (
          <Image src={charImg} alt="" fit="contain" h={charCardH} w="100%" />
        ) : (
          <Text size="xs" c="dimmed">
            {characterKey}
          </Text>
        )}
      </div>
      {wengineImg && (
        <div
          style={{
            width: '100%',
            height: lcCardH,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 6,
            backgroundColor: 'var(--layer-2)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          <Image src={wengineImg} alt="" fit="contain" h={lcCardH - 8} />
        </div>
      )}
    </div>
  )
}
