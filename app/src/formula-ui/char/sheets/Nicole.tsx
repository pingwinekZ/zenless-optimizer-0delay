import type { CharacterKey } from '../../../consts'
import { Nicole } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Nicole'
const [, ch] = trans('char', key)
const cond = Nicole.conditionals
const buff = Nicole.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          "Reduces the enemy's DEF when hit by Nicole's enhanced bullets or Energy Field.",
        metadata: cond.bulletsOrFieldHit,
        fields: [fieldForBuff(buff.core_defRed_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.ability_ether_dmg_)],
    },
  ],
  m1: [
    {
      type: 'fields',
      fields: [
        fieldForBuff(buff.m1_exSpecial_dmg_),
        {
          title: ch('m1_exSpecial_anomBuildup'),
          fieldRef: buff.m1_exSpecial_anomBuildup_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          "Increases CRIT Rate when Nicole's Energy Fields deal DMG to enemies.",
        metadata: cond.fieldHitsEnemy,
        fields: [fieldForBuff(buff.m6_crit_)],
      },
    },
  ],
})

export default sheet
