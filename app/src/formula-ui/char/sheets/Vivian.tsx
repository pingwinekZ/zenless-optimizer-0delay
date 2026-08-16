import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Vivian } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Vivian'
const [, ch] = trans('char', key)
const cond = Vivian.conditionals
const buff = Vivian.buffs
const formula = Vivian.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      paragraph: 0,
      header: { icon: null, text: ch('coreAbloom') },
      fields: [
        fieldForBuff(buff.core_ether_anom_mv_mult_),
        fieldForBuff(buff.core_electric_anom_mv_mult_),
        fieldForBuff(buff.core_fire_anom_mv_mult_),
        fieldForBuff(buff.core_physical_anom_mv_mult_),
        fieldForBuff(buff.core_ice_anom_mv_mult_),
      ],
    },
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_prophecy_dmg.tag)}>
              {ch('core_prophecy_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_prophecy_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      paragraph: 2,
      header: { icon: null, text: ch('ability_header') },
      fields: [
        fieldForBuff(buff.ability_corruption_dmg_),
        fieldForBuff(buff.ability_corruption_disorder_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('prophecyCond'),
        description: (
          <GameDesc ns="char_Vivian_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.prophecy,
        fields: [
          fieldForBuff(buff.m1_anomaly_dmg_),
          fieldForBuff(buff.m1_disorder_dmg_),
        ],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [fieldForBuff(buff.m2_resIgn_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_suspension_crit_.tag)}>
              {ch('m4_suspension_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m4_suspension_crit_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_featherbloom_crit_.tag)}>
              {ch('m4_featherbloom_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m4_featherbloom_crit_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDesc ns="char_Vivian_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.fluttering_featherbloom_used,
        fields: [fieldForBuff(buff.m4_atk_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_ether_dmg_.tag)}>
              {ch('m6_ether_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_ether_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
