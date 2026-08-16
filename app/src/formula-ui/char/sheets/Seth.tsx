import type { CharacterKey } from '../../../consts'
import { Seth } from '../../../formula'
import { mappedStats } from '../../../stats'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Seth'
const [, ch] = trans('char', key)
const cond = Seth.conditionals
const buff = Seth.buffs
const formula = Seth.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('core_shield'),
          fieldRef: formula.core_shield.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          "Increases the entire squad's Anomaly Proficiency while Seth has his Shield of Firm Resolve.",
        metadata: cond.shield_active,
        fields: [fieldForBuff(buff.core_anomProf)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description:
          "Reduces the squad's Anomaly Buildup RES when Seth's Chain Attack or finishing move hits an enemy.",
        metadata: cond.chain_finish_hit,
        fields: [fieldForBuff(buff.ability_anomBuildupRes_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      fields: [
        {
          title: ch('m1_shield_'),
          fieldValue: dm.m1.shield_ * 100,
          unit: '%',
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m2_basic_electric_anomBuildup_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m4_defensiveAssist_dazeInc_)],
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
