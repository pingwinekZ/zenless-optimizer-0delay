import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Soldier0Anby } from '../../../formula'
import { st, trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Soldier0Anby'
const [, ch] = trans('char', key)
const cond = Soldier0Anby.conditionals
const buff = Soldier0Anby.buffs
const formula = Soldier0Anby.formulas

const sheet = createBaseSheet(key, {
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      fields: [fieldForBuff(buff.ability_aftershock_dmg_)],
    },
  ],
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.markedWithSilverStar,
        fields: [
          fieldForBuff(buff.core_common_dmg_),
          fieldForBuff(buff.core_markedWithSilverStar_crit_dmg_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [
        fieldForBuff(buff.ability_crit_),
        fieldForBuff(buff.ability_aftershock_dmg_),
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
            <ColorText color={getVariant(buff.m2_crit_.tag)}>
              {ch('m2_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m2_crit_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_electric_resIgn_.tag)}>
              {ch('m4_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m4_electric_resIgn_.tag,
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
            <ColorText color={getVariant(formula.m6_additional_dmg.tag)}>
              {st('dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
