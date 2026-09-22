import type { AnyNode } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { Tag, TagMapNodeEntries } from './data/util'

/**
 * Phase 1 provenance layer (see doc/architecture.md).
 *
 * Buffs are authored across many sheets (character / W-Engine / disc set /
 * custom frame buffs) and fan out through `teamData()` routing + `sheet:agg`
 * rendezvous reads. By the time analysis reads `final.*` aggregates or damage
 * formulas, per-source attribution is lost.
 *
 * These helpers recover it with **leave-one-out recomputation**: entries are
 * grouped by source sheet, the calculator is rebuilt without one group at a
 * time, and the delta on the exact target reads is that source's
 * contribution. Recomputation (instead of walking the node graph) is exact
 * for transitive formulas — including non-linear damage (`prod`/`min`/`max`
 * nodes where leaf values don't sum to the total) — and naturally respects
 * `preset` scoping, so only buffs targeting the opt target show a delta.
 *
 * Only the analysis panel uses this (gated behind panel mount, memoized per
 * target); the hot solver loop is untouched. The panel uses the async variant
 * (`explainContributionsAsync`): `#groups + 1` full calculator builds is far
 * too much synchronous work for one render pass, so it yields to the browser
 * between builds and abandons superseded runs.
 */

export type SourceKind = 'sheet' | 'custom' | 'enemy'

export interface SourcedEntries {
  key: string
  kind: SourceKind
  /** Source sheet for `kind === 'sheet'`. */
  sheet?: string
  entries: TagMapNodeEntries
}

export interface SourceContribution {
  key: string
  kind: SourceKind
  sheet?: string
  label: string
  /** `total - withoutSource` on the target reads (with multipliers). */
  value: number
}

export interface ContributionTarget {
  read: AnyNode
  multiplier?: number
}

/** Sheets that are routing/aggregation points, never attributable sources. */
const INFRA_SHEETS = new Set([
  'agg',
  'iso',
  'static',
  'char',
  'wengine',
  'disc',
  'dyn',
  'enemy',
  'anomaly',
])

const isReread = (e: TagMapNodeEntries[number]): boolean =>
  (e.value as { op?: string } | undefined)?.op === 'reread'

/**
 * Partition calculator entries into excludable source groups.
 *
 * - Static sheet buffs/formulas (`sheet:<char|wengine|discset>`) group by
 *   sheet. Dynamic conditional entries for that sheet join the same group,
 *   so removing the group also drops its conditionals (clean off-switch).
 * - Frame bonus stats (`sheet:custom`, written by `buildCalculatorEntries`)
 *   group as `custom`.
 * - Frame enemy stats (`et:enemy`, `sheet:agg`, preset-scoped) group as
 *   `enemy`.
 *
 * The main character's own sheet is excluded: it holds the target formula
 * and base stats, so removing it breaks computation instead of attributing.
 * Routing entries (`reread` values: `teamData` fan-out, stat bridges) are
 * never grouped — removing them breaks every read.
 */
export function groupEntriesBySource(
  entries: TagMapNodeEntries,
  mainKey?: CharacterKey | string
): SourcedEntries[] {
  const bySheet = new Map<string, TagMapNodeEntries>()
  const custom: TagMapNodeEntries = []
  const enemy: TagMapNodeEntries = []

  for (const e of entries) {
    if (isReread(e)) continue
    const tag = e.tag as Tag
    const sheet = tag.sheet
    if (sheet === 'custom' && tag.et === 'own') {
      custom.push(e)
      continue
    }
    if (
      tag.et === 'enemy' &&
      sheet === 'agg' &&
      (tag as { preset?: string }).preset !== undefined
    ) {
      enemy.push(e)
      continue
    }
    if (
      typeof sheet === 'string' &&
      !INFRA_SHEETS.has(sheet) &&
      sheet !== mainKey
    ) {
      const list = bySheet.get(sheet)
      if (list) list.push(e)
      else bySheet.set(sheet, [e])
    }
  }

  const groups: SourcedEntries[] = [...bySheet.entries()].map(
    ([sheet, groupEntries]) => ({
      key: `sheet:${sheet}`,
      kind: 'sheet' as const,
      sheet,
      entries: groupEntries,
    })
  )
  if (custom.length)
    groups.push({ key: 'custom', kind: 'custom', entries: custom })
  if (enemy.length) groups.push({ key: 'enemy', kind: 'enemy', entries: enemy })
  return groups
}

export function sourceLabel(
  group: Pick<SourcedEntries, 'kind' | 'sheet'>
): string {
  switch (group.kind) {
    case 'custom':
      return 'Custom buffs'
    case 'enemy':
      return 'Enemy debuffs'
    default:
      return group.sheet ?? group.kind
  }
}

interface CalcLike {
  compute: (read: AnyNode) => { val: unknown }
}

function evalTargets<C extends CalcLike>(
  calc: C,
  targets: ContributionTarget[]
): number {
  let total = 0
  for (const { read, multiplier } of targets)
    total += (calc.compute(read).val as number) * (multiplier ?? 1)
  return total
}

/**
 * Yield to the browser so analysis work never blocks input or paint.
 * Mirrors the batching in `zzz/solver`'s `batchComputeBuildStats`.
 */
function yieldToMain(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => resolve(), { timeout: 50 })
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/**
 * The calculator for `entries` with one source group removed. Groups whose
 * removal breaks computation (e.g. a sheet holding base stats a
 * unique-accumulator read requires) come back as `null` rather than failing
 * the whole panel.
 */
function buildWithoutGroup<C extends CalcLike>(
  entries: TagMapNodeEntries,
  group: SourcedEntries,
  buildCalc: (entries: TagMapNodeEntries) => C
): { group: SourcedEntries; calc: C | null } {
  const without = new Set(group.entries)
  const filtered = entries.filter((e) => !without.has(e))
  try {
    return { group, calc: buildCalc(filtered) }
  } catch {
    return { group, calc: null }
  }
}

/** Base totals + leave-one-out calculators -> per-source deltas. */
function collectContributions<C extends CalcLike>(
  targetSets: ContributionTarget[][],
  baseTotals: number[],
  withoutCalcs: { group: SourcedEntries; calc: C | null }[],
  epsilon: number
): SourceContribution[][] {
  return targetSets.map((targets, i) => {
    const base = baseTotals[i]!
    const out: SourceContribution[] = []
    for (const { group, calc } of withoutCalcs) {
      if (!calc) continue
      let without: number
      try {
        without = evalTargets(calc, targets)
      } catch {
        continue
      }
      if (!Number.isFinite(without) || !Number.isFinite(base)) continue
      const value = base - without
      if (Math.abs(value) <= epsilon) continue
      out.push({
        key: group.key,
        kind: group.kind,
        sheet: group.sheet,
        label: sourceLabel(group),
        value,
      })
    }
    out.sort((a, b) => b.value - a.value)
    return out
  })
}

/**
 * Explain one or more target sets via leave-one-out recomputation.
 *
 * Builds the base calculator plus one calculator per source group ONCE,
 * then evaluates every target set against all of them — cost is
 * `#groups + 1` builds and `(#groups + 1) × #targetSets` evaluations.
 * Groups whose removal breaks computation (e.g. a sheet holding base stats
 * a unique-accumulator read requires) are skipped rather than failing the
 * panel. Deltas with `|value| <= epsilon` are dropped, so buffs that don't
 * target the opt target (wrong `preset`/`sheet`/`name`) never appear.
 */
export function explainContributions<C extends CalcLike>(
  entries: TagMapNodeEntries,
  mainKey: CharacterKey | string | undefined,
  targetSets: ContributionTarget[][],
  buildCalc: (entries: TagMapNodeEntries) => C,
  epsilon = 1e-6
): SourceContribution[][] {
  const groups = groupEntriesBySource(entries, mainKey)

  const baseCalc = buildCalc(entries)
  const baseTotals = targetSets.map((targets) => evalTargets(baseCalc, targets))

  const withoutCalcs = groups.map((g) =>
    buildWithoutGroup(entries, g, buildCalc)
  )

  return collectContributions(targetSets, baseTotals, withoutCalcs, epsilon)
}

export interface ExplainContributionsAsyncOptions {
  epsilon?: number
  /**
   * Checked before every calculator build; return `true` to abandon the run
   * (inputs superseded by a newer run, or the panel unmounted). A cancelled
   * run resolves `null` instead of partial contributions.
   */
  shouldCancel?: () => boolean
}

/**
 * Async, cancellable {@link explainContributions} for UI use.
 *
 * Identical results, but each of the `#groups + 1` calculator builds is
 * separated by a yield to the browser, so a full-team analysis no longer
 * blocks the main thread for seconds — and navigating away (or recomputing
 * for newer inputs) abandons the old run at the next build instead of
 * finishing work nobody will read. Resolves `null` when cancelled.
 */
export async function explainContributionsAsync<C extends CalcLike>(
  entries: TagMapNodeEntries,
  mainKey: CharacterKey | string | undefined,
  targetSets: ContributionTarget[][],
  buildCalc: (entries: TagMapNodeEntries) => C,
  options: ExplainContributionsAsyncOptions = {}
): Promise<SourceContribution[][] | null> {
  const { epsilon = 1e-6, shouldCancel } = options
  const groups = groupEntriesBySource(entries, mainKey)

  await yieldToMain()
  if (shouldCancel?.()) return null
  const baseCalc = buildCalc(entries)
  const baseTotals = targetSets.map((targets) => evalTargets(baseCalc, targets))

  const withoutCalcs: { group: SourcedEntries; calc: C | null }[] = []
  for (const group of groups) {
    await yieldToMain()
    if (shouldCancel?.()) return null
    withoutCalcs.push(buildWithoutGroup(entries, group, buildCalc))
  }

  return collectContributions(targetSets, baseTotals, withoutCalcs, epsilon)
}
