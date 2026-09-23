import type { Field, Header } from '@zenless-optimizer/game-opt/sheet-ui'
import { isTagField } from '@zenless-optimizer/game-opt/sheet-ui'
import type { CharacterKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import { buffs as allBuffs } from '@zenless-optimizer/zzz/formula'
import { wengineUiSheets } from '@zenless-optimizer/zzz/formula-ui'
import {
  buffAppliesToMainUnit,
  buffAppliesToSelf,
} from '@zenless-optimizer/zzz/formula-ui/teammate'
import type { ReactNode } from 'react'

/** Whether a UI-sheet field references a team-wide buff entry. */
export function isBuffFieldTeamWide(
  wengineBuffs: Record<string, { team?: boolean }> | undefined,
  f: Field
): boolean {
  // If the field has an explicit team flag, use it
  if ('team' in f) {
    if (f.team !== false) return true
    if ('fieldRef' in f && f.fieldRef) return buffAppliesToMainUnit(f.fieldRef)
    return false
  }
  // Look up by fieldRef.name against buff metadata
  if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name) {
    const buff = wengineBuffs[f.fieldRef.name]
    // If the field matches a buff entry, check its team flag
    if (buff) {
      if (buff.team) return true
      return buffAppliesToMainUnit(f.fieldRef)
    }
    // Fallback: check if it applies to the main unit (e.g. enemy debuffs)
    return buffAppliesToMainUnit(f.fieldRef)
  }
  // If we can't determine (no buff metadata or no matching buff entry),
  // this is not a known buff field — treat as not team-wide
  return false
}

/** Conditional fields from a wengine UI sheet, filtered for own vs teammate view. */
export function extractWengineConditionalFields(
  wengineKey: WengineKey | '',
  teammateKey: CharacterKey | undefined
): Record<string, Field[]> | undefined {
  if (!wengineKey) return undefined
  const sheet = wengineUiSheets[wengineKey]
  if (!sheet) return undefined
  // Look up buff metadata to determine if each field is team-wide.
  // Many wengine UI sheets use tagToTagField which doesn't include the
  // team flag, so we need to match by fieldRef.name against the buffs lookup.
  const wengineBuffs = (allBuffs as any)[wengineKey] as
    | Record<string, { team?: boolean }>
    | undefined
  // Helper to check if a field references a buff entry (has fieldRef.name)
  // and returns whether that buff is team-wide.
  // Pre-check: does this wengine have ANY team-wide buffs?
  // If so, conditionals should always be shown in teammate view even if
  // their direct fields are self-only (e.g. Neon Fantasies: stacks
  // conditional's own fields are self-only, but squadDmg_ team buff
  // depends on the stacks value).
  const wengineHasTeamBuffs =
    teammateKey &&
    wengineBuffs &&
    Object.values(wengineBuffs).some((b) => b.team === true)

  const result: Record<string, Field[]> = {}
  sheet.documents.forEach((doc) => {
    // Process 'conditional' documents (interactive conditionals)
    if (doc.type === 'conditional' && doc.conditional) {
      const condName = doc.conditional.metadata.name
      const fields = doc.conditional.fields
      const fieldsArr = fields ?? []
      if (teammateKey) {
        // Collect only fields that match entries in the buff metadata
        // (or have an explicit team flag). Fields that don't match any
        // buff entry (e.g., Duration formulas) can't be used to determine
        // team status.
        const matchingBuffFields = fieldsArr.filter((f: Field) => {
          if ('team' in f) return true
          if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name)
            return !!wengineBuffs[f.fieldRef.name]
          return false
        })
        // Show conditional if:
        // 1) It has team-wide fields directly, OR
        // 2) The wengine has ANY team-wide buffs (the conditional's control
        //    state may affect team-wide buffs defined in other documents)
        const hasTeamBuff =
          matchingBuffFields.length === 0
            ? !!wengineHasTeamBuffs
            : matchingBuffFields.some((f: Field) =>
                isBuffFieldTeamWide(wengineBuffs, f)
              ) || !!wengineHasTeamBuffs
        if (!hasTeamBuff) return
        // Include team-wide buff fields and informational fields
        // (fields that don't match any entry in the buff metadata).
        const teamFields = fieldsArr.filter(
          (f: Field) =>
            // If no buff metadata, include everything
            !wengineBuffs ||
            // Include informational fields not found in buff metadata
            !(
              'fieldRef' in f &&
              f.fieldRef?.name &&
              wengineBuffs[f.fieldRef.name]
            ) ||
            // Or include team-wide buff fields
            isBuffFieldTeamWide(wengineBuffs, f)
        )
        // In teammate view, always include the conditional (even with 0 fields)
        // so the interactive control (toggle/slider) is visible. The control
        // state affects team-wide buffs even if this conditional's own fields
        // are self-only.
        if (!result[condName]) result[condName] = []
        result[condName].push(...teamFields)
      } else {
        // Main character view: include fields that apply to self.
        // Hide squad-only buffs (e.g. notOwnBuff team DMG) from own view.
        if (!result[condName]) result[condName] = []
        result[condName].push(
          ...fieldsArr.filter(
            (f: Field) => !isTagField(f) || buffAppliesToSelf(f.fieldRef)
          )
        )
      }
    }
  })
  // When in teammate view, return result even if empty so the caller
  // can distinguish "no UI sheet" (undefined) from "all fields filtered" ({}).
  if (teammateKey) return result
  return Object.keys(result).length > 0 ? result : undefined
}

/** Non-function conditional labels from a wengine UI sheet. */
export function extractWengineCondLabels(
  wengineKey: WengineKey | ''
): Record<string, ReactNode> | undefined {
  if (!wengineKey) return undefined
  const sheet = wengineUiSheets[wengineKey]
  if (!sheet) return undefined
  const result: Record<string, ReactNode> = {}
  sheet.documents.forEach((doc) => {
    if (doc.type === 'conditional' && doc.conditional?.label) {
      const condName = doc.conditional.metadata.name
      const label = doc.conditional.label
      if (typeof label === 'function') return
      result[condName] = label
    }
  })
  return Object.keys(result).length > 0 ? result : undefined
}

/** Passive (always-active) field groups, filtered for own vs teammate view. */
export function extractWenginePassiveGroups(
  wengineKey: WengineKey | '',
  teammateKey: CharacterKey | undefined
): { header?: Header; fields: Field[] }[] | undefined {
  if (!wengineKey) return undefined
  const sheet = wengineUiSheets[wengineKey]
  if (!sheet) return undefined
  const wengineBuffs = (allBuffs as any)[wengineKey] as
    | Record<string, { team?: boolean }>
    | undefined
  const groups: { header?: Header; fields: Field[] }[] = []
  sheet.documents.forEach((doc) => {
    if (doc.type === 'fields' && doc.fields?.length) {
      if (teammateKey) {
        const matchingBuffFields = doc.fields.filter((f: Field) => {
          if ('team' in f) return true
          if (wengineBuffs && 'fieldRef' in f && f.fieldRef?.name)
            return !!wengineBuffs[f.fieldRef.name]
          return false
        })
        const hasTeamBuff =
          matchingBuffFields.length === 0
            ? false
            : matchingBuffFields.some((f: Field) =>
                isBuffFieldTeamWide(wengineBuffs, f)
              )
        if (!hasTeamBuff) return
        // JoyauDore: self-only AP passive should not show for teammates
        if (
          wengineKey === 'JoyauDore' &&
          matchingBuffFields.some(
            (f) => 'fieldRef' in f && f.fieldRef?.name === 'anomProf'
          )
        ) {
          return
        }
        const teamFields = doc.fields.filter(
          (f: Field) =>
            !wengineBuffs ||
            !(
              'fieldRef' in f &&
              f.fieldRef?.name &&
              wengineBuffs[f.fieldRef.name]
            ) ||
            isBuffFieldTeamWide(wengineBuffs, f)
        )
        groups.push({ header: doc.header, fields: teamFields })
      } else {
        groups.push({ header: doc.header, fields: doc.fields })
      }
    }
  })
  return groups.length > 0 ? groups : undefined
}

/**
 * Whether a wengine conditional toggle should be shown, accounting for
 * teammate view (self-only buffs) and character restrictions.
 */
export function isWengineCondVisible(
  wengineKey: WengineKey,
  condName: string,
  fields: Record<string, Field[]> | undefined,
  teammateKey: CharacterKey | undefined,
  srcFaction: string | undefined
): boolean {
  if (condName === '__passive_team_buffs__') return false
  // If fields are provided and condName is missing, all its fields were
  // self-buffs — skip the entire conditional toggle
  if (fields && !fields[condName]) return false
  // SolExuvia's Eclipse effect only works for Pyrois (Phaethon faction)
  if (wengineKey === 'SolExuvia' && condName === 'eclipse_active') {
    if (srcFaction !== 'Phaethon') return false
  }
  // ChiefSidekick's Off-field Energy Regen is self-only, hide from teammate view
  if (
    wengineKey === 'ChiefSidekick' &&
    condName === 'offField' &&
    teammateKey
  ) {
    return false
  }
  // YesterdayCalls's Off-field Energy Regen is self-only, hide from teammate view
  if (
    wengineKey === 'YesterdayCalls' &&
    condName === 'offField' &&
    teammateKey
  ) {
    return false
  }
  // Thoughtbop's Off-field Energy Regen is self-only, hide from teammate view
  if (wengineKey === 'Thoughtbop' && condName === 'offField' && teammateKey) {
    return false
  }
  // Metanukimorphosis: EX Special / Ultimate Physical Hit AM is self-only, hide from teammate view
  if (
    wengineKey === 'Metanukimorphosis' &&
    condName === 'physical_exSpecial_ult' &&
    teammateKey
  ) {
    return false
  }
  // SpectralGaze: Spirit Lock stacks are self-only (equipper Impact), hide from teammate view
  if (
    wengineKey === 'SpectralGaze' &&
    condName === 'spiritLock' &&
    teammateKey
  ) {
    return false
  }
  // BlazingLaurel: Quick/Perfect Assist Impact is self-only, hide from teammate view
  if (
    wengineKey === 'BlazingLaurel' &&
    condName === 'quickOrPerfectAssistUsed' &&
    teammateKey
  ) {
    return false
  }
  // WeepingCradle: Off-field Energy Regen is self-only, hide from teammate view
  if (
    wengineKey === 'WeepingCradle' &&
    condName === 'offField' &&
    teammateKey
  ) {
    return false
  }
  return true
}
