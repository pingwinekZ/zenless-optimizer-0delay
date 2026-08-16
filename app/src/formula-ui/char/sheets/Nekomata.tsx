import type { CharacterKey } from '../../../consts'
import { Nekomata } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Nekomata'
const [, ch] = trans('char', key)
const cond = Nekomata.conditionals
const buff = Nekomata.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          "Increases Nekomata's damage after a Dodge Counter or Quick Assist hits an enemy.",
        metadata: cond.dodgeCounter_quickAssist_hit,
        fields: [fieldForBuff(buff.core_common_dmg_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'Increases EX Special Attack damage after any squad member inflicts Assault.',
        metadata: cond.assaults_inflicted,
        fields: [fieldForBuff(buff.ability_exSpecial_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          "Nekomata ignores a portion of the target's Physical RES when attacking from behind.",
        metadata: cond.from_behind,
        fields: [fieldForBuff(buff.m1_physical_resIgn_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description:
          'Increases Energy Regen when Nekomata faces only one enemy on the field.',
        metadata: cond.one_enemy_onField,
        fields: [fieldForBuff(buff.m2_enerRegen_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.exSpecial)' }),
        description: 'Increases CRIT Rate after using an EX Special Attack.',
        metadata: cond.exSpecials_used,
        fields: [fieldForBuff(buff.m4_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.2', {
          val1: '$t(skills.chain)',
          val2: '$t(skills.ult)',
        }),
        description:
          'Increases CRIT DMG after using a Chain Attack or Ultimate.',
        metadata: cond.chain_ult_used,
        fields: [fieldForBuff(buff.m6_crit_dmg_)],
      },
    },
  ],
})

export default sheet
