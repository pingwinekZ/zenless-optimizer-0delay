import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Trigger } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Trigger'
const [, ch] = trans('char', key)
const cond = Trigger.conditionals
const buff = Trigger.buffs
const formula = Trigger.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.aftershock_hit,
        fields: [fieldForBuff(buff.core_stun_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_aftershock_dazeInc_.tag)}>
              {ch('ability_aftershock_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.ability_aftershock_dazeInc_.tag,
        },
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_stun_.tag)}>
              {ch('m1_stun_')}
            </ColorText>
          ),
          fieldRef: buff.m1_stun_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Trigger_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.hunters_gaze,
        fields: [fieldForBuff(buff.m2_crit_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m4_disconnect_dmg.tag)}>
              {ch('m4_disconnect_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m4_disconnect_dmg.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.m4_disconnect_daze.tag)}>
              {ch('m4_disconnect_daze')}
            </ColorText>
          ),
          fieldRef: formula.m4_disconnect_daze.tag,
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
            <ColorText
              color={getVariant(formula.m6_armor_break_rounds_dmg.tag)}
            >
              {ch('m6_armor_break_rounds_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_armor_break_rounds_dmg.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_armor_break_rounds_dmg_.tag)}>
              {ch('m6_armor_break_rounds_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_armor_break_rounds_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
