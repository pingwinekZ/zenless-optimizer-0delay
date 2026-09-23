import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { ColorText, TagPill } from '@zenless-optimizer/common/ui'
import { evalIfFunc, getUnitStr } from '@zenless-optimizer/common/util'
import type { Calculator as GameOptCalculator } from '@zenless-optimizer/game-opt/engine'
import type { StatKey } from '@zenless-optimizer/zzz/consts'
import { elementalData, statKeyTextMap } from '@zenless-optimizer/zzz/consts'
import { Read, type Tag } from '@zenless-optimizer/zzz/formula'
import { StatIcon } from '@zenless-optimizer/zzz/svgicons'
import { AttributeName, StatDisplay } from '@zenless-optimizer/zzz/ui'
import {
  condMap,
  damageTypeKeysMap,
  getDmgType,
  getVariant,
  tagFieldMap,
} from '../char'
import { damageTypeColor } from '../damageTypeColors'
import { useZzzCalcContext } from '../hooks'
import { getTagLabel } from '../util'
import { qtMap } from './qtMap'
export function TagDisplay({
  tag,
  showPercent,
  preventRecursion,
}: {
  tag: Tag
  showPercent?: boolean
  preventRecursion?: boolean
}) {
  return (
    <ColorText color={getVariant(tag)}>
      <TagStrDisplay
        tag={tag}
        showPercent={showPercent}
        preventRecursion={preventRecursion}
      />
    </ColorText>
  )
}
export function FullTagDisplay({
  tag,
  showPercent,
}: {
  tag: Tag
  showPercent?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      <TagDisplay tag={tag} showPercent={showPercent} />
      {/* Show DMG type */}
      {getDmgType(tag).map((dmgType) => (
        <TagPill key={dmgType} color={damageTypeColor(dmgType)}>
          {damageTypeKeysMap[dmgType]}
        </TagPill>
      ))}
      {/* Show Attribute */}
      {tag.attribute && (
        <TagPill color={tag.attribute}>
          {<AttributeName attribute={tag.attribute} />}
        </TagPill>
      )}
    </span>
  )
}
const extraHandlingStats = ['hp', 'hp_', 'atk', 'atk_', 'def', 'def_'] as const
const isExtraHandlingStats = (
  stat: string
): stat is (typeof extraHandlingStats)[number] =>
  extraHandlingStats.includes(
    stat as 'hp' | 'hp_' | 'atk' | 'atk_' | 'def' | 'def_'
  )
const labelMap = {
  // TODO: translation
  dmg_: 'DMG',
  common_dmg_: 'DMG',
  defIgn_: 'DEF Ignore',
  resIgn_: 'Res Ignore',
  dazeInc_: 'Daze',
  buff_: 'DMG',
  sheer_dmg_: 'Sheer DMG',
} as const

function TagStrDisplay({
  tag,
  showPercent,
  preventRecursion,
}: {
  tag: Tag
  showPercent?: boolean
  preventRecursion?: boolean
}) {
  const calc = useZzzCalcContext()
  const title = tagFieldMap.subset(tag)[0]?.title
  if (title && !preventRecursion) return title
  // Conditional label handling
  if (tag.qt === 'cond' && tag.q && tag.sheet && calc) {
    const cond = condMap.get(`${tag.sheet}:${tag.q}`)
    if (cond)
      return evalIfFunc(
        cond.label,
        calc as GameOptCalculator,
        calc?.compute(new Read(tag, 'max')).val
      )
  }
  const label = getTagLabel(tag)

  if (isExtraHandlingStats(label))
    return (
      <span>
        <StatIcon statKey={label} iconProps={iconInlineProps} />{' '}
        <span>
          {(tag.qt && qtMap[tag.qt as keyof typeof qtMap]) ?? tag.qt}{' '}
          {statKeyTextMap[label]}
          {showPercent && getUnitStr(label)}
          {/* {tag.sheet && tag.sheet !== 'agg' ? ` (${tag.sheet})` : ''} */}
        </span>
      </span>
    )
  const specificDmgType1 = tag.damageType1 ?? undefined
  const specificDmgType2 = tag.damageType2 ?? undefined
  // `sharpDmgInst` is already badged as Sharp by `FullTagDisplay`, so the
  // qualifier is dropped here and the aggregate reads "Electric Damage".
  const skipDmgTypeQualifier =
    tag.qt === 'formula' && tag.name === 'sharpDmgInst'
  const hasDmgTypeQualifier =
    (!skipDmgTypeQualifier && (specificDmgType1 || specificDmgType2)) ||
    tag.attribute
  if (labelMap[label as keyof typeof labelMap] || hasDmgTypeQualifier) {
    const name =
      labelMap[label as keyof typeof labelMap] ??
      statKeyTextMap[label as StatKey] ??
      label
    const attrName = tag.name?.includes('_frost')
      ? 'Frost'
      : elementalData[tag.attribute as keyof typeof elementalData]
    const strs = [
      ...(tag.attribute ? [attrName] : []),
      ...(specificDmgType1 && !skipDmgTypeQualifier
        ? [damageTypeKeysMap[specificDmgType1]]
        : []),
      ...(specificDmgType2 && !skipDmgTypeQualifier
        ? [damageTypeKeysMap[specificDmgType2]]
        : []),
      ...(name ? [name] : []),
    ]
    return <span>{strs.join(' ')}</span>
  }
  return <StatDisplay statKey={label as StatKey} showPercent={showPercent} />
}
