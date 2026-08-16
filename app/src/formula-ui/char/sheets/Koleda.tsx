import type { CharacterKey } from '../../../consts'
import { Koleda } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Koleda'
const [, ch] = trans('char', key)
const cond = Koleda.conditionals
const buff = Koleda.buffs
const formula = Koleda.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [
        fieldForBuff(buff.core_exSpecial_dazeInc_),
        {
          title: ch('core_dazeInc_'),
          fieldRef: buff.core_dazeInc_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.1', { val1: '$t(skills.exSpecial)' }),
        description:
          'Increases Chain Attack DMG against enemies hit by EX Special Attack.',
        metadata: cond.exSpecial_debuff,
        fields: [fieldForBuff(buff.ability_chain_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          'Increases Daze from Special and EX Special Attacks when used quickly in succession.',
        metadata: cond.quick_use,
        fields: [
          fieldForBuff(buff.m1_special_dazeInc_),
          fieldForBuff(buff.m1_exSpecial_dazeInc_),
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
          'Increases Chain Attack and Ultimate DMG after consuming Furnace Fire.',
        metadata: cond.charge,
        fields: [
          fieldForBuff(buff.m4_chain_dmg_),
          fieldForBuff(buff.m4_ult_dmg_),
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      fields: [
        {
          title: st('dmg'),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
