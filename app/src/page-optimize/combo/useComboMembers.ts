import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { Team, TeamConditional } from '@zenless-optimizer/zzz/db'
import {
  useCharacter,
  useDiscSets,
  useDiscs,
} from '@zenless-optimizer/zzz/db-ui'
import {
  conditionals as allConditionalsMeta,
  buffs,
} from '@zenless-optimizer/zzz/formula'
import {
  charSheets,
  discUiSheets,
  wengineUiSheets,
} from '@zenless-optimizer/zzz/formula-ui'
import { buffAppliesToMainUnit } from '@zenless-optimizer/zzz/formula-ui/teammate'
import { useMemo } from 'react'

export type ComboMember = {
  key: CharacterKey
  mindscape: number
  wengineKey: string
  wenginePhase: number
  discSets: Partial<Record<string, 2 | 4>>
}

/**
 * Team members with their equipped gear, mirroring what the optimize page
 * displays conditionals for: each member's character, w-engine and active
 * disc sets. Used to filter the drawer's rows down from the backfilled
 * every-sheet-in-the-game frame conditionals.
 */
export function useComboMembers(
  mainKey: CharacterKey,
  team: Team
): ComboMember[] {
  const t1Key = team.teammates[1]?.characterKey
  const t2Key = team.teammates[2]?.characterKey
  const mainChar = useCharacter(mainKey)
  const t1Char = useCharacter(t1Key)
  const t2Char = useCharacter(t2Key)
  const mainDiscs = useDiscs(mainChar?.equippedDiscs)
  const t1Discs = useDiscs(t1Char?.equippedDiscs)
  const t2Discs = useDiscs(t2Char?.equippedDiscs)
  const mainSets = useDiscSets(mainDiscs)
  const t1Sets = useDiscSets(t1Discs)
  const t2Sets = useDiscSets(t2Discs)

  // Teammate overrides (mindscape/phase) live on the team datum, mirroring
  // TeammateCard's effectiveMindscape/effectiveWenginePhase resolution.
  const t1Datum = team.teammates[1]
  const t2Datum = team.teammates[2]
  return useMemo(() => {
    const members: ComboMember[] = []
    const push = (
      key: CharacterKey | undefined,
      mindscape: number | undefined,
      wengineKey: string | undefined,
      wenginePhase: number | undefined,
      sets: Partial<Record<string, 2 | 4>>
    ) => {
      if (!key) return
      members.push({
        key,
        mindscape: mindscape ?? 0,
        wengineKey: wengineKey ?? '',
        wenginePhase: wenginePhase ?? 1,
        discSets: sets,
      })
    }
    push(
      mainKey,
      mainChar?.mindscape,
      mainChar?.wengineKey,
      mainChar?.wenginePhase,
      mainSets
    )
    push(
      t1Key,
      t1Datum?.mindscape ?? t1Char?.mindscape,
      t1Char?.wengineKey,
      t1Datum?.wenginePhase ?? t1Char?.wenginePhase,
      t1Sets
    )
    push(
      t2Key,
      t2Datum?.mindscape ?? t2Char?.mindscape,
      t2Char?.wengineKey,
      t2Datum?.wenginePhase ?? t2Char?.wenginePhase,
      t2Sets
    )
    return members
  }, [
    mainKey,
    mainChar?.mindscape,
    mainChar?.wengineKey,
    mainChar?.wenginePhase,
    mainSets,
    t1Key,
    t1Char?.mindscape,
    t1Char?.wengineKey,
    t1Char?.wenginePhase,
    t1Sets,
    t1Datum?.mindscape,
    t1Datum?.wenginePhase,
    t2Key,
    t2Char?.mindscape,
    t2Char?.wengineKey,
    t2Char?.wenginePhase,
    t2Sets,
    t2Datum?.mindscape,
    t2Datum?.wenginePhase,
  ])
}

/**
 * Whether a teammate's conditional affects the main unit's combo damage,
 * mirroring the teammate-card displays (which hide self-only buffs).
 * Main-member rows always return true — only call this for teammates.
 *
 * - Character sheets: any direct teamwide field, or `showInTeammateView`
 *   (control state gates team buffs defined in other documents). Unlike the
 *   teammate card's `buff.team` flag check, effect types are also consulted:
 *   enemy debuffs (e.g. Sunna's M1 DEF shred, flagged `team: false`) still
 *   reach the main unit's combo damage and must stay.
 * - W-engine / disc sheets: any direct teamwide field. Rows with no
 *   buff fields to judge by (e.g. only informational Duration formulas)
 *   are kept, matching the card's "can't determine → show" fallback.
 */
export function isTeammateConditionalTeamwide(
  sheet: string,
  condKey: string
): boolean {
  const sheetBuffs = (buffs as any)[sheet] as
    | Record<string, { team?: boolean }>
    | undefined

  // Character sheet: scan every section for this conditional.
  const charSheet = (charSheets as Record<string, any>)[sheet]
  if (charSheet) {
    for (const section of Object.values(charSheet) as any[]) {
      for (const doc of (section as any).documents ?? []) {
        if (
          doc?.type !== 'conditional' ||
          doc.conditional?.metadata?.name !== condKey
        )
          continue
        if (doc.conditional.showInTeammateView) return true
        const fields = ((doc.conditional.fields ?? []) as any[]).filter(
          (f) => !('minPotential' in f) || (f.minPotential ?? 0) <= 6
        )
        for (const f of fields) {
          if ('team' in f) {
            if ((f as any).team !== false) return true
            if ((f as any).fieldRef) {
              if (buffAppliesToMainUnit((f as any).fieldRef)) return true
            }
            continue
          }
          if ('fieldRef' in f && (f as any).fieldRef?.name) {
            const buff = sheetBuffs?.[(f as any).fieldRef.name]
            if (buff?.team) return true
            if (buffAppliesToMainUnit((f as any).fieldRef)) return true
          }
        }
      }
    }
    return false
  }

  // W-engine sheet: strict direct-field check (no "any team buff keeps all"
  // fallback — that would keep self-only rows the drawer should hide).
  const wengineSheet = (wengineUiSheets as Record<string, any>)[sheet]
  if (wengineSheet) {
    let sawBuffField = false
    for (const doc of wengineSheet.documents ?? []) {
      if (
        doc?.type !== 'conditional' ||
        doc.conditional?.metadata?.name !== condKey
      )
        continue
      for (const f of (doc.conditional.fields ?? []) as any[]) {
        const isBuffField =
          'team' in f || (f.fieldRef?.name && sheetBuffs?.[f.fieldRef.name])
        if (!isBuffField) continue
        sawBuffField = true
        if (isWengineBuffFieldTeamWide(f, sheetBuffs)) return true
      }
    }
    // No buff fields to judge by (e.g. only Duration formulas) — keep.
    return !sawBuffField
  }

  // Disc sheet: scan both blocks, same strict direct-field check.
  const discSheet = (discUiSheets as Record<string, any>)[sheet]
  if (discSheet) {
    let sawBuffField = false
    for (const blockKey of ['2', '4'] as const) {
      for (const doc of discSheet[blockKey]?.documents ?? []) {
        if (
          doc?.type !== 'conditional' ||
          doc.conditional?.metadata?.name !== condKey
        )
          continue
        for (const f of (doc.conditional.fields ?? []) as any[]) {
          const isBuffField =
            'team' in f || (f.fieldRef?.name && sheetBuffs?.[f.fieldRef.name])
          if (!isBuffField) continue
          sawBuffField = true
          if (isDiscBuffFieldTeamWide(f, sheetBuffs)) return true
        }
      }
    }
    return !sawBuffField
  }

  // Unknown sheet — keep (previous behavior) to avoid hiding content
  // on lookup failure.
  return true
}

function isWengineBuffFieldTeamWide(
  f: any,
  sheetBuffs: Record<string, { team?: boolean }> | undefined
): boolean {
  if ('team' in f) {
    if (f.team !== false) return true
    if (f.fieldRef) return buffAppliesToMainUnit(f.fieldRef)
    return false
  }
  if (sheetBuffs && f.fieldRef?.name) {
    const buff = sheetBuffs[f.fieldRef.name]
    if (buff) {
      if (buff.team) return true
      return buffAppliesToMainUnit(f.fieldRef)
    }
    return buffAppliesToMainUnit(f.fieldRef)
  }
  return false
}

function isDiscBuffFieldTeamWide(
  f: any,
  sheetBuffs: Record<string, { team?: boolean }> | undefined
): boolean {
  if ('team' in f) {
    if (f.team !== false) return true
    if (f.fieldRef) return buffAppliesToMainUnit(f.fieldRef)
    return false
  }
  if (sheetBuffs && f.fieldRef?.name) {
    const buff = sheetBuffs[f.fieldRef.name]
    if (buff) {
      if (buff.team) return true
      return buffAppliesToMainUnit(f.fieldRef)
    }
    return buffAppliesToMainUnit(f.fieldRef)
  }
  return false
}

/**
 * Keep only entries the optimize page actually reads: each member's own
 * character sheet, equipped w-engine sheet and active disc set sheets
 * (matching by `src`, like the page's conditional displays do).
 * Teammate rows that never reach the main unit (self-only buffs, e.g.
 * Sunna's Focused Creation CR & CD) are dropped — their per-hit values
 * can't change combo damage.
 */
export function filterRelevantConditionals(
  conditionals: TeamConditional[],
  members: ComboMember[]
): TeamConditional[] {
  const mainKey = members[0]?.key
  return conditionals.filter((c) => {
    // Enemy state (stunned, windswept, ...) applies to every hit, so it is
    // always relevant in the main member's context.
    if (c.sheet === 'enemy' && c.src === mainKey) return true
    const owner = members.find(
      (m) =>
        c.src === m.key &&
        (c.sheet === m.key ||
          (m.wengineKey !== '' && c.sheet === m.wengineKey) ||
          m.discSets[c.sheet] != null)
    )
    if (!owner) return false
    if (owner.key === mainKey) return true
    return isTeammateConditionalTeamwide(c.sheet, c.condKey)
  })
}

/**
 * Synthesize teammate entries that the page reads (`src` = teammate key)
 * but the frame doesn't store yet. Untouched teammate buffs have no frame
 * entry (backfill only creates `src` = main entries, which the calc ignores
 * for teammates) — the page displays them as 0, so the drawer does the
 * same. Entries are only written back to the frame on save when actually
 * edited (see the drawer's dirty tracking), so this changes nothing until
 * the user touches a row.
 */
export function synthesizeTeammateConditionals(
  conditionals: TeamConditional[],
  members: ComboMember[]
): TeamConditional[] {
  const meta = allConditionalsMeta as Record<string, Record<string, unknown>>
  const existing = new Set(
    conditionals.map((c) => `${c.sheet}:${c.condKey}:${c.src}:${c.dst}`)
  )
  const result = [...conditionals]
  for (const member of members.slice(1)) {
    const sheets = [
      member.key,
      ...(member.wengineKey !== '' ? [member.wengineKey] : []),
      ...Object.keys(member.discSets),
    ]
    for (const sheet of sheets) {
      const condKeys = Object.keys(meta[sheet] ?? {})
      for (const condKey of condKeys) {
        // Skip self-only teammate buffs — they never reach the main unit,
        // so the drawer (and combo damage) has no use for their rows.
        if (!isTeammateConditionalTeamwide(sheet, condKey)) continue
        const key = `${sheet}:${condKey}:${member.key}:null`
        if (existing.has(key)) continue
        existing.add(key)
        result.push({
          sheet: sheet as never,
          src: member.key as never,
          dst: null as never,
          condKey,
          condValue: 0,
        })
      }
    }
  }
  return result
}

/**
 * Synthesize rows for an extra (unequipped) disc set picked in the drawer,
 * in the main member's context — the optimizer swaps the main character's
 * discs, so per-hit activations apply whenever a build equips the set
 * (set buffs are gated on equipped counts, so this is inert otherwise).
 * Defaults mirror backfill (as if the set were equipped).
 */
export function synthesizeExtraSet(
  setKey: string,
  src: string
): TeamConditional[] {
  const condKeys = Object.keys(
    (allConditionalsMeta as Record<string, Record<string, unknown>>)[setKey] ??
      {}
  )
  return condKeys.map((condKey) => {
    const meta = (
      allConditionalsMeta as Record<
        string,
        Record<string, { type?: string; max?: number }>
      >
    )[setKey]?.[condKey]
    const condValue =
      meta?.type === 'bool' ? 1 : meta?.type === 'num' ? (meta.max ?? 10) : 0
    return {
      sheet: setKey as never,
      src: src as never,
      dst: null as never,
      condKey,
      condValue,
    }
  })
}
export function sortRelevantConditionals(
  conditionals: TeamConditional[],
  members: ComboMember[]
): TeamConditional[] {
  const rank = new Map<string, number>()
  members.forEach((m, i) => {
    const base = i * 4
    rank.set(`${m.key}:${m.key}`, base)
    if (m.wengineKey !== '') rank.set(`${m.key}:${m.wengineKey}`, base + 1)
    Object.keys(m.discSets).forEach((set, j) =>
      rank.set(`${m.key}:${set}`, base + 2 + j * 0.01)
    )
  })
  return [...conditionals].sort(
    (a, b) =>
      (rank.get(`${a.src}:${a.sheet}`) ?? 999) -
      (rank.get(`${b.src}:${b.sheet}`) ?? 999)
  )
}
