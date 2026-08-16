import type { CharacterKey } from '../../../consts'
import { Ben } from '../../../formula'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Ben'
const [, ch] = trans('char', key)
const cond = Ben.conditionals
const buff = Ben.buffs
const formula = Ben.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      SpecialAttackFiscalFist: [
        {
          type: 'fields',
          fields: [
            {
              title: st('shield'),
              fieldRef: formula.special_shield.tag,
            },
          ],
        },
      ],
      EXSpecialAttackCashflowCounter: [
        {
          type: 'fields',
          fields: [
            {
              title: st('shield'),
              fieldRef: formula.special_shield.tag,
            },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      fields: [
        fieldForBuff(buff.core_atk),
        {
          title: st('shield'),
          fieldRef: formula.core_shield.tag,
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
          "While Ben's Guardian shield is active, he gains increased CRIT Rate.",
        metadata: cond.shieldOn,
        fields: [fieldForBuff(buff.ability_crit_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          'When successfully blocking an enemy, Ben reduces incoming damage.',
        metadata: cond.enemyBlocked,
        fields: [fieldForBuff(buff.m1_dmg_red_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [
        {
          title: st('dmg'),
          fieldRef: formula.m2_dmg.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description:
          'When successfully blocking an enemy, Ben gains increased Counter DMG.',
        metadata: cond.enemyBlocked,
        fields: [
          {
            title: ch('m4_dmg_'),
            fieldRef: buff.m4_dmg_.tag,
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          'After launching an attack during EX Special Attack, Ben gains increased Daze from subsequent attacks.',
        metadata: cond.attackLaunched,
        fields: [
          fieldForBuff(buff.m6_basic_dazeInc_),
          fieldForBuff(buff.m6_dash_dazeInc_),
          fieldForBuff(buff.m6_dodgeCounter_dazeInc_),
        ],
      },
    },
  ],
})

export default sheet
