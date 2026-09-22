import { Box, Text } from '@mantine/core'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type {
  BuildRecipe,
  GeneratedBuild,
  ICachedDisc,
} from '@zenless-optimizer/zzz/db'
import type { EnrichedBuild } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { useTranslation } from 'react-i18next'
import {
  SelectedBuildDiscs,
  TheoreticalBuildSummary,
} from './SelectedBuildPreview'
import {
  isTheoreticalBuild,
  resolveDisplayValue,
  resolveSelectedRecipeId,
} from './selectedBuildDisplay'

/**
 * Selected build preview: recipe summary in theoretical mode, disc cards
 * otherwise. Pure presentational move from `Optimize/index.tsx`.
 */
export function SelectedBuildPanel({
  selectedBuild,
  enrichedBuilds,
  resolveRecipeMeta,
  theoreticalDiscMap,
  useTheoreticalMax,
  characterKey,
  isPinned,
  pinnedRecipeId,
  onPinReference,
}: {
  selectedBuild: GeneratedBuild
  enrichedBuilds: EnrichedBuild[]
  resolveRecipeMeta: (recipeId: string) => BuildRecipe | undefined
  theoreticalDiscMap: Record<string, ICachedDisc>
  useTheoreticalMax: boolean
  characterKey: CharacterKey
  isPinned: boolean
  pinnedRecipeId: string | undefined
  onPinReference: (build?: GeneratedBuild) => void
}) {
  const { t } = useTranslation('page_optimize')
  const recipeId = resolveSelectedRecipeId(selectedBuild.discIds)
  const recipeMeta = recipeId ? resolveRecipeMeta(recipeId) : undefined
  const displayValue = resolveDisplayValue(selectedBuild, enrichedBuilds)
  return (
    <Box
      style={{
        borderRadius: 6,
        padding: 8,
        backgroundColor: 'var(--mantine-color-dark-6)',
        border: '1px solid var(--mantine-color-dark-4)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {useTheoreticalMax && isTheoreticalBuild(selectedBuild.discIds) ? (
        <TheoreticalBuildSummary
          recipeId={recipeId}
          recipeMeta={recipeMeta}
          theoreticalDiscMap={theoreticalDiscMap}
          value={displayValue}
          isPinned={isPinned}
          pinnedRecipeId={pinnedRecipeId}
          onPinReference={onPinReference}
        />
      ) : (
        <>
          <Text size="sm" fw={500} mb="xs">
            {t('grid.selectedBuild', 'Selected Build')} —{' '}
            {Math.floor(displayValue).toLocaleString()}
          </Text>
          <SelectedBuildDiscs
            discIds={selectedBuild.discIds}
            characterKey={characterKey}
            theoreticalDiscMap={theoreticalDiscMap}
          />
        </>
      )}
    </Box>
  )
}
