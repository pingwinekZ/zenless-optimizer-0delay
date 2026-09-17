import { zodFilteredArray } from '@zenless-optimizer/common/database'
import { validateValue } from '@zenless-optimizer/common/util'
import { z } from 'zod'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../../consts'
import {
  allDiscMainStatKeys,
  allDiscSetKeys,
  allDiscSlotKeys,
  allDiscSubStatKeys,
} from '../../../consts'
import type { BuildRecipe } from '../../../solver'
import type { ICachedDisc } from '../../Interfaces'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

/**
 * Snapshot of the reference build's in-combat stats, taken at pin time.
 * Stored as plain numbers (no calculator dependency) so the comparison
 * panel can render them after a refresh. Field names match
 * `BuildCombatStats` in page-optimize/Util/buildStatsUtils.
 */
export type TheoReferenceCombatStats = Partial<{
  hp: number
  atk: number
  def: number
  impact: number
  critRate: number
  critDmg: number
  penRatio: number
  pen: number
  enerRegen: number
  anomProf: number
  anomMas: number
  sheerForce: number
  dmgBonus: number
  defIgn: number
}>

/**
 * A pinned theoretical-best reference for one character: the single best
 * build from a theoretical run, not an aggregate.
 * - `perfectRolls`: exact substat roll totals of the pinned build — tips
 *   report exact deficits vs these.
 * - `mainsBySlot`: exact main stat per slot — any deviation is flagged.
 * - `value`: the pinned build's value — denominator for build rating.
 * - `bestRecipe` / `referenceDiscs`: the pinned build materialized with
 *   stable `theoref_<char>_<slot>` ids, so the reference survives a page
 *   refresh (the optimizer's in-memory recipe index does not).
 * - `referenceCombatStats`: in-combat snapshot of that build at pin time,
 *   shown in the comparison panel without needing a live calculator.
 * - `targetKey`/`setFilter2`/`setFilter4`: context snapshot for staleness
 *   warnings (a reference pinned under another target or filter set is not
 *   comparable).
 */
export type TheoReference = {
  value: number
  perfectRolls: Partial<Record<DiscSubStatKey, number>>
  mainsBySlot: Partial<Record<DiscSlotKey, DiscMainStatKey>>
  set4?: DiscSetKey
  set2?: DiscSetKey
  wengineKey?: string
  targetKey: string
  setFilter2: DiscSetKey[]
  setFilter4: DiscSetKey[]
  date: number
  bestRecipe?: BuildRecipe
  referenceDiscs?: ICachedDisc[]
  referenceCombatStats?: TheoReferenceCombatStats
}

const combatStatsSchema = z
  .record(z.string(), z.number())
  .catch({} as Record<string, number>)

const recipeDiscSchema = z.object({
  id: z.string(),
  setKey: z.string(),
  slotKey: z.string(),
  level: z.number().catch(15),
  rarity: z.string().catch('S'),
  mainStatKey: z.string(),
  substats: z
    .array(z.object({ key: z.string(), upgrades: z.number().catch(0) }))
    .catch([]),
  location: z.string().catch(''),
  lock: z.boolean().catch(false),
  trash: z.boolean().catch(false),
})

const recipeSchema = z.object({
  id: z.string().catch(''),
  mainStats: z.record(z.string(), z.string()),
  totalRolls: z.record(z.string(), z.number()).catch({}),
  appearances: z.record(z.string(), z.number()).catch({}),
  perDiscSubstats: z
    .array(z.array(z.object({ key: z.string(), upgrades: z.number() })))
    .catch([]),
  set4: z.string(),
  set2: z.string(),
})

const theoReferenceSchema = z.object({
  value: z.number(),
  perfectRolls: z.record(z.string(), z.number()).optional(),
  // New shape is slot -> single main; legacy band pins stored slot -> main[].
  mainsBySlot: z.record(z.string(), z.unknown()).catch({}),
  set4: z.string().optional(),
  set2: z.string().optional(),
  wengineKey: z.string().optional(),
  targetKey: z.string().catch(''),
  setFilter2: zodFilteredArray(allDiscSetKeys, []),
  setFilter4: zodFilteredArray(allDiscSetKeys, []),
  date: z.number().int().catch(0),
  bestRecipe: recipeSchema.optional(),
  referenceDiscs: z.array(recipeDiscSchema).catch([]),
  referenceCombatStats: combatStatsSchema.optional(),
  // Legacy tie-band fields (removed): used only to migrate old pins.
  avgRolls: z.record(z.string(), z.number()).optional(),
  bandRolls: z.array(z.record(z.string(), z.number())).catch([]),
})

export class TheoReferenceDataManager extends DataManager<
  CharacterKey,
  'theoReferences',
  TheoReference,
  TheoReference
> {
  constructor(database: ZzzDatabase) {
    super(database, 'theoReferences')
  }
  override toStorageKey(key: string): string {
    return `${this.goKeySingle}_${key}`
  }
  override toCacheKey(key: string): CharacterKey {
    return key.split(`${this.goKeySingle}_`)[1] as CharacterKey
  }
  override validate(obj: unknown): TheoReference | undefined {
    const result = theoReferenceSchema.safeParse(obj)
    if (!result.success) return undefined
    const data = result.data
    if (!Number.isFinite(data.value) || data.value <= 0) return undefined

    const bestRecipe = validateRecipe(data.bestRecipe)
    const perfectRolls = cleanRolls(
      bestRecipe?.totalRolls ??
        data.perfectRolls ??
        data.bandRolls[0] ??
        data.avgRolls ??
        {}
    )
    const mainsBySlot = cleanMains(data.mainsBySlot, bestRecipe)
    const referenceDiscs = validateReferenceDiscs(data.referenceDiscs)
    const referenceCombatStats = validateCombatStats(data.referenceCombatStats)
    return {
      value: data.value,
      perfectRolls,
      mainsBySlot,
      set4: validateValue(data.set4, allDiscSetKeys),
      set2: validateValue(data.set2, allDiscSetKeys),
      wengineKey:
        data.wengineKey && this.database.wengines.get(data.wengineKey)
          ? data.wengineKey
          : undefined,
      targetKey: data.targetKey,
      setFilter2: data.setFilter2,
      setFilter4: data.setFilter4,
      date: data.date,
      ...(bestRecipe ? { bestRecipe } : {}),
      ...(referenceDiscs.length > 0 ? { referenceDiscs } : {}),
      ...(referenceCombatStats ? { referenceCombatStats } : {}),
    }
  }
  pin(characterKey: CharacterKey, reference: TheoReference): boolean {
    return this.set(characterKey, reference)
  }
  clearReference(characterKey: CharacterKey): void {
    this.remove(characterKey)
  }
}

function cleanRolls(
  raw: Record<string, number | undefined>
): Partial<Record<DiscSubStatKey, number>> {
  const out: Partial<Record<DiscSubStatKey, number>> = {}
  for (const [key, rolls] of Object.entries(raw)) {
    if (!Number.isFinite(rolls) || (rolls ?? 0) <= 0) continue
    const sub = validateValue(key, allDiscSubStatKeys)
    if (sub) out[sub] = rolls as number
  }
  return out
}

/**
 * Normalize mains from the new single-main shape, the legacy union-array
 * shape (first entry was the best build's main), or the stored recipe.
 */
function cleanMains(
  raw: Record<string, unknown>,
  bestRecipe: BuildRecipe | undefined
): Partial<Record<DiscSlotKey, DiscMainStatKey>> {
  const out: Partial<Record<DiscSlotKey, DiscMainStatKey>> = {}
  for (const slot of allDiscSlotKeys) {
    const fromRecipe = bestRecipe?.mainStats[slot]
    if (
      fromRecipe &&
      (allDiscMainStatKeys as readonly string[]).includes(fromRecipe)
    ) {
      out[slot] = fromRecipe
      continue
    }
    const entry = raw[slot]
    const candidates = Array.isArray(entry) ? entry : [entry]
    for (const candidate of candidates) {
      if (
        typeof candidate === 'string' &&
        (allDiscMainStatKeys as readonly string[]).includes(candidate)
      ) {
        out[slot] = candidate as DiscMainStatKey
        break
      }
    }
  }
  return out
}

const combatStatKeys = [
  'hp',
  'atk',
  'def',
  'impact',
  'critRate',
  'critDmg',
  'penRatio',
  'pen',
  'enerRegen',
  'anomProf',
  'anomMas',
  'sheerForce',
  'dmgBonus',
  'defIgn',
] as const

function validateCombatStats(
  raw: Record<string, number> | undefined
): TheoReferenceCombatStats | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: TheoReferenceCombatStats = {}
  let found = false
  for (const key of combatStatKeys) {
    const v = raw[key]
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[key] = v
      found = true
    }
  }
  return found ? out : undefined
}

function validateRecipe(raw: unknown): BuildRecipe | undefined {
  const parsed = recipeSchema.safeParse(raw)
  if (!parsed.success) return undefined
  const data = parsed.data
  const set4 = validateValue(data.set4, allDiscSetKeys)
  const set2 = validateValue(data.set2, allDiscSetKeys)
  if (!set4 || !set2) return undefined
  const mainStats = {} as BuildRecipe['mainStats']
  let validSlots = 0
  for (const slot of allDiscSlotKeys) {
    const main = validateValue(
      data.mainStats[slot],
      allDiscMainStatKeys as readonly string[]
    )
    if (!main) return undefined
    mainStats[slot] = main as BuildRecipe['mainStats'][DiscSlotKey]
    validSlots++
  }
  if (validSlots !== allDiscSlotKeys.length) return undefined
  const totalRolls: BuildRecipe['totalRolls'] = {}
  for (const [key, rolls] of Object.entries(data.totalRolls ?? {})) {
    if (!Number.isFinite(rolls) || rolls <= 0) continue
    const sub = validateValue(key, allDiscSubStatKeys)
    if (sub) totalRolls[sub] = rolls
  }
  return {
    id: data.id || 'reference',
    mainStats,
    totalRolls,
    appearances: {},
    perDiscSubstats: (data.perDiscSubstats ?? []).map((subs) =>
      (subs ?? [])
        .filter(
          (s) =>
            validateValue(s.key, allDiscSubStatKeys) &&
            Number.isFinite(s.upgrades) &&
            s.upgrades > 0
        )
        .map((s) => ({
          key: s.key as DiscSubStatKey,
          upgrades: s.upgrades,
        }))
    ),
    set4,
    set2,
  }
}

function validateReferenceDiscs(raw: unknown): ICachedDisc[] {
  if (!Array.isArray(raw)) return []
  const out: ICachedDisc[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const parsed = recipeDiscSchema.safeParse(entry)
    if (!parsed.success) continue
    const d = parsed.data
    if (typeof d.id !== 'string' || !d.id || seen.has(d.id)) continue
    if (!validateValue(d.slotKey, allDiscSlotKeys)) continue
    if (!validateValue(d.setKey, allDiscSetKeys)) continue
    if (!validateValue(d.mainStatKey, allDiscMainStatKeys as readonly string[]))
      continue
    const substats = (d.substats ?? [])
      .filter(
        (s) =>
          validateValue(s.key, allDiscSubStatKeys) &&
          Number.isFinite(s.upgrades) &&
          s.upgrades > 0 &&
          s.key !== d.mainStatKey
      )
      .map((s) => ({ key: s.key as DiscSubStatKey, upgrades: s.upgrades }))
    seen.add(d.id)
    out.push({
      id: d.id,
      setKey: d.setKey as DiscSetKey,
      slotKey: d.slotKey as DiscSlotKey,
      level: 15,
      rarity: 'S',
      mainStatKey: d.mainStatKey as DiscMainStatKey,
      substats,
      location: '',
      lock: false,
      trash: false,
    })
  }
  return out
}

export function isTheoReferenceStale(
  reference: Pick<TheoReference, 'targetKey' | 'setFilter2' | 'setFilter4'>,
  current: Pick<TheoReference, 'targetKey' | 'setFilter2' | 'setFilter4'>
): boolean {
  return (
    reference.targetKey !== current.targetKey ||
    reference.setFilter2.join(',') !== current.setFilter2.join(',') ||
    reference.setFilter4.join(',') !== current.setFilter4.join(',')
  )
}
