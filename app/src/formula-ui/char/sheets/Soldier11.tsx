import type { CharacterKey } from '../../../consts'
import { Soldier11 } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Soldier11'
const [, ch] = trans('char', key)
const cond = Soldier11.conditionals
const buff = Soldier11.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('core_common_dmg_'),
          fieldRef: buff.core_common_dmg_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      fields: [
        fieldForBuff(buff.ability_fire_dmg_),
        fieldForBuff(buff.ability_crit_dmg_),
      ],
    },
  ],
  potential: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.ability_crit_dmg_)],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description:
          'Grants stacks of bonus Common DMG and Dodge Counter DMG for each Fire Suppression triggered.',
        metadata: cond.m2_stacks,
        fields: [
          {
            title: ch('m2_common_dmg_'),
            fieldRef: buff.m2_common_dmg_.tag,
          },
          fieldForBuff(buff.m2_dodgeCounter_dmg_),
        ],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description:
          'Reduces incoming DMG when Fire Suppression is triggered during the first three hits of a Basic Attack or Dash Attack.',
        metadata: cond.fireSuppression_triggered,
        fields: [fieldForBuff(buff.m4_dmg_red_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond2'),
        description:
          'Triggers additional effects when Fire Suppression is activated during the fourth hit of a Basic Attack.',
        metadata: cond.fireSuppression_4th_hit,
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.3', {
          val1: '$t(skills.exSpecial)',
          val2: '$t(skills.chain)',
          val3: '$t(skills.ult)',
        }),
        description:
          "Ignores a portion of the enemy's Fire RES after consuming a charge with an EX Special Attack, Chain Attack, or Ultimate.",
        metadata: cond.charge_consumed,
        fields: [
          {
            title: ch('m6_fire_resIgn_'),
            fieldRef: buff.m6_fire_resIgn_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
