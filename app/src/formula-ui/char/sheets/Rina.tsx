import type { CharacterKey } from '../../../consts'
import { Rina } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Rina'
const [, ch] = trans('char', key)
const cond = Rina.conditionals
const buff = Rina.buffs
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          "The entire squad gains bonus PEN Ratio while Rina's minions are on the field.",
        metadata: cond.minions_onField,
        fields: [fieldForBuff(buff.core_pen_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          "Increases the squad's Electric DMG while a Shocked enemy is on the field.",
        metadata: cond.shocked_enemy,
        fields: [fieldForBuff(buff.ability_electric_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          'Increases the Core PEN Ratio bonus when the squad member is within 10 meters of Rina.',
        metadata: cond.within_10m,
        fields: [
          {
            title: ch('m1_buff_'),
            fieldValue: dm.m1.core_buff_ * 100,
            unit: '%',
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: st('enterCombatOrSwitchIn'),
        description:
          'Grants bonus Common DMG upon entering combat or switching in.',
        metadata: cond.active_char,
        fields: [fieldForBuff(buff.m2_common_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          "Rina's Energy Regen increases while her minions are on the field.",
        metadata: cond.minions_onField,
        fields: [fieldForBuff(buff.m4_enerRegen)],
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
          "Increases the squad's Electric DMG after hitting an enemy with an EX Special Attack, Chain Attack, or Ultimate.",
        metadata: cond.exSpecial_chain_ult_hit,
        fields: [fieldForBuff(buff.m6_electric_dmg_)],
      },
    },
  ],
})

export default sheet
