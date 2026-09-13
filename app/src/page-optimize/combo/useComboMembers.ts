import { useMemo } from 'react'
import type { CharacterKey } from '../../consts'
import type { Team, TeamConditional } from '../../db'
import { useCharacter, useDiscSets, useDiscs } from '../../db-ui'
import { conditionals as allConditionalsMeta } from '../../formula'

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
 * Keep only entries the optimize page actually reads: each member's own
 * character sheet, equipped w-engine sheet and active disc set sheets
 * (matching by `src`, like the page's conditional displays do).
 */
export function filterRelevantConditionals(
  conditionals: TeamConditional[],
  members: ComboMember[]
): TeamConditional[] {
  return conditionals.filter((c) =>
    members.some(
      (m) =>
        c.src === m.key &&
        (c.sheet === m.key ||
          (m.wengineKey !== '' && c.sheet === m.wengineKey) ||
          m.discSets[c.sheet] != null)
    )
  )
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
