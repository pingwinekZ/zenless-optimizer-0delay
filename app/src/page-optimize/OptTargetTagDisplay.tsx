import { ColorText, SqBadge } from '@zenless-optimizer/common/ui'
import type { Tag } from '../formula'
import {
  damageTypeKeysMap,
  FullTagDisplay,
  getDmgType,
  getVariant,
} from '../formula-ui'
import { getTagLabel } from '../formula-ui/util'
import { AttributeName } from '../ui'

// Page-optimize-only display: strip the redundant leading skill-type prefix
// ("Special Attack: ...", "EXSpecial Attack ...", "Basic Attack ...") since
// the DMG-type SqBadge already shows it (e.g. "Special"). Falls back to
// FullTagDisplay for non-skill-formula tags so stat targets keep their icons.
const skillPrefixRe =
  /^(E\s*X\s*Special Attack|Special Attack|Basic Attack|Chain Attack|Ultimate|Dodge Counter|Dash Attack|Quick Assist|Defensive Assist|Evasive Assist|Assist Follow[-\s]?Up|Counter Assist)\s*:?\s*/i

export function OptTargetTagDisplay({ tag }: { tag: Tag }) {
  const dmgTypes = getDmgType(tag)
  const isSkillFormula =
    tag.qt === 'formula' &&
    typeof tag.name === 'string' &&
    /^(.+)_(\d+)_(dmg|daze|anomBuildup)$/.test(tag.name)
  if (!isSkillFormula || dmgTypes.length === 0)
    return <FullTagDisplay tag={tag} />
  const label = getTagLabel(tag).replace(skillPrefixRe, '')
  return (
    <>
      <ColorText color={getVariant(tag)}>
        <span>{label}</span>
      </ColorText>
      {dmgTypes.map((dmgType) => (
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
