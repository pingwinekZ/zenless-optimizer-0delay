import type { Candidate } from '@zenless-optimizer/game-opt/solver'
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
  discSlotToMainStatKeys,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
} from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import { allStats } from '@zenless-optimizer/zzz/stats'
import {
  getCharacterEffectiveMainStats,
  getCharacterEffectiveStats,
} from '@zenless-optimizer/zzz/util'

const THEORETICAL_RARITY = 'S' as const
const THEORETICAL_LEVEL = 15
const TOTAL_DISCS = 6
const UPGRADE_ROLLS_PER_DISC = 5
const UPGRADE_TOTAL = UPGRADE_ROLLS_PER_DISC * TOTAL_DISCS
/** Default minimum effective substats in a 4-substat combo for inclusion */
export const DEFAULT_MIN_EFFECTIVE_PER_COMBO = 3
/**
 * Number of `Uint16` entries per recipe in the compact descriptor index:
 * `[mainStatComboIdx, substatComboIdx, u0, u1, u2, u3, set2Idx]`.
 *
 * Every recipe in the space is fully determined by those seven small integers
 * plus the generator's closed-over configuration (`set4`, `setFilter2`, the
 * effective substats, and any substat roll targets), so the metadata for a
 * recipe can be rebuilt on demand instead of being stored for all of them.
 * This is what keeps peak memory proportional to `recipes.length` rather
 * than to hundreds of bytes per recipe.
 *
 * `set2Idx` is the index into the `setFilter2` array identifying which 2p
 * set was assigned to this recipe (0 when there is only one option). When the
 * chosen 2p set equals the 4p set, the recipe gets count 6 instead of 4+2.
 */
export const RECIPE_DESCRIPTOR_STRIDE = 7

export interface GenerateTheoreticalOptions {
  /**
   * Minimum number of effective substats a 4-substat combo must contain to be
   * enumerated. Defaults to `DEFAULT_MIN_EFFECTIVE_PER_COMBO` (3). Only lower
   * this deliberately: it widens the recipe space (and the search), it never
   * narrows the results.
   */
  minEffectivePerCombo?: number
  /**
   * Apply the non-effective dominance filter (skip distributions where a
   * non-effective substat out-rolls every effective one). Defaults to `true`;
   * the default reproduces the historical recipe set exactly.
   */
  applyDominanceFilter?: boolean
}

export interface TheoreticalDiscStats {
  /** Number of generated recipes (== `recipes.length`). */
  recipeCount: number
  /** Number of enumerated main-stat combinations (slots 4/5/6). */
  mainStatComboCount: number
  /** Number of 4-substat combos that passed the effective-substat filter. */
  substatComboCount: number
  /** Distributions skipped because no per-disc packing exists. */
  infeasibleDistributions: number
}

/**
 * Plain-data description of a generated recipe space: the two combo tables the
 * descriptor index points into, the set configuration, and the effective
 * substats. Only tens of entries, so it is cheap to move between threads — and
 * together with a `recipeIndex` it is enough to rebuild any recipe's metadata.
 *
 * `set4`/`set2` are undefined only when the corresponding filter was empty,
 * in which case no recipe is generated at all.
 */
export interface TheoreticalDiscContext {
  recipeCount: number
  /** The per-slot-4/5/6 main-stat combinations, as `[slot, mainStat]` entries. */
  mainStatCombos: [DiscSlotKey, DiscMainStatKey][][]
  /** The 4-substat combos that passed the effective-substat filter. */
  substatCombos: DiscSubStatKey[][]
  /** Per-substat roll-count overrides (debug/targeted mode), if any. */
  substatRollTargets?: Partial<Record<DiscSubStatKey, number>>
  set4: DiscSetKey | undefined
  /**
   * The 2p set candidates. `set2` in the context is the first entry; the
   * descriptor's `set2Idx` picks which entry was used for a given recipe.
   */
  setFilter2: DiscSetKey[]
  effectiveSubstats: DiscSubStatKey[]
}

/**
 * Rebuild the `BuildRecipe` metadata for one recipe from a descriptor index and
 * its context. Pure and standalone: this is exactly what `materializeRecipe`
 * does, so a caller holding only a transferred index + context (a worker
 * client, for instance) can rebuild recipes without re-running the generator.
 */
export function materializeRecipeFromIndex(
  recipeIdx: number,
  recipeIndex: Uint16Array,
  ctx: TheoreticalDiscContext
): BuildRecipe | undefined {
  if (recipeIdx < 0 || recipeIdx >= ctx.recipeCount) return undefined
  const o = recipeIdx * RECIPE_DESCRIPTOR_STRIDE
  const allMainStats = buildAllMainStats(ctx.mainStatCombos[recipeIndex[o]])
  const comboSubstats = ctx.substatCombos[recipeIndex[o + 1]]
  const blockedInfo = getBlockedInfo(comboSubstats, allMainStats)
  const totals: [number, number, number, number] = [
    recipeIndex[o + 2] + blockedInfo[0].baseRolls,
    recipeIndex[o + 3] + blockedInfo[1].baseRolls,
    recipeIndex[o + 4] + blockedInfo[2].baseRolls,
    recipeIndex[o + 5] + blockedInfo[3].baseRolls,
  ]
  const assignment = assignPerDiscRolls(
    comboSubstats,
    blockedInfo,
    totals,
    allMainStats,
    ctx.effectiveSubstats
  )
  if (ctx.substatRollTargets) {
    for (const [keyStr, targetRolls] of Object.entries(
      ctx.substatRollTargets
    )) {
      const key = keyStr as DiscSubStatKey
      if (!allDiscSubStatKeys.includes(key)) continue
      assignment.rollTotals[key] = targetRolls
    }
  }
  // Look up the 2p set from the descriptor's set2Idx entry.
  const set2Idx = recipeIndex[o + 6] ?? 0
  const set2Key = (ctx.setFilter2?.[set2Idx] ??
    ctx.setFilter2?.[0]) as DiscSetKey
  return {
    id: `recipe_${recipeIdx}`,
    mainStats: allMainStats,
    totalRolls: { ...assignment.rollTotals },
    appearances: { ...assignment.appearances },
    perDiscSubstats: assignment.perDisc,
    set4: ctx.set4 as DiscSetKey,
    set2: set2Key,
  }
}

export interface TheoreticalDiscResult {
  recipes: Candidate<string>[]
  /**
   * Compact per-recipe descriptor index, `RECIPE_DESCRIPTOR_STRIDE` entries
   * per recipe. Prefer `materializeRecipe` over decoding this directly.
   */
  recipeIndex: Uint16Array
  /**
   * Rebuild the `BuildRecipe` metadata for one recipe index. Exact: it re-runs
   * the same deterministic per-disc packing the generator validated. Only call
   * it for recipes that actually surface (the solver's top-N and the row the
   * user has selected) — never for the whole space.
   */
  materializeRecipe: (index: number) => BuildRecipe | undefined
  /**
   * Everything `materializeRecipe` closes over, as plain data.
   * `materializeRecipe` is exactly
   * `materializeRecipeFromIndex(index, recipeIndex, context)`.
   */
  context: TheoreticalDiscContext
  stats: TheoreticalDiscStats
  /**
   * DEBUG/TEST ONLY. Materializes every recipe's `BuildRecipe` into one object,
   * which is exactly the allocation this generator exists to avoid. Reading
   * this property for a wide configuration will exhaust memory.
   */
  readonly recipeMap: Record<string, BuildRecipe>
}

interface BlockedInfo {
  isBlocked: boolean
  blockedDiscs: number[]
  baseRolls: number
  maxUpgrade: number
}

/**
 * Precomputed Hall capacities: for each of the 15 non-empty subsets of the 4
 * combo columns, the total upgrade capacity of the discs those columns can use
 * together. A distribution is placeable iff every subset's demand fits.
 */
type SubsetCaps = number[]

export function generateTheoreticalDiscs(
  characterKey: CharacterKey,
  setFilter2: DiscSetKey[],
  setFilter4: DiscSetKey[],
  slotFilters?: {
    4?: DiscMainStatKey[]
    5?: DiscMainStatKey[]
    6?: DiscMainStatKey[]
  },
  substatRollTargets?: Partial<Record<DiscSubStatKey, number>>,
  options?: GenerateTheoreticalOptions
): TheoreticalDiscResult {
  const minEffectivePerCombo =
    options?.minEffectivePerCombo ?? DEFAULT_MIN_EFFECTIVE_PER_COMBO
  const applyDominanceFilter = options?.applyDominanceFilter ?? true

  const setKeys = [...new Set([...setFilter4, ...setFilter2])]
  if (setKeys.length === 0) {
    return emptyResult()
  }

  const set4 = setFilter4[0]
  const allSubstats = [...allDiscSubStatKeys]
  const effectiveSubstats = getCharacterEffectiveStats(characterKey)
  const effectiveSet = new Set<string>(effectiveSubstats)

  const effectiveMainStats = {
    ...getCharacterEffectiveMainStats(characterKey),
  }
  if (slotFilters) {
    for (const [slot, filter] of Object.entries(slotFilters)) {
      const slotKey = slot as DiscSlotKey
      if (filter && filter.length > 0) {
        effectiveMainStats[slotKey] = filter
      }
    }
  }

  const mainStatCombos = generateMainStatCombos(effectiveMainStats)

  // Substats are identical for every main-stat combo, so the filtered combo
  // list is built once (it also backs the descriptor index).
  const substatCombos: DiscSubStatKey[][] = []
  for (const comboIndices of enumerateCombos(
    allSubstats,
    effectiveSet,
    effectiveSubstats,
    minEffectivePerCombo,
    substatRollTargets
  )) {
    substatCombos.push(
      comboIndices.map((i) => allSubstats[i]) as DiscSubStatKey[]
    )
  }
  if (substatCombos.length === 0) {
    return emptyResult()
  }

  // Hoist the per-substat base values: they are constant across the whole
  // enumeration and were previously recomputed for every roll of every recipe.
  const subStatBaseVals = {} as Record<DiscSubStatKey, number>
  for (const key of allDiscSubStatKeys) {
    subStatBaseVals[key] = getDiscSubStatBaseVal(key, THEORETICAL_RARITY)
  }
  const isArmorerForCap = allStats.char[characterKey]?.specialty === 'armorer'
  const critCap = isArmorerForCap ? 1.95 : 0.95

  // Substat roll targets override the aggregate value for the targeted keys,
  // and are applied *before* the aggregate substat totals are accumulated.
  const targetEntries: Array<[string, number]> = []
  if (substatRollTargets) {
    for (const [keyStr, targetRolls] of Object.entries(substatRollTargets)) {
      const key = keyStr as DiscSubStatKey
      if (!allDiscSubStatKeys.includes(key)) continue
      targetEntries.push([key, subStatBaseVals[key] * targetRolls])
    }
  }

  const recipes: Candidate<string>[] = []
  // The exact recipe count is not known before enumeration, so the compact
  // descriptor index grows geometrically and is trimmed once at the end.
  let indexBuf = new Uint16Array(4096 * RECIPE_DESCRIPTOR_STRIDE)
  const ensureIndexCapacity = (forRecipe: number) => {
    const needed = (forRecipe + 1) * RECIPE_DESCRIPTOR_STRIDE
    if (needed <= indexBuf.length) return
    let next = indexBuf.length * 2
    while (next < needed) next *= 2
    const grown = new Uint16Array(next)
    grown.set(indexBuf)
    indexBuf = grown
  }
  let recipeCount = 0
  let infeasibleDistributions = 0

  const upgrades: [number, number, number, number] = [0, 0, 0, 0]

  for (
    let mainComboIdx = 0;
    mainComboIdx < mainStatCombos.length;
    mainComboIdx++
  ) {
    const allMainStats = buildAllMainStats(mainStatCombos[mainComboIdx])

    // Main-stat contributions are fixed for the whole main-stat combo.
    const mainVals: Array<[DiscMainStatKey, number]> = []
    for (const slotKey of allDiscSlotKeys) {
      const main = allMainStats[slotKey]
      mainVals.push([
        main,
        getDiscMainStatVal(THEORETICAL_RARITY, main, THEORETICAL_LEVEL),
      ])
    }

    for (let comboIdx = 0; comboIdx < substatCombos.length; comboIdx++) {
      const comboSubstats = substatCombos[comboIdx]
      const blockedInfo = getBlockedInfo(comboSubstats, allMainStats)
      const subsetCaps = computeSubsetCaps(blockedInfo)

      let hasNonEffective = false
      const effectiveMask: boolean[] = []
      for (const s of comboSubstats) {
        const eff = effectiveSet.has(s)
        effectiveMask.push(eff)
        if (!eff) hasNonEffective = true
      }
      const useDominance = applyDominanceFilter && hasNonEffective

      const base = blockedInfo.map((b) => b.baseRolls)
      const maxU = blockedInfo.map((b) => b.maxUpgrade)

      // A disc can never carry a substat equal to its own main stat. Whenever
      // a combo substat is blocked on a disc, that disc gets exactly one filler
      // roll instead (a substat outside the combo). Both the key and the count
      // are determined by the combo and the disc's main stat alone, so the
      // filler contribution is computed once per (combo, main-stat combo)
      // rather than being rediscovered while packing rolls onto discs.
      const fillerCounts = new Map<DiscSubStatKey, number>()
      for (const slotKey of allDiscSlotKeys) {
        const mainStat = allMainStats[slotKey]
        if (!comboSubstats.includes(mainStat as DiscSubStatKey)) continue
        const fillerKey = pickFiller(
          mainStat,
          new Set<string>(comboSubstats),
          effectiveSubstats
        )
        fillerCounts.set(fillerKey, (fillerCounts.get(fillerKey) ?? 0) + 1)
      }
      const fillerEntries = [...fillerCounts]

      for (let u0 = 0; u0 <= Math.min(maxU[0], UPGRADE_TOTAL); u0++) {
        const s1 = UPGRADE_TOTAL - u0
        for (let u1 = 0; u1 <= Math.min(maxU[1], s1); u1++) {
          const s2 = s1 - u1
          for (let u2 = 0; u2 <= Math.min(maxU[2], s2); u2++) {
            const u3 = s2 - u2
            if (u3 < 0 || u3 > maxU[3]) continue

            const t0 = u0 + base[0]
            const t1 = u1 + base[1]
            const t2 = u2 + base[2]
            const t3 = u3 + base[3]

            if (useDominance) {
              let minEff = Infinity
              if (effectiveMask[0] && t0 < minEff) minEff = t0
              if (effectiveMask[1] && t1 < minEff) minEff = t1
              if (effectiveMask[2] && t2 < minEff) minEff = t2
              if (effectiveMask[3] && t3 < minEff) minEff = t3
              if (
                (!effectiveMask[0] && t0 > minEff) ||
                (!effectiveMask[1] && t1 > minEff) ||
                (!effectiveMask[2] && t2 > minEff) ||
                (!effectiveMask[3] && t3 > minEff)
              ) {
                continue
              }
            }

            upgrades[0] = u0
            upgrades[1] = u1
            upgrades[2] = u2
            upgrades[3] = u3
            if (!subsetFeasible(upgrades, subsetCaps)) {
              infeasibleDistributions++
              continue
            }

            const id = `recipe_${recipeCount}`
            const candidate: Record<string, number | string> = { id }
            for (const [main, val] of mainVals) {
              candidate[main] = ((candidate[main] as number) ?? 0) + val
            }
            // Targeted-mode override: these keys take the requested roll
            // count verbatim (the aggregate accumulation below still adds on
            // top, matching the historical behaviour).
            for (const [key, val] of targetEntries) {
              candidate[key] = val
            }

            // Aggregate substat totals: every unblocked disc of column `i`
            // contributes `rowB[row][col] + 1` rolls, which sums to exactly
            // `totals[i]` across the six discs.
            for (let col = 0; col < 4; col++) {
              const key = comboSubstats[col]
              const total =
                col === 0 ? t0 : col === 1 ? t1 : col === 2 ? t2 : t3
              candidate[key] =
                ((candidate[key] as number) ?? 0) + subStatBaseVals[key] * total
            }
            for (const [key, count] of fillerEntries) {
              candidate[key] =
                ((candidate[key] as number) ?? 0) + subStatBaseVals[key] * count
            }

            // Apply crit cap before cloning for 2p variants
            if (typeof candidate.crit_ === 'number') {
              candidate.crit_ = Math.min(candidate.crit_, critCap)
            }

            // When multiple 2p sets are selected, produce one recipe per
            // assignment so the solver can evaluate each 2p bonus.
            for (let s2i = 0; s2i < setFilter2.length; s2i++) {
              const chosenSet2 = setFilter2[s2i]
              // Clone the base candidate for each 2p variant
              const variant = { ...candidate }
              if (set4 === chosenSet2) {
                variant[set4] = 6
              } else {
                variant[set4] = 4
                variant[chosenSet2] = 2
              }

              // Each variant gets a unique id matching its descriptor offset.
              // The id was set on `candidate` before the loop, so it would be
              // shared by all variants — override it here.
              variant.id = `recipe_${recipeCount}`

              ensureIndexCapacity(recipeCount)
              const o = recipeCount * RECIPE_DESCRIPTOR_STRIDE
              indexBuf[o] = mainComboIdx
              indexBuf[o + 1] = comboIdx
              indexBuf[o + 2] = u0
              indexBuf[o + 3] = u1
              indexBuf[o + 4] = u2
              indexBuf[o + 5] = u3
              indexBuf[o + 6] = s2i

              recipes.push(variant as Candidate<string>)
              recipeCount++
            }
          }
        }
      }
    }
  }

  const recipeIndex = indexBuf.slice(0, recipeCount * RECIPE_DESCRIPTOR_STRIDE)

  // Everything the materializer needs, as plain (transferable) data.
  const context: TheoreticalDiscContext = {
    recipeCount,
    mainStatCombos,
    substatCombos,
    substatRollTargets,
    set4,
    setFilter2,
    effectiveSubstats,
  }
  const materializeRecipe = (recipeIdx: number): BuildRecipe | undefined =>
    materializeRecipeFromIndex(recipeIdx, recipeIndex, context)

  return {
    recipes,
    recipeIndex,
    materializeRecipe,
    context,
    stats: {
      recipeCount,
      mainStatComboCount: mainStatCombos.length,
      substatComboCount: substatCombos.length,
      infeasibleDistributions,
    },
    get recipeMap(): Record<string, BuildRecipe> {
      const map: Record<string, BuildRecipe> = {}
      for (let i = 0; i < recipeCount; i++) {
        const recipe = materializeRecipe(i)
        if (recipe) map[recipe.id] = recipe
      }
      return map
    },
  }
}

function emptyResult(): TheoreticalDiscResult {
  return {
    recipes: [],
    recipeIndex: new Uint16Array(0),
    materializeRecipe: () => undefined,
    context: {
      recipeCount: 0,
      mainStatCombos: [],
      substatCombos: [],
      set4: undefined,
      setFilter2: [],
      effectiveSubstats: [],
    },
    stats: {
      recipeCount: 0,
      mainStatComboCount: 0,
      substatComboCount: 0,
      infeasibleDistributions: 0,
    },
    recipeMap: {},
  }
}

function buildAllMainStats(
  mainStats: [DiscSlotKey, DiscMainStatKey][]
): Record<DiscSlotKey, DiscMainStatKey> {
  return {
    '1': 'hp',
    '2': 'atk',
    '3': 'def',
    '4':
      mainStats.find(([s]) => s === '4')?.[1] ?? discSlotToMainStatKeys['4'][0],
    '5':
      mainStats.find(([s]) => s === '5')?.[1] ?? discSlotToMainStatKeys['5'][0],
    '6':
      mainStats.find(([s]) => s === '6')?.[1] ?? discSlotToMainStatKeys['6'][0],
  }
}

/** Yields the indices of every 4-substat combo that passes the filters. */
function* enumerateCombos(
  allSubstats: readonly string[],
  effectiveSet: Set<string>,
  effectiveSubstats: DiscSubStatKey[],
  minEffective: number,
  substatRollTargets?: Partial<Record<DiscSubStatKey, number>>
): Generator<[number, number, number, number]> {
  if (substatRollTargets && Object.keys(substatRollTargets).length > 0) {
    const targeted = buildTargetedCombo(
      allSubstats,
      effectiveSubstats,
      substatRollTargets
    )
    if (targeted) yield targeted
    return
  }

  const n = allSubstats.length
  for (let i = 0; i < n; i++) {
    const ei = effectiveSet.has(allSubstats[i]) ? 1 : 0
    for (let j = i + 1; j < n; j++) {
      const ej = ei + (effectiveSet.has(allSubstats[j]) ? 1 : 0)
      for (let k = j + 1; k < n; k++) {
        const ek = ej + (effectiveSet.has(allSubstats[k]) ? 1 : 0)
        for (let l = k + 1; l < n; l++) {
          const effCount = ek + (effectiveSet.has(allSubstats[l]) ? 1 : 0)
          if (effCount >= minEffective) {
            yield [i, j, k, l]
          }
        }
      }
    }
  }
}

/**
 * Build the single combo used in targeted mode: the one containing all
 * targeted substats, with the remaining slots filled from effective substats.
 */
function buildTargetedCombo(
  allSubstats: readonly string[],
  effectiveSubstats: DiscSubStatKey[],
  substatRollTargets: Partial<Record<DiscSubStatKey, number>>
): [number, number, number, number] | undefined {
  const targetedKeys = new Set(
    Object.keys(substatRollTargets) as DiscSubStatKey[]
  )

  const comboKeys: DiscSubStatKey[] = [...targetedKeys]
  for (const effKey of effectiveSubstats) {
    if (comboKeys.length >= 4) break
    if (!comboKeys.includes(effKey)) {
      comboKeys.push(effKey)
    }
  }
  if (comboKeys.length < 4) {
    for (const sk of allSubstats) {
      if (comboKeys.length >= 4) break
      if (!comboKeys.includes(sk as DiscSubStatKey)) {
        comboKeys.push(sk as DiscSubStatKey)
      }
    }
  }

  const result = comboKeys
    .slice(0, 4)
    .map((k) => allSubstats.indexOf(k))
    .filter((i) => i >= 0) as [number, number, number, number]

  return result.length === 4 ? result : undefined
}

function getBlockedInfo(
  comboSubstats: DiscSubStatKey[],
  allMainStats: Record<DiscSlotKey, DiscMainStatKey>
): BlockedInfo[] {
  return comboSubstats.map((key) => {
    // A disc can never have a substat that duplicates its main stat, so a
    // substat type is blocked on EVERY disc whose main stat matches it
    // (e.g., slots 5 and 6 can both have an ATK% main).
    const blockedDiscs = allDiscSlotKeys
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot }) => allMainStats[slot] === key)
      .map(({ idx }) => idx)
    const isBlocked = blockedDiscs.length > 0
    const freeDiscs = TOTAL_DISCS - blockedDiscs.length
    return {
      isBlocked,
      blockedDiscs,
      baseRolls: isBlocked ? freeDiscs : TOTAL_DISCS,
      maxUpgrade: isBlocked
        ? freeDiscs * UPGRADE_ROLLS_PER_DISC
        : TOTAL_DISCS * UPGRADE_ROLLS_PER_DISC,
    }
  })
}

/**
 * Total upgrade capacity for each of the 15 non-empty column subsets. Together
 * with the demand of each subset this is Hall's condition, which is exactly
 * equivalent to "some per-disc packing exists" (the code used to discover
 * infeasibility by attempting a packing and inspecting the leftover).
 */
function computeSubsetCaps(blockedInfo: BlockedInfo[]): SubsetCaps {
  const freeBits = blockedInfo.map((b) => {
    let bits = 0
    for (let r = 0; r < TOTAL_DISCS; r++) {
      if (!b.blockedDiscs.includes(r)) bits |= 1 << r
    }
    return bits
  })
  const caps: number[] = new Array(16).fill(0)
  for (let mask = 1; mask < 16; mask++) {
    let bits = 0
    for (let c = 0; c < 4; c++) {
      if (mask & (1 << c)) bits |= freeBits[c]
    }
    let discs = 0
    for (let b = bits; b; b &= b - 1) discs++
    caps[mask] = discs * UPGRADE_ROLLS_PER_DISC
  }
  return caps
}

/**
 * Hall's condition against precomputed subset capacities. Exact: a
 * distribution of splittable integer demands over integer per-disc capacities
 * is placeable iff every demand subset fits its combined capacity.
 */
function subsetFeasible(
  upgrades: [number, number, number, number],
  caps: SubsetCaps
): boolean {
  for (let mask = 1; mask < 16; mask++) {
    let demand = 0
    for (let c = 0; c < 4; c++) {
      if (mask & (1 << c)) demand += upgrades[c]
    }
    if (demand > caps[mask]) return false
  }
  return true
}

interface PerDiscAssignment {
  perDisc: { key: DiscSubStatKey; upgrades: number }[][]
  rollTotals: Partial<Record<DiscSubStatKey, number>>
  statTotals: Record<string, number>
  appearances: Partial<Record<DiscSubStatKey, number>>
  leftover: number[]
}

/**
 * Deterministically lay the aggregate upgrade counts onto the six discs. Only
 * called when a recipe actually needs its per-disc breakdown (see
 * `materializeRecipe`); the enumeration itself never needs it.
 */
function assignPerDiscRolls(
  comboSubstats: DiscSubStatKey[],
  blockedInfo: BlockedInfo[],
  totals: [number, number, number, number],
  allMainStats: Record<DiscSlotKey, DiscMainStatKey>,
  effectiveSubstats?: DiscSubStatKey[]
): PerDiscAssignment {
  const upgrades = totals.map((t, i) => t - blockedInfo[i].baseRolls)

  const baseOrder = [...Array(4).keys()].sort(
    (a, b) => upgrades[b] - upgrades[a]
  )
  let packed = packColumns(upgrades, blockedInfo, baseOrder)
  if (packed.leftover.some((n) => n > 0)) {
    // The greedy desc-order packing is incomplete: it saturates the
    // lowest-index discs first, which are the discs shared between columns
    // (e.g., AP hogging slots 1-3 leaves no room for atk_ upgrades even
    // though atk_ could use its exclusive slot 4). Retry every column
    // order (4! = 24), then fall back to an exact feasibility check plus
    // backtracking, so realizable recipes are not silently dropped.
    const orders = [
      baseOrder,
      ...allPermutations([0, 1, 2, 3]).filter(
        (p) => p.join() !== baseOrder.join()
      ),
    ]
    for (const order of orders) {
      const attempt = packColumns(upgrades, blockedInfo, order)
      if (attempt.leftover.every((n) => n === 0)) {
        packed = attempt
        break
      }
    }
    if (packed.leftover.some((n) => n > 0)) {
      if (
        subsetFeasible(
          upgrades as [number, number, number, number],
          computeSubsetCaps(blockedInfo)
        )
      ) {
        const exact = findExactPacking(upgrades, blockedInfo)
        if (exact) packed = exact
      }
      if (packed.leftover.some((n) => n > 0)) {
        // No packing exists — physically impossible; keep the base-order
        // result so the caller's leftover check skips the recipe.
        packed = packColumns(upgrades, blockedInfo, baseOrder)
      }
    }
  }

  const rowB = packed.rowB
  const leftover = packed.leftover

  const perDisc: { key: DiscSubStatKey; upgrades: number }[][] = []
  const rollTotals: Partial<Record<DiscSubStatKey, number>> = {}
  const statTotals: Record<string, number> = {}
  const appearances: Partial<Record<DiscSubStatKey, number>> = {}

  for (let row = 0; row < 6; row++) {
    const slotKey = allDiscSlotKeys[row]
    const mainStat = allMainStats[slotKey]
    const disc: { key: DiscSubStatKey; upgrades: number }[] = []
    let fillerPlaced = false

    for (let col = 0; col < 4; col++) {
      const key = comboSubstats[col]

      if (blockedInfo[col].blockedDiscs.includes(row)) {
        if (!fillerPlaced) {
          const existingKeys = new Set(comboSubstats)
          const fillerKey = pickFiller(
            mainStat,
            existingKeys,
            effectiveSubstats
          )
          disc.push({ key: fillerKey, upgrades: 1 })
          fillerPlaced = true
        }
        continue
      }

      const totalRolls = rowB[row][col] + 1
      disc.push({ key, upgrades: totalRolls })
    }

    for (const s of disc) {
      rollTotals[s.key] = (rollTotals[s.key] ?? 0) + s.upgrades
      statTotals[s.key] =
        (statTotals[s.key] ?? 0) +
        getDiscSubStatBaseVal(s.key, THEORETICAL_RARITY) * s.upgrades
      appearances[s.key] = (appearances[s.key] ?? 0) + 1
    }

    perDisc.push(disc)
  }

  return { perDisc, rollTotals, statTotals, appearances, leftover }
}

/**
 * Pack a column order's upgrade rolls onto the free discs, least-used
 * discs first so each column occupies as few discs as possible.
 */
function packColumns(
  upgrades: number[],
  blockedInfo: BlockedInfo[],
  colOrder: number[]
): { rowB: number[][]; leftover: number[] } {
  const rowB: number[][] = Array.from({ length: TOTAL_DISCS }, () => [
    0, 0, 0, 0,
  ])
  const rowUsed: number[] = [0, 0, 0, 0, 0, 0]
  const leftover = [0, 0, 0, 0]

  for (const col of colOrder) {
    let remaining = upgrades[col]
    if (remaining <= 0) continue

    const blockedDiscs = blockedInfo[col].blockedDiscs

    const rows = [...Array(TOTAL_DISCS).keys()]
      .filter((row) => !blockedDiscs.includes(row))
      .sort((a, b) => rowUsed[a] - rowUsed[b])

    for (const row of rows) {
      if (remaining <= 0) break
      const capacity = UPGRADE_ROLLS_PER_DISC - rowUsed[row]
      if (capacity <= 0) continue
      const assign = Math.min(capacity, remaining)
      rowB[row][col] = assign
      rowUsed[row] += assign
      remaining -= assign
    }
    // A distribution whose upgrades cannot all be placed on the free discs
    // (e.g., two columns both capped by their shared discs) is physically
    // impossible; the caller skips the recipe so it never surfaces as a
    // build with fewer than 6*4 + 30 = 54 substat rolls.
    if (remaining > 0) leftover[col] = remaining
  }

  return { rowB, leftover }
}

/**
 * Backtracking search for an actual layout of a feasible distribution.
 * Rows are tried most-exclusive-first (discs usable by the fewest other
 * non-zero columns) and filled to capacity before the next, which finds a
 * valid layout quickly for these tiny 4x6 instances. Returns null only
 * when no packing exists.
 */
function findExactPacking(
  upgrades: number[],
  blockedInfo: BlockedInfo[]
): { rowB: number[][]; leftover: number[] } | null {
  const rowB: number[][] = Array.from({ length: TOTAL_DISCS }, () => [
    0, 0, 0, 0,
  ])
  const used = new Array(TOTAL_DISCS).fill(0)

  const colOrder = [...Array(4).keys()].sort(
    (a, b) => upgrades[b] - upgrades[a]
  )

  const rec = (ci: number): boolean => {
    if (ci === 4) return true
    const col = colOrder[ci]
    const need = upgrades[col]
    if (need === 0) return rec(ci + 1)

    const exclusivity = new Array(TOTAL_DISCS).fill(0)
    for (let c = 0; c < 4; c++) {
      if (c === col || upgrades[c] === 0) continue
      for (let r = 0; r < TOTAL_DISCS; r++) {
        if (!blockedInfo[c].blockedDiscs.includes(r)) exclusivity[r]++
      }
    }
    const rows: number[] = []
    for (let r = 0; r < TOTAL_DISCS; r++) {
      if (!blockedInfo[col].blockedDiscs.includes(r)) rows.push(r)
    }
    rows.sort((a, b) => exclusivity[a] - exclusivity[b] || used[a] - used[b])

    const place = (ri: number, remaining: number): boolean => {
      if (remaining === 0) return rec(ci + 1)
      if (ri === rows.length) return false
      let capacity = 0
      for (let k = ri; k < rows.length; k++) {
        capacity += UPGRADE_ROLLS_PER_DISC - used[rows[k]]
      }
      if (capacity < remaining) return false
      const r = rows[ri]
      const maxTake = Math.min(UPGRADE_ROLLS_PER_DISC - used[r], remaining)
      for (let take = maxTake; take >= 0; take--) {
        rowB[r][col] = take
        used[r] += take
        if (place(ri + 1, remaining - take)) return true
        used[r] -= take
        rowB[r][col] = 0
      }
      return false
    }

    return place(0, need)
  }

  if (!rec(0)) return null
  return { rowB, leftover: [0, 0, 0, 0] }
}

/** All permutations of the given elements (Heap's algorithm, deterministic). */
function allPermutations<T>(arr: T[]): T[][] {
  const result: T[][] = []
  const current = [...arr]
  const c = new Array(arr.length).fill(0)
  result.push([...current])
  let i = 0
  while (i < arr.length) {
    if (c[i] < i) {
      const swapIdx = i % 2 === 0 ? 0 : c[i]
      ;[current[i], current[swapIdx]] = [current[swapIdx], current[i]]
      result.push([...current])
      c[i]++
      i = 0
    } else {
      c[i] = 0
      i++
    }
  }
  return result
}

function pickFiller(
  mainStat: DiscMainStatKey,
  existingKeys: Set<string>,
  effectiveSubstats?: DiscSubStatKey[]
): DiscSubStatKey {
  if (effectiveSubstats) {
    for (const effKey of effectiveSubstats) {
      if (effKey !== mainStat && !existingKeys.has(effKey)) return effKey
    }
  }
  for (const k of allDiscSubStatKeys) {
    if (k !== mainStat && !existingKeys.has(k)) return k
  }
  return 'def_'
}

function generateMainStatCombos(
  effectiveMainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
): [DiscSlotKey, DiscMainStatKey][][] {
  const slot4Opts = effectiveMainStats['4'] ?? discSlotToMainStatKeys['4']
  const slot5Opts = effectiveMainStats['5'] ?? discSlotToMainStatKeys['5']
  const slot6Opts = effectiveMainStats['6'] ?? discSlotToMainStatKeys['6']

  const combos: [DiscSlotKey, DiscMainStatKey][][] = []
  for (const m4 of slot4Opts) {
    for (const m5 of slot5Opts) {
      for (const m6 of slot6Opts) {
        combos.push([
          ['4', m4],
          ['5', m5],
          ['6', m6],
        ])
      }
    }
  }
  return combos
}
