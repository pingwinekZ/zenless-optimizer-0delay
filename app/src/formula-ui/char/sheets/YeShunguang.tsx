import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { YeShunguang } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'YeShunguang'
const [, ch] = trans('char', key)
const buff = YeShunguang.buffs
const formula = YeShunguang.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('core_header') },
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
      fields: [
        fieldForBuff(buff.m1_common_dmg_),
        fieldForBuff(buff.m1_defIgn_),
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
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
