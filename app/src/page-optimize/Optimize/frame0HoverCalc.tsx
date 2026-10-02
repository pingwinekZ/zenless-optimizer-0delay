import { Box } from '@mantine/core'
import { correctConditionalValue } from '@zenless-optimizer/game-opt/engine'
import { CalcContext, TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import { TagFieldDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import { read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey, DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type {
  ICachedDisc,
  Team,
  TeamConditional,
} from '@zenless-optimizer/zzz/db'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import {
  buffs,
  conditionals as conditionalsMeta,
  getConditional,
  zzzCalculatorWithEntries,
} from '@zenless-optimizer/zzz/formula'
import { buildCalculatorEntries } from '@zenless-optimizer/zzz/solver/buildStatsUtils'
import { useContext, useMemo } from 'react'

/**
 * Calculator for optimize-page conditional hover buffs that matches the
 * control's displayed status (frame0 defaults).
 *
 * The ambient page calc expands advanced rotations into per-hit presets via
 * `getComboFrames`, so `preset0` reads hit 0's blob override — not the
 * frame0 default shown in the control. That mixes combo per-hit states into
 * teammate-card / main-form hovers (e.g. Thoughtbop at frame0=2 showing the
 * hit0=1 buff). Stripping `comboStateJson` makes every preset share frame0,
 * so the hover matches the control. The hovered row is forced to
 * `currentValue` (append-if-missing) so synthesized teammate rows that
 * backfill never adds to frame0 still resolve.
 *
 * Built lazily inside `Frame0HoverFields` (mounted on hover open), mirroring
 * `ComboHoverFields` in the advanced drawer.
 */
export function useFrame0HoverCalc({
  sheet,
  condKey,
  src,
  dst,
  currentValue,
  mainCharKey,
  enabled = true,
}: {
  sheet: string
  condKey: string
  src: string
  dst: string | null
  currentValue: number
  mainCharKey: CharacterKey
  enabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const team = database.teams.get(mainCharKey)
  const teamCondJson = JSON.stringify(team?.frames[0]?.conditionals ?? null)
  const teamBlobJson = team?.frames[0]?.tag?.comboStateJson ?? null

  return useMemo(() => {
    if (!enabled) return null
    const meta = getConditional(sheet as never, condKey)
    if (!meta) return null
    if (!team) return null
    const frame0 = team.frames[0]
    if (!frame0) return null
    const character = database.chars.get(mainCharKey)
    if (!character) return null

    const eff = correctConditionalValue(meta as never, currentValue)
    const matched = frame0.conditionals.some(
      (c) => c.sheet === sheet && c.condKey === condKey && c.src === src
    )
    const conditionals: TeamConditional[] = matched
      ? frame0.conditionals.map((c) =>
          c.sheet === sheet && c.condKey === condKey && c.src === src
            ? { ...c, condValue: eff }
            : c
        )
      : [
          ...frame0.conditionals,
          { sheet, src, dst, condKey, condValue: eff } as TeamConditional,
        ]

    // Drop per-hit overrides so preset0 reads frame0 (the control's status).
    const tag = frame0.tag?.comboStateJson
      ? { ...frame0.tag, comboStateJson: undefined }
      : frame0.tag
    const overridden: Team = {
      ...team,
      frames: team.frames.map((f, i) =>
        i === 0 ? { ...f, conditionals, tag } : f
      ),
    }
    const discs = {} as Record<DiscSlotKey, ICachedDisc | undefined>
    for (const [slot, id] of Object.entries(character.equippedDiscs ?? {})) {
      discs[slot as DiscSlotKey] = id
        ? (database.discs.get(id) ?? undefined)
        : undefined
    }
    const entries = buildCalculatorEntries(
      character,
      discs,
      overridden,
      (key) => database.chars.get(key) ?? undefined,
      (id) => database.discs.get(id) ?? undefined
    )
    return zzzCalculatorWithEntries(entries)
    // teamCondJson/teamBlobJson re-snapshot committed states; `team` itself
    // is only read for stable references (character/teammates/enemy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    database,
    mainCharKey,
    sheet,
    condKey,
    src,
    dst,
    currentValue,
    enabled,
    team,
    teamCondJson,
    teamBlobJson,
  ])
}

/**
 * Squad/mindscape gate for a character's Additional Ability, ignoring the
 * character's own toggle/slider state.
 *
 * `useAbilityActive` (used by `AbilityBodyText` in sheet descriptions) checks
 * whether any `ability_*` buff is non-zero under the ambient calc — which
 * conflates the squad gate (e.g. Norma needing an Attack/Rupture/same-faction
 * teammate) with the row's own toggle (a stacks slider at 0 zeroes the buff
 * even when the squad gate passes). This builds a calc with this sheet's own
 * bool conditionals forced to 1 and num conditionals forced to max, so a
 * non-zero `ability_*` buff means the gate itself passes. List conditionals
 * select variants rather than on/off, so they keep their current values.
 *
 * Computed once per displayed character and shared by all its rows'
 * descriptions via `AbilityGateContext`, mirroring `useFrame0HoverCalc`'s
 * frame0 snapshot (per-hit `comboStateJson` overrides stripped).
 */
export function useAbilityGateActive({
  characterKey,
  src,
  mainCharKey,
}: {
  characterKey: CharacterKey
  src: string
  mainCharKey: CharacterKey
}): boolean {
  const { database } = useDatabaseContext()
  const outerTag = useContext(TagContext)
  const team = database.teams.get(mainCharKey)
  const teamCondJson = JSON.stringify(team?.frames[0]?.conditionals ?? null)
  const teamBlobJson = team?.frames[0]?.tag?.comboStateJson ?? null

  return useMemo(() => {
    const charBuffs = (buffs as any)[characterKey] as
      | Record<string, { tag?: Tag }>
      | undefined
    const abilityTags = charBuffs
      ? Object.entries(charBuffs)
          .filter(([name]) => name.startsWith('ability_'))
          .map(([, b]) => b?.tag)
          .filter((t): t is Tag => !!t)
      : []
    if (abilityTags.length === 0) return true
    if (!team) return true
    const frame0 = team.frames[0]
    if (!frame0) return true
    const character = database.chars.get(mainCharKey)
    if (!character) return true

    const onValues = new Map<string, number>()
    const sheetConds = (conditionalsMeta as any)[characterKey] as
      | Record<string, { type?: string; max?: unknown }>
      | undefined
    if (sheetConds) {
      for (const [condKey, meta] of Object.entries(sheetConds)) {
        if (meta?.type === 'bool') onValues.set(condKey, 1)
        else if (meta?.type === 'num')
          onValues.set(
            condKey,
            typeof meta.max === 'number' && meta.max > 0 ? meta.max : 1
          )
      }
    }

    const overridden: TeamConditional[] = frame0.conditionals.map((c) =>
      c.sheet === characterKey && c.src === src && onValues.has(c.condKey)
        ? { ...c, condValue: onValues.get(c.condKey) as number }
        : c
    )
    for (const [condKey, condValue] of onValues) {
      if (
        !overridden.some(
          (c) =>
            c.sheet === characterKey && c.condKey === condKey && c.src === src
        )
      )
        overridden.push({
          sheet: characterKey,
          src,
          dst: null,
          condKey,
          condValue,
        } as TeamConditional)
    }

    // Drop per-hit overrides so preset0 reads frame0.
    const tag = frame0.tag?.comboStateJson
      ? { ...frame0.tag, comboStateJson: undefined }
      : frame0.tag
    const gated: Team = {
      ...team,
      frames: team.frames.map((f, i) =>
        i === 0 ? { ...f, conditionals: overridden, tag } : f
      ),
    }
    const discs = {} as Record<DiscSlotKey, ICachedDisc | undefined>
    for (const [slot, id] of Object.entries(character.equippedDiscs ?? {})) {
      discs[slot as DiscSlotKey] = id
        ? (database.discs.get(id) ?? undefined)
        : undefined
    }
    const entries = buildCalculatorEntries(
      character,
      discs,
      gated,
      (key) => database.chars.get(key) ?? undefined,
      (id) => database.discs.get(id) ?? undefined
    )
    const calc = zzzCalculatorWithEntries(entries)
    const contextTag = { ...outerTag, src: characterKey } as Tag
    return abilityTags.some(
      (t) => calc.withTag(contextTag).compute(read(t)).val > 0
    )
    // teamCondJson/teamBlobJson re-snapshot committed states; `team` itself
    // is only read for stable references (character/teammates/enemy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    database,
    mainCharKey,
    characterKey,
    src,
    outerTag,
    team,
    teamCondJson,
    teamBlobJson,
  ])
}

/**
 * Buff value fields for an optimize-page conditional row, computed with the
 * frame0 hover calc above. Mounted on hover open, so the calc build only runs
 * for hovered rows.
 */
export function Frame0HoverFields({
  sheet,
  condKey,
  src,
  dst,
  currentValue,
  mainCharKey,
  fields,
  showZero,
}: {
  sheet: string
  condKey: string
  src: string
  dst: string | null
  currentValue: number
  mainCharKey: CharacterKey
  fields: Field[]
  showZero?: boolean
}) {
  const calc = useFrame0HoverCalc({
    sheet,
    condKey,
    src,
    dst,
    currentValue,
    mainCharKey,
  })
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(() => ({ ...outerTag, src }), [outerTag, src])
  if (fields.length === 0) return null
  const list = (
    <Box mt={4}>
      <TagContext.Provider value={tagForFields as any}>
        {fields.map(
          (field, i) =>
            'fieldRef' in field && (
              <TagFieldDisplay
                key={i}
                field={field}
                showZero={showZero}
                rowSx={{ paddingTop: 1, paddingBottom: 1, gap: 6 }}
              />
            )
        )}
      </TagContext.Provider>
    </Box>
  )
  // Without an override calc, fall through to the ambient page calc
  // (previous behavior).
  if (!calc) return list
  return (
    <CalcContext.Provider value={calc as never}>{list}</CalcContext.Provider>
  )
}
