import type { GeneratedBuild } from '@zenless-optimizer/zzz/db'
import { buildRowId } from '@zenless-optimizer/zzz/solver/buildStatsUtils'

type DiscIds = GeneratedBuild['discIds']
type EnrichedValue = { id: string; value: number }

/**
 * Recipe id for a selected build: slot-1 disc ids carry a per-slot suffix
 * (`recipe_3_1` → `recipe_3`). Plain disc ids pass through unchanged.
 */
export function resolveSelectedRecipeId(discIds: DiscIds | undefined): string {
  return (discIds?.['1'] ?? '').replace(/_\d+$/, '')
}

/** Whether the selected build is a theoretical recipe build. */
export function isTheoreticalBuild(discIds: DiscIds | undefined): boolean {
  return discIds?.['1']?.startsWith('recipe_') ?? false
}

/**
 * Display value for the selected build: prefer the recomputed enriched
 * value (correct for the equipped build, whose stored value is 0) over
 * the stale `selectedBuild.value`.
 */
export function resolveDisplayValue(
  selectedBuild: GeneratedBuild,
  enrichedBuilds: EnrichedValue[]
): number {
  return (
    enrichedBuilds.find((b) => b.id === buildRowId(selectedBuild))?.value ??
    selectedBuild.value
  )
}
