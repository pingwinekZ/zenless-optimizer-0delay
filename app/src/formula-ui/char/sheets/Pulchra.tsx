import type { CharacterKey } from '../../../consts'
import { Pulchra } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Pulchra'
const [, ch] = trans('char', key)
const cond = Pulchra.conditionals
const buff = Pulchra.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: "Increases Daze inflicted while in Hunter's Gait state.",
        metadata: cond.hunters_gait,
        fields: [fieldForBuff(buff.core_dazeInc_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'Increases Aftershock damage against enemies affected by Binding Trap.',
        metadata: cond.binding_trap,
        fields: [fieldForBuff(buff.ability_aftershock_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'Increases CRIT Rate against enemies affected by Binding Trap.',
        metadata: cond.binding_trap,
        fields: [fieldForBuff(buff.m1_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: "Increases ATK while in Hunter's Gait state.",
        metadata: cond.hunters_gait,
        fields: [fieldForBuff(buff.m2_atk_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m6_special_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'Increases damage against enemies affected by Binding Trap.',
        metadata: cond.binding_trap,
        fields: [fieldForBuff(buff.m6_common_dmg_)],
      },
    },
  ],
})

export default sheet
