import { useMemo } from 'react'
import { create } from 'zustand'
import type { ComboHit, TeamConditional } from '../../db'
import { COMBO_STATE_VERSION, comboCondHash, parseComboState } from '../../db'
import { own } from '../../formula'
import { useZzzCalcContext } from '../../formula-ui'
import { parseSkillVariant, skillVariantBase } from '../OptTargetTagDisplay'
import type { CascaderData } from './CascaderSelect'
import type { ComboMember } from './useComboMembers'

export const hitValue = (sheet: string, name: string) => `${sheet}|||${name}`

export function parseHitValue(value: string | null): {
  sheet: string
  name: string
} | null {
  if (!value) return null
  const [sheet, name] = value.split('|||')
  if (!sheet || !name) return null
  return { sheet, name }
}

const variantSuffix: Record<string, string> = {
  dmg: '',
  daze: 'Daze',
  anomBuildup: 'Buildup',
  gashBuildup: 'Buildup',
}

const categoryOrder = ['basic', 'dodge', 'special', 'chain', 'assist', 'other']
const categoryLabels: Record<string, string> = {
  basic: 'Basic',
  dodge: 'Dodge',
  special: 'Special',
  chain: 'Chain',
  assist: 'Assist',
  other: 'Other',
}

/** Formula options grouped by damage category, for the hit selectors. */
export function useComboFormulaGroups(): CascaderData {
  const calc = useZzzCalcContext()
  return useMemo(() => {
    if (!calc) return []
    const byCat = new Map<string, Array<{ value: string; label: string }>>()
    for (const { tag } of calc.listFormulas(own.listing.formulas)) {
      const sheet = tag.sheet ?? ''
      const name = tag.name ?? ''
      if (!sheet || !name) continue
      const parsed = parseSkillVariant(tag as never)
      const base = skillVariantBase(tag as never) ?? name
      const suffix = parsed ? variantSuffix[parsed.kind] : ''
      const label = suffix ? `${base} ${suffix}` : base
      const rawDamageType = (tag as { damageType1?: string }).damageType1 ?? ''
      const cat = categorizeDamageType(rawDamageType)
      const list = byCat.get(cat) ?? []
      list.push({ value: hitValue(sheet, name), label })
      byCat.set(cat, list)
    }
    return categoryOrder
      .filter((cat) => byCat.has(cat))
      .map((cat) => ({
        label: categoryLabels[cat]!,
        options: byCat.get(cat)!,
      }))
  }, [calc])
}

function categorizeDamageType(damageType1: string): string {
  if (['basic'].includes(damageType1)) return 'basic'
  if (['dash', 'dodgeCounter'].includes(damageType1)) return 'dodge'
  if (['special', 'exSpecial'].includes(damageType1)) return 'special'
  if (['chain', 'ult'].includes(damageType1)) return 'chain'
  if (
    [
      'entrySkill',
      'quickAssist',
      'defensiveAssist',
      'evasiveAssist',
      'assistFollowUp',
      'counterAssist',
    ].includes(damageType1)
  )
    return 'assist'
  return 'other'
}

export function hashOf(c: TeamConditional): string {
  return comboCondHash(c.sheet, c.condKey, c.src, c.dst)
}

/**
 * Partitions for a numeric/list conditional, derived from the stored
 * per-hit values: the default value plus every distinct value used by any
 * hit, plus manually added partition values. Sorted ascending for numbers.
 */
export function derivePartitions(
  defaultValue: number,
  hitValues: number[],
  extraValues: number[]
): number[] {
  const set = new Set<number>([defaultValue, ...hitValues, ...extraValues])
  const arr = [...set].filter((v) => Number.isFinite(v))
  // List indices and stack counts sort numerically; keep insertion order
  // stable by sorting numerically.
  arr.sort((a, b) => a - b)
  return arr
}

type ComboDrawerStore = {
  initialized: boolean
  hits: ComboHit[]
  conditionals: TeamConditional[]
  members: ComboMember[]
  defaults: Record<string, number>
  values: Record<string, number[]>
  extraValues: Record<string, number[]>
  /** Hashes the user actually edited — only these are materialized on save. */
  dirty: Record<string, true>
  initialize: (
    hits: ComboHit[],
    conditionals: TeamConditional[],
    comboStateJson: string | undefined,
    members: ComboMember[]
  ) => void
  reset: () => void
  setHits: (hits: ComboHit[]) => void
  setHitAbility: (index: number, sheet: string, name: string) => void
  removeHit: (index: number) => void
  setDefault: (hash: string, value: number) => void
  /**
   * HSR's setBooleanDefault: toggling the row switch sets the default AND
   * every hit, so disabling a conditional turns off the whole row.
   */
  setBooleanDefault: (hash: string, value: number) => void
  setHitValue: (hash: string, hitIndex: number, value: number) => void
  batchSetHitValues: (
    updates: Array<{ hash: string; index: number; value: number }>
  ) => void
  setPartitionValue: (hash: string, oldValue: number, newValue: number) => void
  addPartition: (hash: string, candidates: number[]) => void
  deletePartition: (hash: string, value: number) => void
  extraSets: string[]
  addExtraSet: (setKey: string, rows: TeamConditional[]) => void
  removeExtraSet: (setKey: string) => void
}

export const useComboDrawerStore = create<ComboDrawerStore>()((set) => ({
  initialized: false,
  hits: [],
  conditionals: [],
  members: [],
  defaults: {},
  values: {},
  extraValues: {},
  dirty: {},
  extraSets: [],
  initialize: (hits, conditionals, comboStateJson, members) => {
    const parsed = parseComboState(comboStateJson, hits.length)
    const defaults: Record<string, number> = {}
    const values: Record<string, number[]> = {}
    for (const c of conditionals) {
      const hash = hashOf(c)
      defaults[hash] = c.condValue
      const arr = parsed?.values[hash]
      values[hash] =
        arr && arr.length === hits.length
          ? [...arr]
          : hits.map(() => c.condValue)
    }
    set({
      initialized: true,
      hits: hits.map((h) => ({ ...h })),
      conditionals,
      members,
      defaults,
      values,
      extraValues: {},
      dirty: {},
      extraSets: parsed?.extraSets ?? [],
    })
  },
  reset: () =>
    set({
      initialized: false,
      hits: [],
      conditionals: [],
      members: [],
      defaults: {},
      values: {},
      extraValues: {},
      dirty: {},
      extraSets: [],
    }),
  addExtraSet: (setKey, rows) =>
    set((s) => {
      if (s.extraSets.includes(setKey)) return s
      const hitCount = Math.max(s.hits.length, 1)
      const conditionals = [...s.conditionals, ...rows]
      const defaults = { ...s.defaults }
      const values = { ...s.values }
      for (const c of rows) {
        const hash = hashOf(c)
        if (defaults[hash] === undefined) defaults[hash] = c.condValue
        if (values[hash] === undefined)
          values[hash] = Array(hitCount).fill(c.condValue)
      }
      return {
        conditionals,
        defaults,
        values,
        extraSets: [...s.extraSets, setKey],
      }
    }),
  removeExtraSet: (setKey) =>
    set((s) => {
      if (!s.extraSets.includes(setKey)) return s
      const gone = new Set(
        s.conditionals.filter((c) => c.sheet === setKey).map((c) => hashOf(c))
      )
      const drop = (obj: Record<string, number[]>) =>
        Object.fromEntries(
          Object.entries(obj).filter(([hash]) => !gone.has(hash))
        )
      return {
        conditionals: s.conditionals.filter((c) => c.sheet !== setKey),
        defaults: Object.fromEntries(
          Object.entries(s.defaults).filter(([hash]) => !gone.has(hash))
        ),
        values: drop(s.values),
        extraValues: drop(s.extraValues),
        dirty: Object.fromEntries(
          Object.entries(s.dirty).filter(([hash]) => !gone.has(hash))
        ),
        extraSets: s.extraSets.filter((k) => k !== setKey),
      }
    }),
  setHits: (hits) => set({ hits: hits.map((h) => ({ ...h })) }),
  setHitAbility: (index, sheet, name) =>
    set((s) => ({
      hits: s.hits.map((h, i) => (i === index ? { ...h, sheet, name } : h)),
    })),
  removeHit: (index) =>
    set((s) => {
      const hits = s.hits.filter((_, i) => i !== index)
      const values: Record<string, number[]> = {}
      for (const [hash, arr] of Object.entries(s.values))
        values[hash] = arr.filter((_, i) => i !== index)
      return { hits, values }
    }),
  setDefault: (hash, value) =>
    set((s) => ({
      defaults: { ...s.defaults, [hash]: value },
      dirty: { ...s.dirty, [hash]: true },
    })),
  setBooleanDefault: (hash, value) =>
    set((s) => {
      const hitCount = Math.max(s.hits.length, s.values[hash]?.length ?? 0, 1)
      return {
        defaults: { ...s.defaults, [hash]: value },
        values: { ...s.values, [hash]: Array(hitCount).fill(value) },
        dirty: { ...s.dirty, [hash]: true },
      }
    }),
  setHitValue: (hash, hitIndex, value) =>
    set((s) => ({
      values: {
        ...s.values,
        [hash]: s.values[hash]?.map((v, i) => (i === hitIndex ? value : v)) ?? [
          value,
        ],
      },
      dirty: { ...s.dirty, [hash]: true },
    })),
  batchSetHitValues: (updates) =>
    set((s) => {
      const values: Record<string, number[]> = { ...s.values }
      const dirty: Record<string, true> = { ...s.dirty }
      for (const { hash, index, value } of updates) {
        const arr = values[hash]
        if (!arr) continue
        const next = [...arr]
        next[index] = value
        values[hash] = next
        dirty[hash] = true
      }
      return { values, dirty }
    }),
  setPartitionValue: (hash, oldValue, newValue) =>
    set((s) => {
      if (oldValue === newValue) return s
      const values: Record<string, number[]> = { ...s.values }
      const arr = values[hash]
      if (arr) values[hash] = arr.map((v) => (v === oldValue ? newValue : v))
      const extraValues: Record<string, number[]> = { ...s.extraValues }
      const extra = extraValues[hash]
      if (extra)
        extraValues[hash] = extra.map((v) => (v === oldValue ? newValue : v))
      return { values, extraValues, dirty: { ...s.dirty, [hash]: true } }
    }),
  addPartition: (hash, candidates) =>
    set((s) => {
      const used = new Set<number>([
        s.defaults[hash] ?? 0,
        ...(s.values[hash] ?? []),
        ...(s.extraValues[hash] ?? []),
      ])
      const next = candidates.find((v) => !used.has(v))
      if (next === undefined) return s
      return {
        extraValues: {
          ...s.extraValues,
          [hash]: [...(s.extraValues[hash] ?? []), next],
        },
        dirty: { ...s.dirty, [hash]: true },
      }
    }),
  deletePartition: (hash, value) =>
    set((s) => {
      const def = s.defaults[hash] ?? 0
      if (value === def) return s
      const values: Record<string, number[]> = { ...s.values }
      const arr = values[hash]
      if (arr) values[hash] = arr.map((v) => (v === value ? def : v))
      const extraValues: Record<string, number[]> = { ...s.extraValues }
      const extra = extraValues[hash]
      if (extra) extraValues[hash] = extra.filter((v) => v !== value)
      return { values, extraValues, dirty: { ...s.dirty, [hash]: true } }
    }),
}))

export function flushDrawerState(): {
  hits: ComboHit[]
  conditionals: TeamConditional[]
  defaults: Record<string, number>
  values: Record<string, number[]>
  dirty: Record<string, true>
} {
  const s = useComboDrawerStore.getState()
  return {
    hits: s.hits,
    conditionals: s.conditionals,
    defaults: s.defaults,
    values: s.values,
    dirty: s.dirty,
  }
}

export { COMBO_STATE_VERSION }
