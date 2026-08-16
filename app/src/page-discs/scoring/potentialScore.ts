import type { DiscSubStatKey } from '../../consts'
import { discMaxLevel, discSubstatRollData } from '../../consts'
import { computeMaxPossibleWeighted } from '../../util'
import type { IDisc } from '../../zood'

type SubstatWithKey = { key: DiscSubStatKey; upgrades: number }

function remainingUpgrades(disc: IDisc): number {
  const max = discMaxLevel[disc.rarity]
  return Math.max(0, Math.floor(max / 3) - Math.floor(disc.level / 3))
}

function getEffectiveMaxUpgrades(disc: IDisc): number {
  return discSubstatRollData[disc.rarity].numUpgrades
}

function activeSubstats(disc: IDisc): SubstatWithKey[] {
  return disc.substats.filter(
    (s): s is SubstatWithKey => !!s.key && s.upgrades > 0
  )
}

function applyRolls(
  disc: IDisc,
  rolls: DiscSubStatKey[],
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  const next = activeSubstats(disc).map((s) => ({ ...s }))
  for (const roll of rolls) {
    const target = next.find((s) => s.key === roll)
    if (target) {
      target.upgrades += 1
    } else if (next.length < 4) {
      next.push({ key: roll, upgrades: 1 })
    } else {
      const weakest = next.reduce((a, b) => (a.upgrades <= b.upgrades ? a : b))
      if (weakest.upgrades < getEffectiveMaxUpgrades(disc)) {
        weakest.key = roll
        weakest.upgrades += 1
      }
    }
  }
  let total = 0
  let weightedEffective = 0
  for (const sub of next) {
    total += sub.upgrades
    if (effectiveStats.includes(sub.key))
      weightedEffective += sub.upgrades * (weights[sub.key] ?? 1)
  }
  if (total === 0) return 0
  const maxPossible = computeMaxPossibleWeighted(
    total,
    next.length,
    effectiveStats,
    weights
  )
  return maxPossible > 0 ? weightedEffective / maxPossible : 0
}

export function computeMaxPotential(
  disc: IDisc,
  effectiveStats: DiscSubStatKey[],
  weights: Partial<Record<DiscSubStatKey, number>>
): number {
  const budget = remainingUpgrades(disc)
  if (budget === 0) {
    return applyRolls(disc, [], effectiveStats, weights)
  }
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
  return applyRolls(disc, rolls, effectiveStats, weights)
}
