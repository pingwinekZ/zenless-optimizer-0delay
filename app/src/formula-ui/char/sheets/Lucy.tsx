import type { CharacterKey } from '../../../consts'
import { Lucy } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Lucy'
const [, ch] = trans('char', key)
const cond = Lucy.conditionals
const buff = Lucy.buffs
const formula = Lucy.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      CheerOn: [
        {
          type: 'conditional',
          conditional: {
            label: ch('cheerOnCond'),
            description:
              'After landing an EX Special Attack, Lucy applies the "Cheer On!" status to all squad members for 10 seconds (15 seconds while in Aftershock). While "Cheer On!" is active, increases the ATK of all squad members based on a portion of Lucy\'s initial ATK plus a flat bonus, up to 600 ATK. The guard boars summoned by Lucy\'s Core Passive also receive this ATK bonus.',
            metadata: cond.cheerOn,
            fields: [fieldForBuff(buff.exSpecial_atk)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('cheerOnCond'),
        metadata: cond.cheerOn,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      fields: [
        fieldForBuff(buff.ability_crit_),
        fieldForBuff(buff.ability_crit_dmg_),
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('cheerOnCond'),
        description:
          'M4: While the "Cheer On!" status is active, increases the CRIT DMG of all squad members by a flat amount.',
        metadata: cond.cheerOn,
        fields: [fieldForBuff(buff.m4_crit_dmg_)],
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
