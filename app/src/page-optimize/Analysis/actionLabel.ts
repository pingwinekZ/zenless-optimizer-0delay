import type { Tag } from '@zenless-optimizer/zzz/formula'
import { getTagLabel } from '@zenless-optimizer/zzz/formula-ui'
import { i18n } from '@zenless-optimizer/zzz/i18n'
import {
  parseSkillVariant,
  skillVariantBase,
  variantTypeLabel,
} from '../OptTargetTagDisplay'

/**
 * Plain-text label for a target/action tag, mirroring what
 * `OptTargetTagDisplay` renders.
 *
 * Order matters: skill variants resolve through the character's localized
 * ability names, then sheet-authored formula titles (`char_<sheet>` keys, e.g.
 * `luminizeRainbowsEndDmgInst` → "Rainbow's End Luminize"), then the shared
 * formula/damage-type labels, and only then the raw tag fields.
 */
export function optTargetLabel(tag: Tag): string {
  const parsed = parseSkillVariant(tag)
  const base = parsed ? skillVariantBase(tag) : undefined
  if (parsed && base) return `${base} ${variantTypeLabel(parsed.kind)}`

  const { sheet, name } = tag
  if (typeof sheet === 'string' && typeof name === 'string') {
    const title = i18n.t(name, { ns: `char_${sheet}`, defaultValue: '' })
    if (title && title !== name) return title
  }

  // `includeDamageType` keeps labels like `anomalyDmgInst` → "Anomaly DMG"
  // instead of losing them to the badge-based display and falling back to the
  // raw `sheet.name` below.
  return (
    getTagLabel(tag, { includeDamageType: true }) ||
    [sheet, name].filter(Boolean).join('.') ||
    'Target'
  )
}
