import type { TagField } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import type { CharacterKey, DiscSetKey, WengineKey } from '../consts'
import type { Tag } from '../formula'
import { i18n, Translate } from '../i18n'
import { TagDisplay } from './components'
export const st = (
  strKey: string,
  values?: Record<string, string | number>
) => <Translate ns="sheet" key18={strKey} values={values} />
export const stg = (strKey: string) => (
  <Translate ns="characters_gen" key18={strKey} />
)

type Translated = [
  trg: (i18key: string, values?: Record<string, string | number>) => ReactNode,
  tr: (i18key: string, values?: Record<string, string | number>) => ReactNode,
]

export function trans(typeKey: 'char', key: CharacterKey): Translated
export function trans(typeKey: 'wengine', key: WengineKey): Translated
export function trans(typeKey: 'disc', key: DiscSetKey): Translated
export function trans(
  typeKey: 'char' | 'wengine' | 'disc',
  key: CharacterKey | WengineKey | DiscSetKey
): Translated {
  return [
    (strKey: string, values?: Record<string, string | number>) => (
      <Translate ns={`${typeKey}_${key}_gen`} key18={strKey} values={values} />
    ),
    (strKey: string, values?: Record<string, string | number>) => (
      <Translate ns={`${typeKey}_${key}`} key18={strKey} values={values} />
    ),
  ]
}

export function tagToTagField(tag: Tag): TagField {
  return {
    title: <TagDisplay tag={tag} />,
    fieldRef: tag,
  }
}

const formulaLabelMap: Record<string, string> = {
  standardDmgInst: 'Standard DMG',
  sheerDmgInst: 'Sheer DMG',
  anomalyDmgInst: 'Anomaly DMG',
  disorderDmgInst: 'Disorder DMG',
  abloomDmgInst: 'Abloom DMG',
  vortexDmgInst: 'Vortex DMG',
  anomalyBuildupInst: 'Anomaly Buildup',
  dazeInst: 'Daze',
}

export function getTagLabel(tag: Tag | undefined | null): string {
  if (!tag) return ''
  const { et, q, qt, name, damageType1, damageType2 } = tag
  if (et === 'own' && qt === 'formula' && q !== 'base') {
    if (name) {
      // Match formula names like 'vortexDmgInst_fire' → 'Vortex DMG',
      // 'disorderDmgInst_fire' → 'Disorder DMG'
      for (const [prefix, label] of Object.entries(formulaLabelMap)) {
        if (name === prefix || name.startsWith(`${prefix}_`)) {
          // If the label matches a damage type already shown via qualifiers,
          // return empty to avoid redundancy (e.g. "Fire Anomaly Vortex" + "Vortex DMG")
          const dmgType = prefix.replace(/DmgInst$/, '')
          if (damageType1 === dmgType || damageType2 === dmgType) return ''
          return label
        }
      }
    }
    // Match skill formula names like 'Ultimate100Energy_0_dmg'
    const skillMatch = name?.match(/^(.+)_(\d+)_(dmg|daze|anomBuildup)$/)
    if (skillMatch) {
      const abilityKey = skillMatch[1]
      const hitIdx = Number(skillMatch[2]) + 1
      const typeLabel =
        skillMatch[3] === 'dmg'
          ? 'DMG'
          : skillMatch[3] === 'daze'
            ? 'Daze'
            : 'Anom Buildup'
      const sheet = tag.sheet
      let displayName: string | undefined
      if (sheet) {
        for (const skill of [
          'basic',
          'dodge',
          'special',
          'chain',
          'assist',
        ] as const) {
          const key = `${skill}.${abilityKey}.name`
          const value = i18n.t(key, {
            ns: `char_${sheet}_gen`,
            defaultValue: '',
          })
          if (value && value !== key) {
            displayName = value
            break
          }
        }
      }
      return `${
        displayName ??
        abilityKey
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/([a-zA-Z])(\d)/g, '$1 $2')
          // Don't split ordinal suffixes like "1st" into "1 st"
          .replace(/(\d)(?!st|nd|rd|th)([a-zA-Z])/gi, '$1 $2')
      } #${hitIdx} ${typeLabel}`
    }
    return name ?? q ?? ''
  }
  // TODO: Determine when we should return qt + q vs just q
  // e.g. for qt: 'base', q: 'atk' we would want both
  return q ?? ''
}
