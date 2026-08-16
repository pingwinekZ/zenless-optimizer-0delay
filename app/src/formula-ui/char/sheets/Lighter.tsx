import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Lighter } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Lighter'
const [, ch] = trans('char', key)
const cond = Lighter.conditionals
const buff = Lighter.buffs
const formula = Lighter.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('core_header') },
      conditional: {
        label: ch('morale_consumedCond'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.morale_consumed,
        fields: [fieldForBuff(buff.core_impact_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('morale_burst_hitCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.morale_burst_hit,
        fields: [
          fieldForBuff(buff.core_ice_resRed_),
          fieldForBuff(buff.core_fire_resRed_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('ability_header') },
      conditional: {
        label: ch('elationCond'),
        description: <GameDesc ns="char_Lighter_gen" key18="ability.desc" />,
        metadata: cond.elation,
        fields: [
          fieldForBuff(buff.ability_ice_dmg_),
          fieldForBuff(buff.ability_fire_dmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m1_header') },
      conditional: {
        label: ch('m1CollapseCond'),
        description: (
          <GameDesc ns="char_Lighter_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.m1_collapse,
        linked: ['m2_collapse'],
        fields: [
          fieldForBuff(buff.m1_ice_resRed_),
          fieldForBuff(buff.m1_fire_resRed_),
        ],
      },
    },
    {
      type: 'fields',
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_finishing_move_dmg_.tag)}>
              {ch('m1_finishing_move_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m1_finishing_move_dmg_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m2_header') },
      conditional: {
        label: ch('m2CollapseCond'),
        description: (
          <GameDesc ns="char_Lighter_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.m2_collapse,
        linked: ['m1_collapse'],
        fields: [fieldForBuff(buff.m2_stun_)],
      },
    },
    {
      type: 'fields',
      fields: [
        {
          title: ch('m2_elation_inc_'),
          fieldValue: dm.m2.ability_buff_inc_ * 100,
          unit: '%',
        },
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_enerRegen_)],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_blazing_impact_dmg.tag)}>
              {ch('m6_blazing_impact_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_blazing_impact_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
