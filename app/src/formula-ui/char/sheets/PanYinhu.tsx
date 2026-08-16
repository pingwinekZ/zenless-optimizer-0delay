import type { CharacterKey } from '../../../consts'
import { PanYinhu } from '../../../formula'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'PanYinhu'
const [, ch] = trans('char', key)
const cond = PanYinhu.conditionals
const buff = PanYinhu.buffs
const formula = PanYinhu.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateAFeastFitForAnEmperor: [
        {
          type: 'fields',
          fields: [
            {
              title: ch('ultimate_heal'),
              fieldRef: formula.ultimate_heal.tag,
            },
            {
              title: ch('ultimate_healOverTime'),
              fieldRef: formula.ultimate_healOverTime.tag,
            },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          'Grants Sheer Force stacks when EX Special Attack hits an enemy and triggers Quick Assist.',
        metadata: cond.meridian_flow,
        fields: [fieldForBuff(buff.core_sheerForce)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'Increases damage dealt when hitting an enemy with Special Attack: Touch of Death.',
        metadata: cond.depleted_qi,
        fields: [fieldForBuff(buff.ability_dmgInc_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m1_dmgInc_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('m4_heal'),
          fieldRef: formula.m4_heal.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('m6_sheerForce'),
          fieldValue: dm.m6.sheerForce * 100,
          unit: '%',
        },
        {
          title: ch('m6_maxSheerForce'),
          fieldValue: dm.m6.max_sheerForce,
        },
      ],
    },
  ],
})

export default sheet
