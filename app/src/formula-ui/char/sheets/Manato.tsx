import type { CharacterKey } from '../../../consts'
import { Manato } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Manato'
const [, ch] = trans('char', key)
const cond = Manato.conditionals
const buff = Manato.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond.consumingHp'),
        description:
          'Increases Basic Attack and Assist Follow-Up CRIT DMG when consuming HP.',
        metadata: cond.consumingHp_consecutiveStrikes,
        fields: [
          fieldForBuff(buff.core_basic_crit_dmg_),
          fieldForBuff(buff.core_assistFollowUp_crit_dmg_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond.moltenEdge'),
        description:
          'Increases CRIT Rate and Fire DMG while in the Molten Edge state.',
        metadata: cond.moltenEdge,
        fields: [
          fieldForBuff(buff.core_crit_),
          fieldForBuff(buff.core_fire_dmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          'Increases Basic Attack and Assist Follow-Up Fire DMG based on HP consumed.',
        metadata: cond.hpTallied,
        fields: [
          fieldForBuff(buff.m1_assistFollowUp_fire_dmg_),
          fieldForBuff(buff.m1_basic_fire_dmg_),
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond.moltenEdge'),
        description: 'Ignores enemy Fire RES while in the Molten Edge state.',
        metadata: cond.moltenEdge,
        fields: [fieldForBuff(buff.m2_fire_resIgn_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m4_hp_)],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponHit.1', { val1: '$t(skills.assistFollowUp)' }),
        description:
          'Increases Fire DMG when an Assist Follow-Up hits an enemy.',
        metadata: cond.assistFollowUpHitsEnemy,
        fields: [fieldForBuff(buff.m6_fire_dmg_)],
      },
    },
  ],
})

export default sheet
