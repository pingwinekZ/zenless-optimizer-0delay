import type {
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '@zenless-optimizer/zzz/consts'
import { statKeyTextMap } from '@zenless-optimizer/zzz/consts'
import type { BuildRecipe } from '@zenless-optimizer/zzz/db'
import { targetTag } from '@zenless-optimizer/zzz/db'

export type TheoReferenceShape = {
  /** Exact substat roll totals of the pinned perfect build. */
  perfectRolls: Partial<Record<DiscSubStatKey, number>>
  /** Exact main stat per slot of the pinned perfect build. */
  mainsBySlot: Partial<Record<DiscSlotKey, DiscMainStatKey>>
}

export type SubstatTip = {
  key: DiscSubStatKey
  label: string
  localRolls: number
  perfectRolls: number
  deficit: number
}

export type MainMismatch = {
  slot: DiscSlotKey
  localMain: DiscMainStatKey
  perfectMain: DiscMainStatKey
}

/**
 * Build the reference profile from the single pinned recipe: exact roll
 * totals and exact mains. No averaging, no unions — the reference is one
 * build.
 */
export function buildReferenceProfile(recipe: BuildRecipe): TheoReferenceShape {
  const perfectRolls: Partial<Record<DiscSubStatKey, number>> = {}
  for (const [key, rolls] of Object.entries(recipe.totalRolls)) {
    if (!rolls) continue
    perfectRolls[key as DiscSubStatKey] = rolls
  }
  const mainsBySlot: Partial<Record<DiscSlotKey, DiscMainStatKey>> = {}
  for (const [slot, main] of Object.entries(recipe.mainStats)) {
    mainsBySlot[slot as DiscSlotKey] = main
  }
  return { perfectRolls, mainsBySlot }
}

/**
 * Gap analysis against the pinned build: deficit(key) = max(0, perfect −
 * local). Sorted by weight × deficit, top `topN`.
 */
export function compareToReference(
  localRolls: Partial<Record<DiscSubStatKey, number>>,
  localMains: Partial<Record<DiscSlotKey, DiscMainStatKey>>,
  profile: TheoReferenceShape,
  weights: Partial<Record<DiscSubStatKey, number>>,
  topN = 3
): { tips: SubstatTip[]; mainMismatches: MainMismatch[] } {
  const keys = new Set<DiscSubStatKey>([
    ...Object.keys(localRolls),
    ...Object.keys(profile.perfectRolls),
  ] as DiscSubStatKey[])
  const tips: Array<SubstatTip & { priority: number }> = []
  for (const key of keys) {
    const local = localRolls[key] ?? 0
    const perfect = profile.perfectRolls[key] ?? 0
    const deficit = Math.max(0, perfect - local)
    if (!(deficit > 0)) continue
    tips.push({
      key,
      label: statKeyTextMap[key] ?? key,
      localRolls: local,
      perfectRolls: perfect,
      deficit,
      priority: deficit * (weights[key] ?? 1),
    })
  }
  tips.sort((a, b) => b.priority - a.priority)
  const mainMismatches: MainMismatch[] = []
  for (const [slot, localMain] of Object.entries(localMains)) {
    if (!localMain) continue
    const perfectMain = profile.mainsBySlot[slot as DiscSlotKey]
    if (perfectMain && perfectMain !== localMain)
      mainMismatches.push({
        slot: slot as DiscSlotKey,
        localMain,
        perfectMain,
      })
  }
  return {
    tips: tips
      .slice(0, Math.max(0, topN))
      .map(({ priority: _priority, ...tip }) => tip),
    mainMismatches,
  }
}

/**
 * Snapshot the comparison context for staleness checks: the optimization
 * target plus the set filters. A reference pinned under another target or
 * filter set is not comparable — callers compare snapshots for equality.
 */
export function buildTheoContextSnapshot(
  target: Parameters<typeof targetTag>[0] | undefined,
  setFilter2: DiscSetKey[],
  setFilter4: DiscSetKey[]
): { targetKey: string; setFilter2: DiscSetKey[]; setFilter4: DiscSetKey[] } {
  return {
    targetKey: JSON.stringify(target ? targetTag(target) : null),
    setFilter2: [...setFilter2],
    setFilter4: [...setFilter4],
  }
}
