import type { CharacterKey } from '../../../consts'
import { Billy } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Billy'
const [, ch] = trans('char', key)
const cond = Billy.conditionals
const buff = Billy.buffs

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
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.chain)' }),
        description:
          'Upon launching a Chain Attack, Billy gains increased Ultimate DMG.',
        metadata: cond.ult_dmg_stacks,
        fields: [fieldForBuff(buff.ability_ult_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m2_dodgeCounter_dmg_)],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description:
          'When at a distance from the target, Billy gains increased EX Special Attack CRIT Rate.',
        metadata: cond.distance,
        fields: [fieldForBuff(buff.m4_exSpecial_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          'When Billy accumulates hits or triggers a Perfect Dodge, he gains increased crouching shot DMG.',
        metadata: cond.m6_stacks,
        fields: [fieldForBuff(buff.m6_common_dmg_)],
      },
    },
  ],
})

export default sheet
