import type { CharacterKey } from '../../../consts'
import { Anton } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Anton'
const [, ch] = trans('char', key)
const cond = Anton.conditionals
const buff = Anton.buffs
const formula = Anton.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('core_piledriver_dmg_'),
          fieldRef: buff.core_piledriver_dmg_.tag,
        },
        {
          title: ch('core_drill_dmg_'),
          fieldRef: buff.core_drill_dmg_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          'While in Burst Mode, landing critical hits increases Electric Anomaly Multiplier.',
        metadata: cond.burst_mode,
        fields: [fieldForBuff(buff.ability_electric_anom_mv_mult_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [
        {
          title: st('shield'),
          fieldRef: formula.m2_shield.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: st('uponLaunch.2', {
          val1: '$t(skills.chain)',
          val2: '$t(skills.ult)',
        }),
        description:
          'Upon launching a Chain Attack or Ultimate, Anton gains increased CRIT Rate.',
        metadata: cond.chain_ult_used,
        fields: [fieldForBuff(buff.m4_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          'When Piledriver Attack triggers a critical hit, Anton gains increased Burst Mode attack DMG.',
        metadata: cond.piledriver_crits,
        fields: [
          {
            title: ch('m6_dmg_'),
            fieldRef: buff.m6_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
