import { ColorText, TagPill } from '@zenless-optimizer/common/ui'
import type { DamageType, Tag } from '@zenless-optimizer/zzz/formula'
import {
  damageTypeColor,
  damageTypeKeysMap,
  getDmgType,
  getVariant,
  TagDisplay,
  tagFieldMap,
} from '@zenless-optimizer/zzz/formula-ui'
import { i18n } from '@zenless-optimizer/zzz/i18n'
import { AttributeName } from '@zenless-optimizer/zzz/ui'
import { isValidElement, type ReactNode } from 'react'

// Page-optimize-only display: strip the redundant leading skill-type prefix
// ("Special Attack: ...", "EXSpecial Attack ...", "Basic Attack ...") since
// the DMG-type tag pill already shows it (e.g. "Special"). Falls back to the
// plain `TagDisplay` for non-skill-formula tags so stat targets keep their
// icons. Passing `onDamageTypeClick` turns the damage-type pills into filter
// toggles, matching hsr-optimizer's buff-summary tags.

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

/**
 * Custom damage-instance target (e.g. Yixuan's Lightning Strikes, Seed's
 * Additional Laser): a named formula that is neither a skill-variant hit nor
 * a shared *Inst aggregate.
 */
export function isCustomInstanceTag(tag: Tag): boolean {
  if (tag.qt !== 'formula' || typeof tag.name !== 'string') return false
  if (parseSkillVariant(tag)) return false
  if (/(DmgInst|BuildupInst|dazeInst)$/.test(tag.name)) return false
  return true
}

/**
 * Page-optimize-only display: custom damage-instance targets (e.g. Yixuan's
 * Lightning Strikes) reuse their sheet field titles, which carry a " DMG"
 * affix for the character sheet. The opt-target list reads cleaner without
 * it. Returns undefined when there is no sheet title to shorten so callers
 * fall back to the plain `TagDisplay`.
 */
function customInstanceTitle(tag: Tag): string | undefined {
  if (!isCustomInstanceTag(tag)) return undefined
  const title = tagFieldMap.subset(tag)[0]?.title
  const text = titleText(title)
  return text?.replace(/\s+DMG$/, '')
}

/**
 * Best-effort plain text of a sheet field title. Sheet titles are often
 * `<Translate ns key18 />` elements (from `ch()`), which resolve through
 * `i18n.t` using the element's own props.
 */
function titleText(title: ReactNode): string | undefined {
  if (typeof title === 'string') return title
  if (typeof title === 'number') return String(title)
  if (Array.isArray(title)) {
    const parts = title.map(titleText)
    return parts.every((p) => p !== undefined) ? parts.join('') : undefined
  }
  if (
    isValidElement<{
      children?: ReactNode
      ns?: unknown
      key18?: unknown
      values?: Record<string, string | number>
    }>(title)
  ) {
    const { children, ns, key18, values } = title.props
    if (typeof ns === 'string' && typeof key18 === 'string') {
      const resolved = i18n.t(key18, { ns, ...(values ?? {}) })
      if (typeof resolved === 'string' && resolved !== key18) return resolved
      return undefined
    }
    return titleText(children)
  }
  return undefined
}

export function OptTargetTagDisplay({
  tag,
  activeDamageType,
  onDamageTypeClick,
  withBadges = true,
}: {
  tag: Tag
  /** Selected damage-type filter, marking pills `active` / `dimmed`. */
  activeDamageType?: string | null
  /** Makes each damage-type pill a filter toggle. */
  onDamageTypeClick?: (damageType: DamageType) => void
  /** Hide the damage-type / attribute pills, showing the name alone. */
  withBadges?: boolean
}) {
  const parsed = parseSkillVariant(tag)
  const badges = skillBadges(tag)
  const base = parsed && badges.length > 0 ? skillVariantBase(tag) : undefined
  const customTitle = !base ? customInstanceTitle(tag) : undefined

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      {base && parsed ? (
        <ColorText color={getVariant(tag)}>
          <span>
            {base} {variantTypeLabel(parsed.kind)}
          </span>
        </ColorText>
      ) : customTitle ? (
        <ColorText color={getVariant(tag)}>
          <span>{customTitle}</span>
        </ColorText>
      ) : (
        <TagDisplay tag={tag} />
      )}
      {withBadges &&
        badges.map((dmgType) => (
          <TagPill
            key={dmgType}
            color={damageTypeColor(dmgType)}
            active={activeDamageType === dmgType}
            dimmed={!!activeDamageType && activeDamageType !== dmgType}
            onClick={
              onDamageTypeClick ? () => onDamageTypeClick(dmgType) : undefined
            }
          >
            {damageTypeKeysMap[dmgType]}
          </TagPill>
        ))}
      {withBadges && tag.attribute && (
        <TagPill color={tag.attribute}>
          {<AttributeName attribute={tag.attribute} />}
        </TagPill>
      )}
    </span>
  )
}
