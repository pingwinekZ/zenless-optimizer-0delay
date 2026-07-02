import { Box, Group, SegmentedControl, Text } from '@mantine/core'
import { BootstrapTooltip } from '@zenless-optimizer/common/ui'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscSubStatKey } from '../../consts'
import { allCharacterKeys } from '../../consts'
import type { ZzzDatabase } from '../../db'
import { useDatabaseContext } from '../../db-ui'
import { CharacterName, CharIconCircle } from '../../ui'
import type { IDisc } from '../../zood'
import { computeCurrentScore } from '../scoring/currentScore'
import { computeMaxPotential } from '../scoring/potentialScore'
import { formatScorePct } from '../scoring/scoreFormatting'
import {
  getMergedEffectiveStats,
  getMergedSubstatWeights,
} from '../scoring/statWeightUtils'

type Mode = 'buckets' | 'top10'

type CharacterInsight = {
  characterKey: (typeof allCharacterKeys)[number]
  currentScore: number
  maxPotential: number
  effectiveStats: DiscSubStatKey[]
  missingStats: DiscSubStatKey[]
  hasStats: DiscSubStatKey[]
}

const BUCKET_RANGES = [
  { min: 0.8, max: 1.01, label: '80-100%', color: '#2ecc71' },
  { min: 0.6, max: 0.8, label: '60-80%', color: '#27ae60' },
  { min: 0.4, max: 0.6, label: '40-60%', color: '#f39c12' },
  { min: 0.2, max: 0.4, label: '20-40%', color: '#e67e22' },
  { min: 0, max: 0.2, label: '0-20%', color: '#e74c3c' },
] as const

function computeInsights(
  disc: IDisc,
  database?: ZzzDatabase
): CharacterInsight[] {
  return allCharacterKeys.map((ck) => {
    const effectiveStats = getMergedEffectiveStats(ck, database)
    const weights = getMergedSubstatWeights(ck, database)
    const current = computeCurrentScore(disc, effectiveStats, weights)
    const maxPot = computeMaxPotential(disc, effectiveStats, weights)

    const activeSubstatKeys = new Set(
      disc.substats
        .filter((s) => s.key && s.upgrades > 0)
        .map((s) => s.key) as string[]
    )
    const hasStats = effectiveStats.filter((s) =>
      activeSubstatKeys.has(s as string)
    )
    const missingStats = effectiveStats.filter(
      (s) => !activeSubstatKeys.has(s as string)
    )

    return {
      characterKey: ck,
      currentScore: current,
      maxPotential: maxPot,
      effectiveStats,
      missingStats,
      hasStats,
    }
  })
}

function rangeScoreBar({
  current,
  maxPot,
}: {
  current: number
  maxPot: number
}) {
  const pct = (min: number) => `${Math.round(min * 100)}%`
  return (
    <Box
      style={{
        position: 'relative',
        height: 8,
        background: 'var(--layer-3)',
        borderRadius: 4,
        overflow: 'hidden',
        flex: 1,
        minWidth: 60,
      }}
    >
      <Box
        style={{
          position: 'absolute',
          left: pct(current),
          width: pct(maxPot - current),
          height: '100%',
          background: 'linear-gradient(90deg, #f39c12, #2ecc71)',
          borderRadius: 4,
        }}
      />
    </Box>
  )
}

function InsightTooltip({
  insight,
  children,
}: {
  insight: CharacterInsight
  children: React.ReactNode
}) {
  const { t } = useTranslation('statKey_gen')
  return (
    <BootstrapTooltip
      multiline
      w={260}
      transitionProps={{ transition: 'fade', duration: 150 }}
      label={
        <Box>
          <Text fw={700} size="sm" mb={4}>
            <CharacterName characterKey={insight.characterKey} />
          </Text>
          <Text size="xs" mb={2}>
            Current: <b>{formatScorePct(insight.currentScore)}</b> → Max:{' '}
            <b>{formatScorePct(insight.maxPotential)}</b>
          </Text>
          {insight.hasStats.length > 0 && (
            <Text size="xs">
              Has:{' '}
              {insight.hasStats
                .map((s) => (t(s) || s) + getUnitStr(s))
                .join(', ')}
            </Text>
          )}
          {insight.missingStats.length > 0 && (
            <Text size="xs" c="orange">
              Needs:{' '}
              {insight.missingStats
                .map((s) => (t(s) || s) + getUnitStr(s))
                .join(', ')}
            </Text>
          )}
          {insight.missingStats.length === 0 && (
            <Text size="xs" c="dimmed">
              All effective stats already present.
            </Text>
          )}
        </Box>
      }
    >
      {children}
    </BootstrapTooltip>
  )
}

function BucketRow({
  bucket,
  insights,
}: {
  bucket: (typeof BUCKET_RANGES)[number]
  insights: CharacterInsight[]
}) {
  const inBucket = useMemo(
    () =>
      insights.filter(
        (i) => i.maxPotential >= bucket.min && i.maxPotential < bucket.max
      ),
    [insights, bucket]
  )

  if (inBucket.length === 0) return null

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 6px',
        borderRadius: 4,
        background: 'var(--layer-2)',
      }}
    >
      <Text size="xs" fw={600} style={{ minWidth: 54, color: bucket.color }}>
        {bucket.label}
      </Text>
      <Group gap={4} style={{ flex: 1, flexWrap: 'wrap' }}>
        {inBucket.map((insight) => (
          <InsightTooltip key={insight.characterKey} insight={insight}>
            <Box
              component="span"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                opacity: insight.currentScore > 0 ? 1 : 0.6,
                transition: 'opacity 0.15s',
              }}
            >
              <CharIconCircle characterKey={insight.characterKey} />
            </Box>
          </InsightTooltip>
        ))}
      </Group>
      <Text size="xs" c="dimmed" style={{ minWidth: 24, textAlign: 'right' }}>
        {inBucket.length}
      </Text>
    </Box>
  )
}

function BucketsView({ insights }: { insights: CharacterInsight[] }) {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Text size="xs" c="dimmed" mb={2}>
        How perfect this relic could be for each character (max potential).
      </Text>
      {BUCKET_RANGES.map((bucket) => (
        <BucketRow key={bucket.label} bucket={bucket} insights={insights} />
      ))}
      <Text size="xs" c="dimmed" mt={4}>
        <span role="img" aria-label="Warning">
          ⚠️
        </span>{' '}
        Relics with missing substats may have misleadingly high buckets, as
        best-case upgrade analysis assumes the best new substat per character.
      </Text>
    </Box>
  )
}

function Top10View({ insights }: { insights: CharacterInsight[] }) {
  const top10 = useMemo(
    () =>
      [...insights]
        .sort((a, b) => b.maxPotential - a.maxPotential)
        .slice(0, 10),
    [insights]
  )

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Text size="xs" c="dimmed" mb={2}>
        Top 10 characters this relic could be best for, showing current → max %
        perfection.
      </Text>
      {top10.map((insight, i) => (
        <InsightTooltip key={insight.characterKey} insight={insight}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 6px',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Text
              size="xs"
              c="dimmed"
              style={{ minWidth: 18, textAlign: 'right' }}
            >
              {i + 1}.
            </Text>
            <CharIconCircle characterKey={insight.characterKey} />
            <Text size="xs" style={{ minWidth: 80, truncate: true }}>
              <CharacterName characterKey={insight.characterKey} />
            </Text>
            {rangeScoreBar({
              current: insight.currentScore,
              maxPot: insight.maxPotential,
            })}
            <Text size="xs" style={{ minWidth: 60, textAlign: 'right' }}>
              {formatScorePct(insight.currentScore)} →{' '}
              {formatScorePct(insight.maxPotential)}
            </Text>
          </Box>
        </InsightTooltip>
      ))}
    </Box>
  )
}

export const RelicInsight = memo(function RelicInsight({
  disc,
}: {
  disc: IDisc | null
}) {
  const { database } = useDatabaseContext()
  const [mode, setMode] = useState<Mode>('buckets')
  const { t } = useTranslation('discTab')

  const insights = useMemo(() => {
    if (!disc) return []
    return computeInsights(disc, database)
  }, [disc, database])

  if (!disc) {
    return (
      <Box
        style={{
          flex: 1,
          minHeight: 320,
          padding: 16,
          background: 'var(--layer-1)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card-flat)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Text c="dimmed" size="sm">
          {t('BottomDock.NoDiscSelected')}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      style={{
        flex: 1,
        minHeight: 320,
        padding: 12,
        background: 'var(--layer-1)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card-flat)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Group justify="space-between" align="center">
        <Text fw={600} size="sm">
          {t('BottomDock.RelicInsight')}
        </Text>
        <SegmentedControl
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          data={[
            { value: 'buckets', label: 'Buckets' },
            { value: 'top10', label: 'Top 10' },
          ]}
          size="xs"
        />
      </Group>
      {mode === 'buckets' ? (
        <BucketsView insights={insights} />
      ) : (
        <Top10View insights={insights} />
      )}
    </Box>
  )
})
