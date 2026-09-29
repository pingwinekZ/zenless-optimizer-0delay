import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { YeShunguang } from '@zenless-optimizer/zzz/formula'
import { GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'YeShunguang'
const [, ch] = trans('char', key)
const buff = YeShunguang.buffs
const formula = YeShunguang.formulas

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={1} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns="char_YeShunguang_gen"
          key18="mindscapes.1.desc.1"
          from="The <ct color=#FFFFFF>Unity</ct> effect"
          to="an additional 10%"
          toExact
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('core_header') },
      description: <CoreDescription />,
      fields: [
        fieldForBuff(buff.core_crit_),
        fieldForBuff(buff.core_common_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: ch('m1_defIgn_desc'),
      fields: [fieldForBuff(buff.m1_defIgn_)],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_YeShunguang_gen"
          key18="mindscapes.2.desc"
          from="EX Special Attack: Enlightened Mind - Soaring Light"
          to="target's DEF"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_exSpecial_defIgn_.tag)}>
              {ch('m2_exSpecial_defIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m2_exSpecial_defIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_ult_defIgn_.tag)}>
              {ch('m2_ult_defIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m2_ult_defIgn_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_YeShunguang_gen"
          key18="mindscapes.6.desc"
          from="The last hit of"
          to="Physical DMG"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
