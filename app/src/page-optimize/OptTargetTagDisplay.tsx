import { ColorText, SqBadge } from '@zenless-optimizer/common/ui'
import type { DamageType, Tag } from '../formula'
import {
  damageTypeKeysMap,
  FullTagDisplay,
  getDmgType,
  getVariant,
} from '../formula-ui'
import { i18n } from '../i18n'
import { AttributeName } from '../ui'

// Page-optimize-only display: strip the redundant leading skill-type prefix
// ("Special Attack: ...", "EXSpecial Attack ...", "Basic Attack ...") since
// the DMG-type SqBadge already shows it (e.g. "Special"). Falls back to
// FullTagDisplay for non-skill-formula tags so stat targets keep their icons.

const skillPrefixRe =
  /^(E\s*X\s*Special Attack|Special Attack|Basic Attack|Chain Attack|Ultimate|Dodge Counter|Dash Attack|Quick Assist|Defensive Assist|Evasive Assist|Assist Follow[-\s]?Up|Counter Assist)\s*:?\s*/i

const skillVariantRe = /^(.+)_(\d+)_(dmg|daze|anomBuildup|gashBuildup)$/

export type SkillVariantKind = 'dmg' | 'daze' | 'anomBuildup' | 'gashBuildup'

export function parseSkillVariant(tag: Tag):
  | {
      abilityKey: string
      hitIdx: number
      kind: SkillVariantKind
    }
  | undefined {
  if (tag.qt !== 'formula' || typeof tag.name !== 'string') return undefined
  const match = tag.name.match(skillVariantRe)
  if (!match) return undefined
  return {
    abilityKey: match[1],
    hitIdx: Number(match[2]),
    kind: match[3] as SkillVariantKind,
  }
}

export function variantTypeLabel(kind: SkillVariantKind): string {
  switch (kind) {
    case 'dmg':
      return 'DMG'
    case 'daze':
      return 'Daze'
    case 'anomBuildup':
      return 'Anomaly Buildup'
    case 'gashBuildup':
      return 'Gash Buildup'
  }
}

function abilityDisplayName(
  sheet: string | undefined,
  abilityKey: string
): string {
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
      if (value && value !== key) return value
    }
  }
  // Fallback: split camelCase (mirrors getTagLabel), with an extra fix for
  // the all-caps EX prefix ("EXSpecialAttack..." has no lower→Upper boundary
  // after EX, so it would otherwise render as "EXSpecial Attack ...").
  return abilityKey
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)(?!st|nd|rd|th)([a-zA-Z])/gi, '$1 $2')
    .replace(/^EXSpecial(?=\s)/, 'EX Special')
}

/** Stripped "{attack name} #{hit}" without skill-type prefix or DMG/Daze/Buildup suffix. */
export function skillVariantBase(tag: Tag): string | undefined {
  const parsed = parseSkillVariant(tag)
  if (!parsed) return undefined
  const name = abilityDisplayName(
    typeof tag.sheet === 'string' ? tag.sheet : undefined,
    parsed.abilityKey
  ).replace(skillPrefixRe, '')
  return `${name} #${parsed.hitIdx + 1}`
}

/** Badges for skill variants, falling back to raw damageType fields so Daze/Buildup keep their badge. */
export function skillBadges(tag: Tag): DamageType[] {
  const dmgTypes = getDmgType(tag)
  if (dmgTypes.length > 0) return dmgTypes
  const { damageType1, damageType2 } = tag as {
    damageType1?: DamageType
    damageType2?: DamageType
  }
  return [damageType1, damageType2].filter(
    (d): d is DamageType => !!d && d in damageTypeKeysMap
  )
}

export function OptTargetTagDisplay({ tag }: { tag: Tag }) {
  const parsed = parseSkillVariant(tag)
  const badges = skillBadges(tag)
  if (!parsed || badges.length === 0) return <FullTagDisplay tag={tag} />
  const base = skillVariantBase(tag)
  if (!base) return <FullTagDisplay tag={tag} />
  return (
    <>
      <ColorText color={getVariant(tag)}>
        <span>
          {base} {variantTypeLabel(parsed.kind)}
        </span>
      </ColorText>
      {badges.map((dmgType) => (
        <SqBadge key={dmgType}>{damageTypeKeysMap[dmgType]}</SqBadge>
      ))}
      {tag.attribute && (
        <SqBadge color={tag.attribute}>
          {<AttributeName attribute={tag.attribute} />}
        </SqBadge>
      )}
    </>
  )
}
