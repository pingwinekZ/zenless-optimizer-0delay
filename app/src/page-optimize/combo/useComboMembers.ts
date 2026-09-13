import { useMemo } from 'react'
import type { CharacterKey } from '../../consts'
import type { Team, TeamConditional } from '../../db'
import { useCharacter, useDiscSets, useDiscs } from '../../db-ui'

export type ComboMember = {
  key: CharacterKey
  wengineKey: string
  discSets: string[]
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

  return useMemo(() => {
    const members: ComboMember[] = []
    const push = (
      key: CharacterKey | undefined,
      wengineKey: string | undefined,
      sets: Record<string, number>
    ) => {
      if (!key) return
      members.push({
        key,
        wengineKey: wengineKey ?? '',
        discSets: Object.keys(sets),
      })
    }
    push(mainKey, mainChar?.wengineKey, mainSets)
    push(t1Key, t1Char?.wengineKey, t1Sets)
    push(t2Key, t2Char?.wengineKey, t2Sets)
    return members
  }, [
    mainKey,
    mainChar?.wengineKey,
    mainSets,
    t1Key,
    t1Char?.wengineKey,
    t1Sets,
    t2Key,
    t2Char?.wengineKey,
    t2Sets,
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
          m.discSets.includes(c.sheet))
    )
  )
}

/**
 * Order entries so each member's character sheet comes first, then its
 * w-engine, then its disc sets — members in team order (main first).
 */
export function sortRelevantConditionals(
  conditionals: TeamConditional[],
  members: ComboMember[]
): TeamConditional[] {
  const rank = new Map<string, number>()
  members.forEach((m, i) => {
    const base = i * 4
    rank.set(`${m.key}:${m.key}`, base)
    if (m.wengineKey !== '') rank.set(`${m.key}:${m.wengineKey}`, base + 1)
    m.discSets.forEach((set, j) =>
      rank.set(`${m.key}:${set}`, base + 2 + j * 0.01)
    )
  })
  return [...conditionals].sort(
    (a, b) =>
      (rank.get(`${a.src}:${a.sheet}`) ?? 999) -
      (rank.get(`${b.src}:${b.sheet}`) ?? 999)
  )
}
