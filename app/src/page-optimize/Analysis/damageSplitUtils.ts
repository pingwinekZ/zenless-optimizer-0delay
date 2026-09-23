import type { Tag } from '@zenless-optimizer/zzz/formula'
import { damageTypeColor, damageTypeLabel, tagDamageType } from './damageTypes'
import type { PerActionDamage } from './ExpandedDataPanelController'

export type DamageSplitSegment = {
  damageType: string
  label: string
  color: string
  damage: number
}

export type DamageSplitEntry = {
  name: string
  segments: DamageSplitSegment[]
  total: number
}

export type DamageTagSlice = {
  damageType: string
  label: string
  color: string
  fill: string
  value: number
  percent: number
}

/**
 * One bar per action of the current optimization target.
 *
 * hsr-optimizer splits a single action into damage-tag segments from the
 * per-hit registers; ZZZ's engine already resolves one damage figure per
 * action, so each action contributes exactly one segment — colored by its
 * damage type — and the bar carries the action total.
 */
export function extractDamageSplits(
  perActionDamage: PerActionDamage[],
  /** Overrides the raw action name (e.g. with a localized label). */
  label?: (tag: Tag) => string
): DamageSplitEntry[] {
  const entries: DamageSplitEntry[] = []
  for (const action of perActionDamage) {
    if (!(action.value > 0)) continue
    const damageType = tagDamageType(action.tag)
    entries.push({
      name: label ? label(action.tag) : action.name,
      segments: [
        {
          damageType,
          label: damageTypeLabel(damageType),
          color: damageTypeColor(damageType),
          damage: action.value,
        },
      ],
      total: action.value,
    })
  }
  return entries
}

/** Aggregate every action's damage by damage type, largest first. */
export function extractDamageByTag(
  perActionDamage: PerActionDamage[]
): DamageTagSlice[] {
  const totals = new Map<string, number>()
  let grandTotal = 0

  for (const action of perActionDamage) {
    if (!(action.value > 0)) continue
    const damageType = tagDamageType(action.tag)
    totals.set(damageType, (totals.get(damageType) ?? 0) + action.value)
    grandTotal += action.value
  }

  if (grandTotal === 0) return []

  const slices: DamageTagSlice[] = []
  for (const [damageType, value] of totals) {
    const color = damageTypeColor(damageType)
    slices.push({
      damageType,
      label: damageTypeLabel(damageType),
      color,
      fill: color,
      value,
      percent: value / grandTotal,
    })
  }
  slices.sort((a, b) => b.value - a.value)
  return slices
}
