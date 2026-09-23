import type { GeneratedBuild, Team } from '@zenless-optimizer/zzz/db'
import {
  getComboFrames,
  getTeamFrame0,
  isComboTarget,
  targetTag,
} from '@zenless-optimizer/zzz/db'
import { buildRowId } from '@zenless-optimizer/zzz/solver/buildStatsUtils'

/**
 * Next grid selection when the result set syncs: a genuinely new result set
 * selects the first theoretical build (or the equipped build), while a
 * same-set refresh keeps the current selection if it still exists.
 */
export function nextSelectedBuild(opts: {
  isNewResultSet: boolean
  builds: GeneratedBuild[]
  useTheoreticalMax: boolean
  equippedBuild: GeneratedBuild
  current: GeneratedBuild | undefined
  allBuilds: GeneratedBuild[]
}): GeneratedBuild {
  if (opts.isNewResultSet)
    return opts.useTheoreticalMax && opts.builds.length > 0
      ? opts.builds[0]
      : opts.equippedBuild
  const { current } = opts
  if (
    current &&
    opts.allBuilds.some((b) => buildRowId(b) === buildRowId(current))
  )
    return current
  return opts.equippedBuild
}

/** Pin toggle for the selected build: remove if pinned, else the entry to add. */
export type PinToggle =
  | { action: 'remove'; buildId: string }
  | {
      action: 'add'
      entry: {
        buildId: string
        index: number
        value: GeneratedBuild['value']
        wengineKey: GeneratedBuild['wengineKey']
        discIds: GeneratedBuild['discIds']
      }
    }

export function pinToggleForSelected(
  selectedBuild: GeneratedBuild | undefined,
  pinnedBuilds: ReadonlyArray<{ buildId: string }>,
  allBuilds: GeneratedBuild[]
): PinToggle | undefined {
  if (!selectedBuild) return undefined
  const buildId = buildRowId(selectedBuild)
  if (pinnedBuilds.some((b) => b.buildId === buildId))
    return { action: 'remove', buildId }
  const buildIndex = allBuilds.findIndex((b) => buildRowId(b) === buildId)
  return {
    action: 'add',
    entry: {
      buildId,
      index: buildIndex, // -1 for equipped build → displayed as #0
      value: selectedBuild.value,
      wengineKey: selectedBuild.wengineKey,
      discIds: selectedBuild.discIds,
    },
  }
}

/**
 * Combo-aware formula tag for per-build stat enrichment. Rotations expand
 * via getComboFrames so the selected combo metric (DMG/Daze/Buildup) is
 * reflected in per-build values; multipliers are preserved and hit `i`
 * reads on `preset${i}`, matching the solver.
 */
export function resolveEnrichmentFormulaTag(team: Team) {
  const { tag: target } = getTeamFrame0(team)
  return isComboTarget(target)
    ? getComboFrames(team)
        .filter((frame) => frame.tag?.sheet && frame.tag?.name)
        .map((frame) => ({
          tag: targetTag(frame.tag!),
          multiplier: frame.multiplier,
        }))
    : target
      ? targetTag(target)
      : undefined
}
