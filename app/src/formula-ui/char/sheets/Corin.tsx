import type { CharacterKey } from '../../../consts'
import { Corin } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Corin'
const [, ch] = trans('char', key)
const cond = Corin.conditionals
const buff = Corin.buffs
const formula = Corin.formulas

const sheet = createBaseSheet(key, {
  // TODO: Add missing text for some hits
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
      fields: [fieldForBuff(buff.ability_common_dmg_)],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponHit.2', {
          val1: '$t(skills.chain)',
          val2: '$t(skills.ult)',
        }),
        description:
          'Increases Corin DMG after hitting an enemy with Chain Attack or Ultimate.',
        metadata: cond.chain_ult_hit,
        fields: [fieldForBuff(buff.m1_common_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponHit.3', {
          val1: '$t(skills.exSpecial)',
          val2: '$t(skills.chain)',
          val3: '$t(skills.ult)',
        }),
        description:
          'Reduces enemy Physical RES after hitting with EX Special Attack, Chain Attack, or Ultimate.',
        metadata: cond.exSpecial_chain_ult_hits,
        fields: [fieldForBuff(buff.m2_physical_resRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          'Deals additional DMG when Corin extended slash hits an enemy.',
        metadata: cond.charge,
        fields: [
          {
            title: st('dmg'),
            fieldRef: formula.m6_dmg.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
