import { ColorText } from '@zenless-optimizer/common/ui'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import { getVariant, TagDisplay } from '@zenless-optimizer/zzz/formula-ui'
import { parseSkillVariant, skillVariantBase } from '../OptTargetTagDisplay'

/**
 * Attack name for combo hit pickers, mirroring `OptTargetTagDisplay` without
 * the damage-type / attribute pills: localized skill name + hit index with
 * variant coloring, falling back to the localized `TagDisplay` for
 * non-skill formulas.
 */
export function ComboHitDisplay({ tag }: { tag: Tag }) {
  const parsed = parseSkillVariant(tag)
  const base = parsed ? skillVariantBase(tag) : undefined
  if (parsed && base) {
    return (
      <ColorText color={getVariant(tag)}>
        <span>{base}</span>
      </ColorText>
    )
  }
  return <TagDisplay tag={tag} />
}
