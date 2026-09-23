import type { DiscSubStatKey } from '@zenless-optimizer/zzz/consts'
import {
  discMaxLevel,
  discSubstatRollData,
} from '@zenless-optimizer/zzz/consts'
import type { ICachedDisc } from '@zenless-optimizer/zzz/db'
import type { IDisc } from '@zenless-optimizer/zzz/zood'

export type SubstatWithKey = { key: DiscSubStatKey; upgrades: number }

export function remainingUpgrades(disc: IDisc): number {
  const max = discMaxLevel[disc.rarity]
  return Math.max(0, Math.floor(max / 3) - Math.floor(disc.level / 3))
}

export function getEffectiveMaxUpgrades(disc: IDisc): number {
  return discSubstatRollData[disc.rarity].numUpgrades
}

export function activeSubstats(disc: IDisc): SubstatWithKey[] {
  return disc.substats.filter(
    (s): s is SubstatWithKey => !!s.key && s.upgrades > 0
  )
}

/**
 * Greedy roll planner shared by the discs-page max-potential score and the
 * optimizer's "Potentially Best Discs" mode: allocate each remaining upgrade
 * to the highest-weight effective stat that still has headroom, opening new
 * substat slots (max 4) as needed. Returns the planned rolls in order.
 */
export function planPotentialRolls(
  disc: IDisc,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): DiscSubStatKey[] {
  const budget = remainingUpgrades(disc)
  if (budget === 0) return []
  const existing = new Set(activeSubstats(disc).map((s) => s.key))
  const maxStats = getEffectiveMaxUpgrades(disc)
  const caps: Record<string, number> = {}
  for (const sub of activeSubstats(disc))
    caps[sub.key] = maxStats - sub.upgrades
  const newSlots = Math.max(0, 4 - activeSubstats(disc).length)
  if (newSlots > 0) caps['__new__'] = newSlots

  const candidates: DiscSubStatKey[] = [
    ...new Set([...effectiveStats, ...Object.keys(weights).filter(Boolean)]),
  ].filter(Boolean) as DiscSubStatKey[]

  const ordered = [...candidates].sort(
    (a, b) => (weights[b] ?? 1) - (weights[a] ?? 1)
  )

  const rolls: DiscSubStatKey[] = []
  for (let i = 0; i < budget; i++) {
    let chosen: DiscSubStatKey | null = null
    for (const k of ordered) {
      if (existing.has(k) && (caps[k] ?? 0) <= 0) continue
      if (!existing.has(k) && (caps['__new__'] ?? 0) <= 0) continue
      if (existing.has(k)) {
        caps[k] = (caps[k] ?? 0) - 1
      } else {
        caps['__new__'] = (caps['__new__'] ?? 0) - 1
        existing.add(k)
      }
      chosen = k
      break
    }
    if (chosen) rolls.push(chosen)
  }
  return rolls
}

/**
 * Materialize planned rolls into a substat list: existing substats take
 * upgrades, new stats open slots (max 4), otherwise the weakest substat is
 * overwritten when it still has headroom — mirroring the scoring preview.
 */
export function materializeBoostedSubstats(
  disc: IDisc,
  rolls: DiscSubStatKey[]
): SubstatWithKey[] {
  const next = activeSubstats(disc).map((s) => ({ ...s }))
  const maxStats = getEffectiveMaxUpgrades(disc)
  for (const roll of rolls) {
    const target = next.find((s) => s.key === roll)
    if (target) {
      target.upgrades += 1
    } else if (next.length < 4) {
      next.push({ key: roll, upgrades: 1 })
    } else {
      const weakest = next.reduce((a, b) => (a.upgrades <= b.upgrades ? a : b))
      if (weakest.upgrades < maxStats) {
        weakest.key = roll
        weakest.upgrades += 1
      }
    }
  }
  return next
}

/**
 * Boost a disc to its max potential for a character: level bumped to the
 * rarity max (so the main stat evaluates at +15) with remaining upgrades
 * allocated to the character's best substats. Identity fields (id, set, slot,
 * main stat, location) are preserved so solver results still reference the
 * real disc.
 */
export function boostDiscToPotential(
  disc: ICachedDisc,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): ICachedDisc {
  const rolls = planPotentialRolls(disc, effectiveStats, weights)
  if (rolls.length === 0 && disc.level === discMaxLevel[disc.rarity])
    return disc
  return {
    ...disc,
    level: discMaxLevel[disc.rarity],
    substats: materializeBoostedSubstats(disc, rolls),
  }
}
