import type { Candidate } from '@zenless-optimizer/game-opt/solver'

import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../consts'
import {
  allDiscSlotKeys,
  allDiscSubStatKeys,
  discSlotToMainStatKeys,
  getDiscMainStatVal,
  getDiscSubStatBaseVal,
} from '../consts'
import {
  getCharacterEffectiveMainStats,
  getCharacterEffectiveStats,
} from '../util'

const THEORETICAL_RARITY = 'S' as const
const THEORETICAL_LEVEL = 15
const TOTAL_DISCS = 6
const UPGRADE_ROLLS_PER_DISC = 5
/** Minimum effective substats in a 4-substat combo for inclusion */
const MIN_EFFECTIVE_PER_COMBO = 3

export interface BuildRecipe {
  id: string
  mainStats: Record<DiscSlotKey, DiscMainStatKey>
  totalRolls: Partial<Record<DiscSubStatKey, number>>
  appearances: Partial<Record<DiscSubStatKey, number>>
  perDiscSubstats: { key: DiscSubStatKey; upgrades: number }[][]
  set4: DiscSetKey
  set2: DiscSetKey
}

interface BlockedInfo {
  isBlocked: boolean
  blockedDiscs: number[]
  baseRolls: number
  maxUpgrade: number
}

export function generateTheoreticalDiscs(
  characterKey: CharacterKey,
  setFilter2: DiscSetKey[],
  setFilter4: DiscSetKey[],
  slotFilters?: {
    4?: DiscMainStatKey[]
    5?: DiscMainStatKey[]
    6?: DiscMainStatKey[]
  },
  substatRollTargets?: Partial<Record<DiscSubStatKey, number>>
): {
  recipes: Candidate<string>[]
  recipeMap: Record<string, BuildRecipe>
} {
  const setKeys = [...new Set([...setFilter4, ...setFilter2])]
  if (setKeys.length === 0) {
    return { recipes: [], recipeMap: {} }
  }

  const set4 = setFilter4[0]
  const set2 = setFilter2[0]
  const allSubstats = [...allDiscSubStatKeys]
  const effectiveSubstats = getCharacterEffectiveStats(characterKey)
  const effectiveSet = new Set(effectiveSubstats)

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

  const recipes: Candidate<string>[] = []
  const recipeMap: Record<string, BuildRecipe> = {}
  let recipeIndex = 0

  for (const mainStats of mainStatCombos) {
    const allMainStats: Record<DiscSlotKey, DiscMainStatKey> = {
      '1': 'hp',
      '2': 'atk',
      '3': 'def',
      '4':
        mainStats.find(([s]) => s === '4')?.[1] ??
        discSlotToMainStatKeys['4'][0],
      '5':
        mainStats.find(([s]) => s === '5')?.[1] ??
        discSlotToMainStatKeys['5'][0],
      '6':
        mainStats.find(([s]) => s === '6')?.[1] ??
        discSlotToMainStatKeys['6'][0],
    }

    let combosToProcess: Generator<[number, number, number, number]>

    if (substatRollTargets && Object.keys(substatRollTargets).length > 0) {
      // Targeted mode: build a single combo containing all targeted substats
      combosToProcess = buildTargetedCombo(
        allSubstats,
        effectiveSubstats,
        substatRollTargets
      )
    } else {
      combosToProcess = enumerateFilteredCombos(
        allSubstats,
        effectiveSet,
        MIN_EFFECTIVE_PER_COMBO
      )
    }

    for (const comboIndices of combosToProcess) {
      const comboSubstats = comboIndices.map(
        (i) => allSubstats[i]
      ) as DiscSubStatKey[]

      const blockedInfo = getBlockedInfo(comboSubstats, allMainStats)
      const effectiveMask = comboSubstats.map((s) => effectiveSet.has(s))

      const distributions = enumerateAggregateTotals(blockedInfo, effectiveMask)

      for (const totals of distributions) {
        const candidate: Record<string, any> = {
          id: `recipe_${recipeIndex}`,
          hp: getDiscMainStatVal(THEORETICAL_RARITY, 'hp', THEORETICAL_LEVEL),
          atk: getDiscMainStatVal(THEORETICAL_RARITY, 'atk', THEORETICAL_LEVEL),
          def: getDiscMainStatVal(THEORETICAL_RARITY, 'def', THEORETICAL_LEVEL),
        }

        candidate[allMainStats['4']] =
          (candidate[allMainStats['4']] ?? 0) +
          getDiscMainStatVal(
            THEORETICAL_RARITY,
            allMainStats['4'],
            THEORETICAL_LEVEL
          )
        candidate[allMainStats['5']] =
          (candidate[allMainStats['5']] ?? 0) +
          getDiscMainStatVal(
            THEORETICAL_RARITY,
            allMainStats['5'],
            THEORETICAL_LEVEL
          )
        candidate[allMainStats['6']] =
          (candidate[allMainStats['6']] ?? 0) +
          getDiscMainStatVal(
            THEORETICAL_RARITY,
            allMainStats['6'],
            THEORETICAL_LEVEL
          )

        const assignment = assignPerDiscRolls(
          comboSubstats,
          blockedInfo,
          totals,
          allMainStats,
          effectiveSubstats
        )

        // Physically impossible distribution (upgrades that cannot be
        // placed on any free disc) — skip so every recipe carries the
        // full 54 substat rolls.
        if (assignment.leftover.some((n) => n > 0)) continue

        if (substatRollTargets) {
          for (const [keyStr, targetRolls] of Object.entries(
            substatRollTargets
          )) {
            const key = keyStr as DiscSubStatKey
            if (!allDiscSubStatKeys.includes(key)) {
              continue
            }
            const targetVal =
              getDiscSubStatBaseVal(key, THEORETICAL_RARITY) * targetRolls
            candidate[key] = targetVal
            assignment.rollTotals[key] = targetRolls
          }
        }

        for (const [key, value] of Object.entries(assignment.statTotals)) {
          candidate[key] = (candidate[key] ?? 0) + value
        }

        if (set4 === set2) {
          candidate[set4] = 6
        } else {
          candidate[set4] = 4
          candidate[set2] = 2
        }

        if (typeof candidate.crit_ === 'number') {
          candidate.crit_ = Math.min(candidate.crit_, 0.95)
        }

        const id = `recipe_${recipeIndex}`
        candidate.id = id

        recipes.push(candidate as Candidate<string>)

        recipeMap[id] = {
          id,
          mainStats: allMainStats,
          totalRolls: { ...assignment.rollTotals },
          appearances: { ...assignment.appearances },
          perDiscSubstats: assignment.perDisc,
          set4,
          set2,
        }

        recipeIndex++
      }
    }
  }

  return { recipes, recipeMap }
}

/**
 * Enumerate all 4-substat combos from all 10 types, yielding only those
 * with at least `minEffective` substats from the effective set.
 */
function* enumerateFilteredCombos(
  allSubstats: readonly string[],
  effectiveSet: Set<string>,
  minEffective: number
): Generator<[number, number, number, number]> {
  const n = allSubstats.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          let effCount = 0
          if (effectiveSet.has(allSubstats[i])) effCount++
          if (effectiveSet.has(allSubstats[j])) effCount++
          if (effectiveSet.has(allSubstats[k])) effCount++
          if (effectiveSet.has(allSubstats[l])) effCount++
          if (effCount >= minEffective) {
            yield [i, j, k, l]
          }
        }
      }
    }
  }
}

/**
 * Build a targeted combo generator that yields exactly 1 combo:
 * the one containing all targeted substats, with remaining slots
 * filled from effective substats.
 */
function* buildTargetedCombo(
  allSubstats: readonly string[],
  effectiveSubstats: DiscSubStatKey[],
  substatRollTargets: Partial<Record<DiscSubStatKey, number>>
): Generator<[number, number, number, number]> {
  const targetedKeys = new Set(
    Object.keys(substatRollTargets) as DiscSubStatKey[]
  )

  // Build the combo: start with targeted keys, fill with effective substats
  const comboKeys: DiscSubStatKey[] = [...targetedKeys] as DiscSubStatKey[]
  for (const effKey of effectiveSubstats) {
    if (comboKeys.length >= 4) break
    if (!comboKeys.includes(effKey)) {
      comboKeys.push(effKey)
    }
  }
  // If still not 4, fill with any remaining substat
  if (comboKeys.length < 4) {
    for (const sk of allSubstats) {
      if (comboKeys.length >= 4) break
      if (!comboKeys.includes(sk as DiscSubStatKey)) {
        comboKeys.push(sk as DiscSubStatKey)
      }
    }
  }

  // Trim to 4 and map to indices
  const result = comboKeys
    .slice(0, 4)
    .map((k) => allSubstats.indexOf(k))
    .filter((i) => i >= 0) as [number, number, number, number]

  if (result.length === 4) {
    yield result
  }
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
 * Enumerate all feasible aggregate roll distributions for a 4-substat combo.
 * When `effectiveMask` has any false entries (non-effective substats),
 * applies a dominance filter: non-effective rolls ≤ min(effective rolls).
 */
function enumerateAggregateTotals(
  blockedInfo: BlockedInfo[],
  effectiveMask: boolean[]
): [number, number, number, number][] {
  const upgradeTotal = UPGRADE_ROLLS_PER_DISC * TOTAL_DISCS
  const results: [number, number, number, number][] = []

  const maxU = blockedInfo.map((b) => b.maxUpgrade)
  const base = blockedInfo.map((b) => b.baseRolls)

  const hasNonEffective = effectiveMask.some((m) => !m)

  for (let u0 = 0; u0 <= Math.min(maxU[0], upgradeTotal); u0++) {
    const s1 = upgradeTotal - u0
    for (let u1 = 0; u1 <= Math.min(maxU[1], s1); u1++) {
      const s2 = s1 - u1
      for (let u2 = 0; u2 <= Math.min(maxU[2], s2); u2++) {
        const u3 = s2 - u2
        if (u3 < 0 || u3 > maxU[3]) continue

        const totals: [number, number, number, number] = [
          u0 + base[0],
          u1 + base[1],
          u2 + base[2],
          u3 + base[3],
        ]

        // Dominance filter: skip if any non-effective substat exceeds
        // the minimum of the effective substats
        if (hasNonEffective) {
          let minEff = Infinity
          for (let i = 0; i < 4; i++) {
            if (effectiveMask[i] && totals[i] < minEff) {
              minEff = totals[i]
            }
          }
          let dominated = false
          for (let i = 0; i < 4; i++) {
            if (!effectiveMask[i] && totals[i] > minEff) {
              dominated = true
              break
            }
          }
          if (dominated) continue
        }

        results.push(totals)
      }
    }
  }

  return results
}

interface PerDiscAssignment {
  perDisc: { key: DiscSubStatKey; upgrades: number }[][]
  rollTotals: Partial<Record<DiscSubStatKey, number>>
  statTotals: Record<string, number>
  appearances: Partial<Record<DiscSubStatKey, number>>
  leftover: number[]
}

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
      if (subsetFeasible(upgrades, blockedInfo)) {
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
 * Exact feasibility for a distribution. With splittable demands and
 * per-disc capacity, a packing exists iff every subset of columns fits
 * within the total capacity of the discs those columns can use (Hall's
 * condition / max-flow min-cut). Cheap for 4 columns: 15 subsets.
 */
function subsetFeasible(
  upgrades: number[],
  blockedInfo: BlockedInfo[]
): boolean {
  for (let mask = 1; mask < 1 << upgrades.length; mask++) {
    let demand = 0
    let freeRows = 0
    for (let c = 0; c < upgrades.length; c++) {
      if (!(mask & (1 << c))) continue
      demand += upgrades[c]
      for (let r = 0; r < TOTAL_DISCS; r++) {
        if (!blockedInfo[c].blockedDiscs.includes(r)) freeRows |= 1 << r
      }
    }
    let count = 0
    for (let bits = freeRows; bits; bits &= bits - 1) count++
    if (demand > UPGRADE_ROLLS_PER_DISC * count) return false
  }
  return true
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
