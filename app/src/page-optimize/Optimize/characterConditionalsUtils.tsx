import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import type {
  Field,
  FieldsDocument,
} from '@zenless-optimizer/game-opt/sheet-ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { buffs } from '@zenless-optimizer/zzz/formula'
import { charSheets } from '@zenless-optimizer/zzz/formula-ui'
import { buffAppliesToMainUnit } from '@zenless-optimizer/zzz/formula-ui/teammate'
import { GameText } from '@zenless-optimizer/zzz/i18n'
import type { ReactNode } from 'react'

export const SECTION_ORDER = [
  'unique',
  'basic',
  'dodge',
  'assist',
  'special',
  'chain',
  'core',
  'ability',
  'potential',
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
] as const

export const LUMIFLUX_TEXT_COLOR = '#FFA9DD'
export const FLUX_TEXT_COLOR = '#D9A600'

export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  unique: 'Unique',
  basic: 'Basic Attack',
  dodge: 'Dodge',
  assist: 'Assist',
  special: 'Special',
  chain: 'Chain Attack',
  core: 'Core',
  ability: 'Additional Ability',
  potential: 'Potential',
  m1: 'M1',
  m2: 'M2',
  m3: 'M3',
  m4: 'M4',
  m5: 'M5',
  m6: 'M6',
}

export type PassiveEntry = {
  fields: Field[]
  mindscape: number
  sectionKey: string
  paragraph?: number
  descKey?: string
  groupTitle?: ReactNode
  description?: ReactNode
}

export type SectionConditional = {
  condName: string
  condData: IConditionalData
  fields?: Field[]
  description?: ReactNode
  label?: ReactNode
  linked?: string | string[]
  maxByMindscape?: Record<number, number>
  noDimWhenZero?: boolean
}

export type SectionGroup = {
  sectionKey: string
  conditionals: SectionConditional[]
  passives: PassiveEntry[]
}

export function renderDescription(desc: ReactNode): ReactNode {
  if (typeof desc === 'string') return <GameText text={desc} />
  return desc
}

export function getMindscapeRequirement(condName: string): number | null {
  const match = condName.match(/^m([1-6])/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

export function passiveSectionToDescKey(
  sectionKey: string,
  fieldName: string | null | undefined,
  coreLevel: number,
  potential: number
): string | null {
  if (sectionKey === 'core') {
    if (fieldName?.startsWith('ability_')) return 'ability.desc'
    return `core.desc.${coreLevel ?? 0}`
  }
  if (sectionKey === 'potential') return `potential.desc.${potential}`
  const m = sectionKey.match(/^m([1-6])$/)
  if (m) return `mindscapes.${m[1]}.desc`
  return null
}

export function extractCharConditionalFields(
  characterKey: CharacterKey,
  teammateKey: CharacterKey | undefined,
  potential: number
): Record<string, Field[]> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const charBuffs = (buffs as any)[characterKey] as
    | Record<string, { team?: boolean }>
    | undefined
  const isTeammateView = !!teammateKey
  const result: Record<string, Field[]> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional) {
        const condName = doc.conditional.metadata.name
        const fields = (doc.conditional.fields ?? []).filter(
          (f) => !('minPotential' in f) || (f.minPotential ?? 0) <= potential
        )
        if (isTeammateView) {
          const teamFields = fields.filter((f) => {
            if ('team' in f) {
              if (f.team !== false) return true
              return false
            }
            if ('fieldRef' in f && f.fieldRef?.name) {
              const buff = charBuffs?.[f.fieldRef.name]
              if (buff?.team !== undefined) {
                if (buff.team) return true
                return false
              }
              return buffAppliesToMainUnit(f.fieldRef)
            }
            return false
          })
          if (teamFields.length === 0 && !doc.conditional.showInTeammateView)
            return
          if (!result[condName]) result[condName] = []
          // Dedup only against fields merged from earlier docs (linked
          // conditionals split across sections). Fields within this doc are
          // all kept, even when they share a tag: the same buff may be shown
          // under several per-hit/per-skill titles (Seed §3.7 pattern).
          const seenKeys = new Set(
            result[condName]
              .map((f) =>
                'fieldRef' in f
                  ? `${f.fieldRef?.q ?? ''}|${f.fieldRef?.damageType1 ?? ''}|${f.fieldRef?.damageType2 ?? ''}|${f.fieldRef?.name ?? ''}`
                  : undefined
              )
              .filter(Boolean)
          )
          for (const field of teamFields) {
            if ('fieldRef' in field) {
              const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}|${field.fieldRef?.name ?? ''}`
              if (!key || !seenKeys.has(key)) {
                result[condName].push(field)
              }
            } else {
              result[condName].push(field)
            }
          }
        } else {
          // Seed directStrike: hide vanguard-only conditional from own view
          if (characterKey === 'Seed' && condName === 'directStrike') return
          // Remielle m1: hide squad-only Anomaly DMG conditional from own view
          if (characterKey === 'Remielle' && condName === 'phaseFlow_m1') return
          if (!result[condName]) result[condName] = []
          // Dedup only against fields merged from earlier docs (linked
          // conditionals split across sections). Fields within this doc are
          // all kept, even when they share a tag: the same buff may be shown
          // under several per-hit/per-skill titles (Seed §3.7 pattern).
          const seenKeys = new Set(
            result[condName]
              .map((f) =>
                'fieldRef' in f
                  ? `${f.fieldRef?.q ?? ''}|${f.fieldRef?.damageType1 ?? ''}|${f.fieldRef?.damageType2 ?? ''}|${f.fieldRef?.name ?? ''}`
                  : undefined
              )
              .filter(Boolean)
          )
          for (const field of fields) {
            // Zhao m2: hide team ATK from main character view
            if (
              characterKey === 'Zhao' &&
              'fieldRef' in field &&
              field.fieldRef?.name === 'm2_team_atk_'
            )
              continue
            // Seed m2: hide vanguard DEF Ignore from main character view
            if (
              characterKey === 'Seed' &&
              'fieldRef' in field &&
              field.fieldRef?.name === 'm2_vanguard_defIgn_'
            )
              continue
            if ('fieldRef' in field) {
              const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}|${field.fieldRef?.name ?? ''}`
              if (!key || !seenKeys.has(key)) {
                result[condName].push(field)
              }
            } else {
              result[condName].push(field)
            }
          }
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

export function extractCharConditionalDescriptions(
  characterKey: CharacterKey
): Record<string, ReactNode> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<string, ReactNode> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional?.description) {
        const condName = doc.conditional.metadata.name
        const desc = doc.conditional.description
        if (typeof desc === 'function') return
        if (result[condName]) {
          result[condName] = `${result[condName]}\n\n${desc}`
        } else {
          result[condName] = desc
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

export function extractCharConditionalLabels(
  characterKey: CharacterKey
): Record<string, ReactNode> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<string, ReactNode> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional?.label) {
        const condName = doc.conditional.metadata.name
        const label = doc.conditional.label
        if (typeof label === 'function') return
        result[condName] = label
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

export function extractCharConditionalUiOptions(
  characterKey: CharacterKey
):
  | Record<
      string,
      { maxByMindscape?: Record<number, number>; noDimWhenZero?: boolean }
    >
  | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<
    string,
    { maxByMindscape?: Record<number, number>; noDimWhenZero?: boolean }
  > = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional) {
        const condName = doc.conditional.metadata.name
        const { maxByMindscape, noDimWhenZero } = doc.conditional
        if (maxByMindscape || noDimWhenZero) {
          result[condName] = {
            ...result[condName],
            ...(maxByMindscape ? { maxByMindscape } : {}),
            ...(noDimWhenZero ? { noDimWhenZero } : {}),
          }
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

export function extractCharPassiveFields(
  characterKey: CharacterKey,
  teammateKey: CharacterKey | undefined,
  potential: number
):
  | {
      fields: Field[]
      mindscape: number
      sectionKey: string
      paragraph?: number
      descKey?: string
      groupTitle?: ReactNode
      description?: ReactNode
    }[]
  | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const charBuffs = (buffs as any)[characterKey] as
    | Record<string, { team?: boolean }>
    | undefined
  if (!charBuffs) return undefined
  const isTeammateView = !!teammateKey
  const result: {
    fields: Field[]
    mindscape: number
    sectionKey: string
    paragraph?: number
    descKey?: string
    groupTitle?: ReactNode
    description?: ReactNode
  }[] = []
  Object.entries(sheet).forEach(([sectionKey, section]) => {
    const mindscape = sectionKey.startsWith('m')
      ? Number(sectionKey.slice(1)) || 0
      : 0
    let fieldsDocIndex = 0
    let abilityFieldsDocIndex = 0
    section.documents.forEach((doc) => {
      if (doc.type === 'fields' && (doc.fields?.length || doc.description)) {
        const groupedFields: Field[] = []
        for (const field of doc.fields) {
          if ('minPotential' in field && (field.minPotential ?? 0) > potential)
            continue
          if ('fieldRef' in field && field.fieldRef?.name) {
            const buffMeta = charBuffs[field.fieldRef.name]
            if (!buffMeta) continue
            if (
              isTeammateView &&
              (buffMeta.team === false ||
                (buffMeta.team !== true &&
                  !buffAppliesToMainUnit(field.fieldRef)))
            )
              continue
            groupedFields.push(field)
          } else if (
            !isTeammateView &&
            !('fieldRef' in field) &&
            'fieldValue' in field
          ) {
            groupedFields.push(field)
          }
        }
        if (groupedFields.length > 0 || (!isTeammateView && doc.description)) {
          const isAbility =
            groupedFields[0] &&
            'fieldRef' in groupedFields[0] &&
            groupedFields[0].fieldRef?.name?.startsWith('ability_')
          const autoParagraph = sectionKey.startsWith('m')
            ? undefined
            : isAbility
              ? abilityFieldsDocIndex + 1
              : fieldsDocIndex
          const paragraph =
            doc.type === 'fields' &&
            'paragraph' in doc &&
            doc.paragraph !== undefined
              ? doc.paragraph
              : autoParagraph
          result.push({
            fields: groupedFields,
            mindscape,
            sectionKey,
            paragraph,
            descKey:
              doc.type === 'fields' && 'descKey' in doc
                ? (doc as FieldsDocument).descKey
                : undefined,
            description: (doc as FieldsDocument).description,
            groupTitle:
              doc.type === 'fields' && 'header' in doc && doc.header
                ? doc.header.text
                : undefined,
          })
          if (isAbility) abilityFieldsDocIndex++
          else fieldsDocIndex++
        }
      }
    })
  })
  return result.length > 0 ? result : undefined
}
