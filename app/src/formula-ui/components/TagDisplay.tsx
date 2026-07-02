import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { ColorText, SqBadge } from '@zenless-optimizer/common/ui'
import { evalIfFunc, getUnitStr } from '@zenless-optimizer/common/util'
import type { Calculator as GameOptCalculator } from '@zenless-optimizer/game-opt/engine'
import type { StatKey } from '../../consts'
import { elementalData, statKeyTextMap } from '../../consts'
import { Read, type Tag } from '../../formula'
import { StatIcon } from '../../svgicons'
import { AttributeName, StatDisplay } from '../../ui'
import {
  condMap,
  damageTypeKeysMap,
  getDmgType,
  getVariant,
  tagFieldMap,
} from '../char'
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
    <>
      <TagDisplay tag={tag} showPercent={showPercent} />
      {/* Show DMG type */}
      {getDmgType(tag).map((dmgType) => (
        <SqBadge key={dmgType}>{damageTypeKeysMap[dmgType]}</SqBadge>
      ))}
      {/* Show Attribute */}
      {tag.attribute && (
        <SqBadge color={tag.attribute}>
          {<AttributeName attribute={tag.attribute} />}
        </SqBadge>
      )}
    </>
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
  buff_: 'Buff Bonus',
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
  const hasDmgTypeQualifier =
    specificDmgType1 || specificDmgType2 || tag.attribute
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
      ...(specificDmgType1 ? [damageTypeKeysMap[specificDmgType1]] : []),
      ...(specificDmgType2 ? [damageTypeKeysMap[specificDmgType2]] : []),
      ...(name ? [name] : []),
    ]
    return <span>{strs.join(' ')}</span>
  }
  return <StatDisplay statKey={label as StatKey} showPercent={showPercent} />
}
