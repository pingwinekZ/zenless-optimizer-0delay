import type { CalcMeta } from '@zenless-optimizer/game-opt/engine'
import type { CalcResult } from '@zenless-optimizer/pando/engine'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'
import {
  allDiscSlotKeys,
  allDiscSubStatKeys,
  getDiscSubStatBaseVal,
  statKeyTextMap,
} from '@zenless-optimizer/zzz/consts'
import type {
  DiscIds,
  ICachedCharacter,
  ICachedDisc,
  OptFrame,
  Team,
  TheoReferenceCombatStats,
} from '@zenless-optimizer/zzz/db'
import {
  getComboFrames,
  getTeamFrame0,
  isComboTarget,
  targetTag,
} from '@zenless-optimizer/zzz/db'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import {
  type ContributionTarget,
  convert,
  explainContributionsAsync,
  ownTag,
  Read,
  type SourceContribution,
  zzzCalculatorWithEntries,
} from '@zenless-optimizer/zzz/formula'
import type { ISubstat } from '@zenless-optimizer/zzz/schema/disc'
import type {
  BuildCombatStats,
  BuildTargetInput,
  EnrichedBuild,
} from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import {
  buildCalculatorEntries,
  computeBuildStats,
} from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { efficiencyToGrade } from '@zenless-optimizer/zzz/util'
import type {
  MainMismatch,
  SubstatTip,
  TheoReferenceShape,
} from '../reference/referenceScoring'
import { compareToReference } from '../reference/referenceScoring'
import { tagDamageTypes } from './damageTypes'

export type SubstatRollInfo = {
  key: DiscSubStatKey
  label: string
  totalRolls: number
  totalValue: number
  perRollValue: number
}

export type StatComparisonEntry = {
  key: string
  label: string
  /** Formula stat key, for `StatIcon` lookup (may have no icon). */
  iconKey: string
  current: number
  improved: number
  unit: string
  isPercent: boolean
}

export type PerActionDamage = {
  name: string
  tag: Tag
  /**
   * Damage types this action carries, primary first. The first entry colors and
   * partitions the action; the whole list is what a damage-type filter matches
   * against, so a dual-tagged hit matches either of its types.
   */
  damageTypes: string[]
  value: number
  calcResult: CalcResult<number, CalcMeta<Tag, string>>
  buffedStats: BuildCombatStats | null
  /**
   * Per-source damage contributions for this action (leave-one-out deltas).
   * Only buffs targeting this opt target appear: entries scoped to another
   * `preset`/`sheet`/`name` recompute to the same total and are filtered.
   * Teammate buffs carry their own sheet, so they are no longer grouped
   * into the main character's bucket.
   */
  sources: SourceContribution[]
}

export type TargetFormulaInfo = {
  frame: OptFrame
  formulaTag: Tag
  perActionDamage: PerActionDamage[]
  buffedStats: BuildCombatStats | null
}

export type ReferenceComparison = {
  /** Selected build value / pinned reference value, clamped to [0, 1]. */
  ratio: number
  grade: string
  selectedValue: number
  referenceValue: number
  date: number
  /** True when the current target/filters differ from the pin context. */
  stale: boolean
  tips: SubstatTip[]
  mainMismatches: MainMismatch[]
  /** The persisted perfect build: sets, wengine, mains and substat rolls. */
  set4?: DiscSetKey
  set2?: DiscSetKey
  wengineKey?: string
  mainsBySlot?: Partial<Record<DiscSlotKey, DiscMainStatKey>>
  perfectRolls?: Partial<Record<DiscSubStatKey, number>>
  /** Selected build's own rolls/mains, for side-by-side comparison. */
  localRolls?: Partial<Record<DiscSubStatKey, number>>
  localMains?: Partial<Record<DiscSlotKey, DiscMainStatKey>>
  /** In-combat snapshot of the reference build, taken at pin time. */
  combatStats?: TheoReferenceCombatStats
}

/**
 * One row of the "what does another roll get me" table: adding a single
 * substat roll of `key` to the selected build, and the resulting change on
 * the optimization target (`value` raw, `percent` relative).
 */
export type StatUpgradeItem = {
  key: DiscSubStatKey
  label: string
  value: number
  percent: number
}

/**
 * The metric the upgrades were measured against (`dmg` / `daze` /
 * `buildup`), so the panel can label the columns without guessing.
 */
export type StatUpgradeGroup = {
  metric: 'dmg' | 'daze' | 'buildup'
  upgrades: StatUpgradeItem[]
}

export type EnemyConfig = {
  level: number
  defense: number
  stunMultiplier: number
}

export type AnalysisData = {
  selectedStats: BuildCombatStats | null
  equippedStats: BuildCombatStats | null
  targetValue: number
  /** Optimization-target value of the currently equipped build. */
  equippedTargetValue: number
  selectedDiscSubstats: SubstatRollInfo[]
  selectedDiscSetIds: string[]
  characterKey: CharacterKey
  selectedWengineKey?: string
  targetInfo: TargetFormulaInfo | null
  referenceComparison: ReferenceComparison | null
  /** Per-substat "+1 roll" damage deltas for the selected build. */
  statUpgrades: StatUpgradeGroup[]
  /** Enemy configuration the target was computed against. */
  enemyConfig: EnemyConfig
}

export interface BuildAnalysisOptions {
  /**
   * Checked while the per-source attribution runs; returning `true` abandons
   * the run (newer inputs arrived, or the panel unmounted).
   */
  shouldCancel?: () => boolean
}

export async function buildAnalysisData(
  params: {
    selectedBuild: { wengineKey?: string; discIds: DiscIds; value: number }
    enrichedBuilds: EnrichedBuild[]
    equippedBuildId: string
    getDisc: (id: string) => ICachedDisc | undefined
    team: Team
    character: ICachedCharacter
    getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined
    reference?: {
      profile: TheoReferenceShape
      value: number
      date: number
      stale: boolean
      weights: Partial<Record<DiscSubStatKey, number>>
      set4?: DiscSetKey
      set2?: DiscSetKey
      wengineKey?: string
      combatStats?: TheoReferenceCombatStats
    } | null
  },
  options: BuildAnalysisOptions = {}
): Promise<AnalysisData | null> {
  const {
    selectedBuild,
    enrichedBuilds,
    equippedBuildId,
    getDisc,
    team,
    character,
    getTeammateChar,
    reference,
  } = params

  const selectedId = `${selectedBuild.wengineKey ?? ''}-${Object.values(selectedBuild.discIds).join('-')}`
  const selectedEnriched =
    enrichedBuilds.find((b) => b.id === selectedId) ?? null
  const equippedEnriched =
    enrichedBuilds.find((b) => b.id === equippedBuildId) ?? null

  const selectedDiscSubstats = buildSubstatRolls(selectedBuild.discIds, getDisc)

  const referenceComparison = buildReferenceComparison(
    selectedBuild,
    selectedEnriched,
    getDisc,
    reference ?? null
  )

  const targetAnalysis = await buildTargetInfo(
    selectedBuild,
    getDisc,
    character,
    team,
    getTeammateChar,
    options.shouldCancel
  )
  if (options.shouldCancel?.()) return null
  const targetInfo = targetAnalysis?.targetInfo ?? null

  return {
    selectedStats:
      targetInfo?.buffedStats ?? selectedEnriched?.combatStats ?? null,
    equippedStats: equippedEnriched?.combatStats ?? null,
    targetValue: selectedEnriched?.value ?? selectedBuild.value,
    equippedTargetValue: equippedEnriched?.value ?? 0,
    selectedDiscSubstats,
    selectedDiscSetIds: selectedEnriched?.discSetIds ?? [],
    characterKey: character.key,
    selectedWengineKey: selectedBuild.wengineKey,
    targetInfo,
    referenceComparison,
    statUpgrades: targetAnalysis?.statUpgrades ?? [],
    enemyConfig: {
      level: team.enemyLvl,
      defense: team.enemyDef,
      stunMultiplier: team.enemyStunMultiplier,
    },
  }
}

function buildReferenceComparison(
  selectedBuild: { wengineKey?: string; discIds: DiscIds; value: number },
  selectedEnriched: EnrichedBuild | null,
  getDisc: (id: string) => ICachedDisc | undefined,
  reference: {
    profile: TheoReferenceShape
    value: number
    date: number
    stale: boolean
    weights: Partial<Record<DiscSubStatKey, number>>
    set4?: DiscSetKey
    set2?: DiscSetKey
    wengineKey?: string
    combatStats?: TheoReferenceCombatStats
  } | null
): ReferenceComparison | null {
  if (!reference || !(reference.value > 0)) return null
  const localRolls: Partial<Record<DiscSubStatKey, number>> = {}
  const localMains: Partial<Record<DiscSlotKey, DiscMainStatKey>> = {}
  for (const [slot, id] of Object.entries(selectedBuild.discIds)) {
    if (!id) continue
    const disc = getDisc(id)
    if (!disc) continue
    localMains[slot as DiscSlotKey] = disc.mainStatKey as DiscMainStatKey
    for (const sub of disc.substats) {
      if (!sub.key || !sub.upgrades) continue
      const key = sub.key as DiscSubStatKey
      localRolls[key] = (localRolls[key] ?? 0) + sub.upgrades
    }
  }
  const { tips, mainMismatches } = compareToReference(
    localRolls,
    localMains,
    reference.profile,
    reference.weights
  )
  let selectedValue = selectedEnriched?.value ?? selectedBuild.value
  // Float rounding between the solver's raw value and the display
  // recomputation can leave a meaningless 1-point gap when the selected
  // build IS the reference — snap it so the panel reads 100%, not 99.99%.
  if (
    Math.abs(selectedValue - reference.value) <=
    Math.max(1, reference.value * 1e-9)
  )
    selectedValue = reference.value
  const ratio = Math.max(0, Math.min(1, selectedValue / reference.value))
  return {
    ratio,
    grade: efficiencyToGrade(ratio),
    selectedValue,
    referenceValue: reference.value,
    date: reference.date,
    stale: reference.stale,
    tips,
    mainMismatches,
    set4: reference.set4,
    set2: reference.set2,
    wengineKey: reference.wengineKey,
    mainsBySlot: reference.profile.mainsBySlot,
    perfectRolls: reference.profile.perfectRolls,
    localRolls,
    localMains,
    combatStats: reference.combatStats,
  }
}

/** `buildTargetInfo` internals the panel reads beyond `TargetFormulaInfo`. */
type TargetAnalysis = {
  targetInfo: TargetFormulaInfo
  /** Summed optimization-target value of the selected build. */
  targetValue: number
  statUpgrades: StatUpgradeGroup[]
}

async function buildTargetInfo(
  selectedBuild: { wengineKey?: string; discIds: DiscIds },
  getDisc: (id: string) => ICachedDisc | undefined,
  character: ICachedCharacter,
  team: Team,
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined,
  shouldCancel?: () => boolean
): Promise<TargetAnalysis | null> {
  const frame = getTeamFrame0(team)
  if (!frame.tag) return null

  const formulaTag = targetTag(frame.tag)
  const targetInput = buildTargetInput(frame, formulaTag, team)

  const discEntries = Object.entries(selectedBuild.discIds).map(
    ([slot, id]) => {
      const disc = id ? getDisc(id) : undefined
      return [slot, disc] as const
    }
  )
  const discs = Object.fromEntries(discEntries) as Record<
    DiscSlotKey,
    ICachedDisc | undefined
  >

  const effectiveCharacter =
    selectedBuild.wengineKey !== undefined
      ? ({
          ...character,
          wengineKey: selectedBuild.wengineKey,
        } as ICachedCharacter)
      : character
  const entries = buildCalculatorEntries(
    effectiveCharacter,
    discs,
    team,
    getTeammateChar,
    getDisc
  )
  const calc = zzzCalculatorWithEntries(entries)

  const combatReader = convert(ownTag, {
    et: 'own',
    src: character.key,
    preset: 'preset0',
  })

  const buffedStats: BuildCombatStats = {
    hp: calc.compute(combatReader.final.hp).val,
    atk: calc.compute(combatReader.final.atk).val,
    def: calc.compute(combatReader.final.def).val,
    impact: calc.compute(combatReader.final.impact).val,
    critRate: calc.compute(combatReader.final.crit_).val,
    critDmg: calc.compute(combatReader.final.crit_dmg_).val,
    penRatio: calc.compute(combatReader.final.pen_).val,
    pen: calc.compute(combatReader.final.pen).val,
    enerRegen: calc.compute(combatReader.final.enerRegen).val,
    anomProf: calc.compute(combatReader.final.anomProf).val,
    anomMas: calc.compute(combatReader.final.anomMas).val,
    sheerForce: calc.compute(combatReader.final.sheerForce).val,
    dmgBonus: calc.compute(combatReader.final.dmg_).val,
    defIgn: calc.compute(combatReader.final.defIgn_).val,
  }

  const actionRows: Array<{
    name: string
    tag: Tag
    damageTypes: string[]
    value: number
    calcResult: CalcResult<number, CalcMeta<Tag, string>>
    buffedStats: BuildCombatStats | null
    target: ContributionTarget
  }> = []

  const readBuffedStats = (
    nameContext?: string,
    preset = 'preset0'
  ): BuildCombatStats => {
    if (!nameContext) return buffedStats
    const s = (r: any) =>
      calc.compute(
        r.with('name', nameContext as any).with('preset', preset as any)
      ).val
    return {
      hp: s(combatReader.final.hp),
      atk: s(combatReader.final.atk),
      def: s(combatReader.final.def),
      impact: s(combatReader.final.impact),
      critRate: s(combatReader.final.crit_),
      critDmg: s(combatReader.final.crit_dmg_),
      penRatio: s(combatReader.final.pen_),
      pen: s(combatReader.final.pen),
      enerRegen: s(combatReader.final.enerRegen),
      anomProf: s(combatReader.final.anomProf),
      anomMas: s(combatReader.final.anomMas),
      sheerForce: s(combatReader.final.sheerForce),
      dmgBonus: s(combatReader.final.dmg_),
      defIgn: s(combatReader.final.defIgn_),
    }
  }

  if (isComboTarget(frame.tag)) {
    // Each combo frame is bound to preset${i}, so per-hit buff overrides
    // (advanced mode) are reflected here, matching the solver summation.
    const comboFrames = getComboFrames(team)
    comboFrames.forEach((comboFrame, i) => {
      if (!comboFrame.tag?.sheet || !comboFrame.tag?.name) return
      const actionTag = targetTag({
        sheet: comboFrame.tag.sheet,
        name: comboFrame.tag.name,
      })
      const preset = `preset${i}`
      const targetRead = new Read(
        { src: character.key, ...actionTag },
        undefined
      ).with('preset', preset as any)
      const actionResult = calc.compute(targetRead)
      actionRows.push({
        name: `${comboFrame.tag.sheet}.${comboFrame.tag.name}`,
        tag: actionTag,
        damageTypes: tagDamageTypes(actionTag),
        value: actionResult.val * comboFrame.multiplier,
        calcResult: actionResult,
        buffedStats: readBuffedStats(comboFrame.tag.name, preset),
        target: { read: targetRead as any, multiplier: comboFrame.multiplier },
      })
    })
  } else {
    const targetRead = new Read(
      { src: character.key, ...formulaTag },
      undefined
    ).with('preset', 'preset0' as any)
    const calcResult = calc.compute(targetRead)
    const value = calcResult.val
    const actionName = formulaTag.name ?? undefined
    actionRows.push({
      name:
        frame.tag.sheet && frame.tag.name
          ? `${frame.tag.sheet}.${frame.tag.name}`
          : frame.tag.q && frame.tag.qt
            ? `${frame.tag.q} (${frame.tag.qt})`
            : 'Target',
      tag: formulaTag,
      damageTypes: tagDamageTypes(formulaTag),
      value,
      calcResult,
      buffedStats: readBuffedStats(actionName),
      target: { read: targetRead as any, multiplier: 1 },
    })
  }

  // Per-source damage attribution, computed once for the actions: one
  // calculator rebuild per source group, evaluated against every action's
  // exact target read (preset-scoped). Gated behind this panel (not the
  // solver loop), and chunked/cancellable because `#groups + 1` full
  // calculator builds is seconds of synchronous work that must not sit in a
  // render pass.
  // The main character's sheet is *not* passed as `mainKey` here, so it becomes
  // a source group like any other: it is where a kit's own gated buffs live,
  // and excluding it made every one of them unattributable. Removing that
  // group only drops her conditionals — the target formula and base stats are
  // written against `sheet: agg`/`iso`, so the target still computes.
  const sourcesByAction = await explainContributionsAsync(
    entries,
    undefined,
    actionRows.map((r) => [r.target]),
    (e) => zzzCalculatorWithEntries(e),
    { shouldCancel }
  )
  if (!sourcesByAction) return null

  const perActionDamage: PerActionDamage[] = actionRows.map((row, i) => ({
    name: row.name,
    tag: row.tag,
    damageTypes: row.damageTypes,
    value: row.value,
    calcResult: row.calcResult,
    buffedStats: row.buffedStats,
    sources: sourcesByAction[i] ?? [],
  }))

  // Recompute through the same per-preset + multiplier summation that
  // `computeBuildStats` uses, so the upgrade deltas line up with the row
  // values above instead of drifting on a different read path.
  const targetValue = computeBuildStats(
    effectiveCharacter,
    discs,
    team,
    targetInput,
    getTeammateChar,
    getDisc
  ).targetValue
  const baseValue =
    targetValue ?? perActionDamage.reduce((sum, row) => sum + row.value, 0)

  const statUpgrades = await computeStatUpgrades({
    discs,
    character: effectiveCharacter,
    team,
    getTeammateChar,
    getDisc,
    targetInput,
    metric: metricFromTag(formulaTag),
    baseValue,
    shouldCancel,
  })
  if (!statUpgrades) return null

  return {
    targetInfo: {
      frame,
      formulaTag,
      perActionDamage,
      buffedStats,
    },
    targetValue: baseValue,
    statUpgrades,
  }
}

/**
 * The optimization target as `computeBuildStats` expects it: a combo
 * becomes one entry per hit bound to `preset${i}` with its multiplier, a
 * single target stays a plain tag read on `preset0`.
 */
function buildTargetInput(
  frame: OptFrame,
  formulaTag: Tag,
  team: Team
): BuildTargetInput {
  if (isComboTarget(frame.tag)) {
    const rows: { tag: Tag; multiplier: number }[] = []
    for (const comboFrame of getComboFrames(team)) {
      if (!comboFrame.tag?.sheet || !comboFrame.tag?.name) continue
      rows.push({
        tag: targetTag({
          sheet: comboFrame.tag.sheet,
          name: comboFrame.tag.name,
        }),
        multiplier: comboFrame.multiplier,
      })
    }
    if (rows.length > 0) return rows
  }
  return formulaTag
}

/** Damage-target `q`s a formula tag can carry, per `isDmg` in formula-ui. */
const DAMAGE_QS = new Set([
  'standardDmg',
  'anomalyDmg',
  'sheerDmg',
  'sharpDmg',
  'maimDmg',
])

function metricFromTag(tag: Tag): StatUpgradeGroup['metric'] {
  const q = tag['q'] ?? ''
  if (DAMAGE_QS.has(q)) return 'dmg'
  if (q === 'daze' || q === 'daze_') return 'daze'
  if (q.includes('buildup')) return 'buildup'
  return 'dmg'
}

/**
 * Copy the disc set with one extra substat roll of `key` appended to the
 * first equipped disc. `discsToTagMapNodeEntries` sums substats by key, so
 * where the roll lands does not matter — only that it exists once.
 */
function withSubstatRoll(
  discs: Record<DiscSlotKey, ICachedDisc | undefined>,
  key: DiscSubStatKey
): Record<DiscSlotKey, ICachedDisc | undefined> {
  const next: Record<DiscSlotKey, ICachedDisc | undefined> = { ...discs }
  for (const slot of allDiscSlotKeys) {
    const disc = next[slot]
    if (!disc) continue
    next[slot] = {
      ...disc,
      substats: [...disc.substats, { key, upgrades: 1 } as ISubstat],
    }
    break
  }
  return next
}

/**
 * Simulate one extra substat roll per possible substat and report each
 * roll's delta on the optimization target. One full calculator build per
 * substat, so the loop yields between them and abandons the run on cancel.
 */
async function computeStatUpgrades(params: {
  discs: Record<DiscSlotKey, ICachedDisc | undefined>
  character: ICachedCharacter
  team: Team
  getTeammateChar?: (key: CharacterKey) => ICachedCharacter | undefined
  getDisc: (id: string) => ICachedDisc | undefined
  targetInput: BuildTargetInput
  metric: StatUpgradeGroup['metric']
  baseValue: number
  shouldCancel?: () => boolean
}): Promise<StatUpgradeGroup[] | null> {
  const {
    discs,
    character,
    team,
    getTeammateChar,
    getDisc,
    targetInput,
    metric,
    baseValue,
    shouldCancel,
  } = params
  if (!(baseValue > 0)) return []

  const upgrades: StatUpgradeItem[] = []
  for (const key of allDiscSubStatKeys) {
    await yieldToMain()
    if (shouldCancel?.()) return null
    let upgraded: number | undefined
    try {
      upgraded = computeBuildStats(
        character,
        withSubstatRoll(discs, key),
        team,
        targetInput,
        getTeammateChar,
        getDisc
      ).targetValue
    } catch {
      continue
    }
    if (upgraded === undefined) continue
    const value = upgraded - baseValue
    // Sub-rounding noise isn't a meaningful upgrade.
    if (!(value > 1)) continue
    upgrades.push({
      key,
      label: statKeyTextMap[key] ?? key,
      value,
      percent: value / baseValue,
    })
  }
  upgrades.sort((a, b) => b.value - a.value)
  return upgrades.length > 0 ? [{ metric, upgrades }] : []
}

/** Yield to the browser so a long analysis pass never blocks a paint. */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function buildSubstatRolls(
  discIds: DiscIds,
  getDisc: (id: string) => ICachedDisc | undefined
): SubstatRollInfo[] {
  const rollMap = new Map<DiscSubStatKey, { rolls: number; value: number }>()

  for (const id of Object.values(discIds)) {
    if (!id) continue
    const disc = getDisc(id)
    if (!disc) continue

    for (const sub of disc.substats as ISubstat[]) {
      if (!sub.key || sub.upgrades === 0) continue
      const key = sub.key as DiscSubStatKey
      const existing = rollMap.get(key)
      const rollValue = getDiscSubStatBaseVal(key, disc.rarity)
      if (existing) {
        existing.rolls += sub.upgrades
        existing.value += rollValue * sub.upgrades
      } else {
        rollMap.set(key, {
          rolls: sub.upgrades,
          value: rollValue * sub.upgrades,
        })
      }
    }
  }

  return Array.from(rollMap.entries())
    .map(([key, { rolls, value }]) => ({
      key,
      label: statKeyTextMap[key] ?? key,
      totalRolls: rolls,
      totalValue: value,
      perRollValue: getDiscSubStatBaseVal(key, 'S'),
    }))
    .sort((a, b) => b.totalRolls - a.totalRolls)
}

const STAT_COMPARE_CONFIG: Array<{
  key: keyof BuildCombatStats
  label: string
  iconKey: string
  isPercent: boolean
}> = [
  { key: 'atk', label: 'ATK', iconKey: 'atk', isPercent: false },
  { key: 'hp', label: 'HP', iconKey: 'hp', isPercent: false },
  { key: 'def', label: 'DEF', iconKey: 'def', isPercent: false },
  { key: 'impact', label: 'Impact', iconKey: 'impact', isPercent: false },
  { key: 'critRate', label: 'CRIT Rate', iconKey: 'crit_', isPercent: true },
  { key: 'critDmg', label: 'CRIT DMG', iconKey: 'crit_dmg_', isPercent: true },
  { key: 'penRatio', label: 'PEN Ratio', iconKey: 'pen_', isPercent: true },
  { key: 'pen', label: 'PEN', iconKey: 'pen', isPercent: false },
  { key: 'dmgBonus', label: 'DMG Bonus', iconKey: 'dmg_', isPercent: true },
  {
    key: 'enerRegen',
    label: 'Energy Regen',
    iconKey: 'enerRegen',
    isPercent: false,
  },
  {
    key: 'anomProf',
    label: 'Anomaly Prof.',
    iconKey: 'anomProf',
    isPercent: false,
  },
  {
    key: 'anomMas',
    label: 'Anomaly Mastery',
    iconKey: 'anomMas',
    isPercent: false,
  },
  {
    key: 'sheerForce',
    label: 'Sheer Force',
    iconKey: 'sheerForce',
    isPercent: false,
  },
  { key: 'defIgn', label: 'DEF Ignore', iconKey: 'defIgn_', isPercent: true },
]

export function buildStatComparisons(
  equipped: BuildCombatStats | null,
  selected: BuildCombatStats | null
): StatComparisonEntry[] {
  if (!equipped || !selected) return []
  return STAT_COMPARE_CONFIG.map(({ key, label, iconKey, isPercent }) => {
    const unit = isPercent ? '%' : ''
    return {
      key,
      label,
      iconKey,
      current: equipped[key],
      improved: selected[key],
      unit,
      isPercent,
    }
  })
}
