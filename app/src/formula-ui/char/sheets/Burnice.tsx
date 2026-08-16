import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Burnice } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Burnice'
const [, ch] = trans('char', key)
const cond = Burnice.conditionals
const buff = Burnice.buffs
const formula = Burnice.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      EXSpecialAttackIntenseHeatTossingMethod: [
        {
          type: 'conditional',
          conditional: {
            label: ch('abloom'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Burnice_gen"
                key18="special.EXSpecialAttackIntenseHeatTossingMethod.desc"
              />
            ),
            metadata: cond.abloom,
            fields: [
              fieldForBuff(buff.exSpecial_ether_anom_mv_mult_),
              fieldForBuff(buff.exSpecial_electric_anom_mv_mult_),
              fieldForBuff(buff.exSpecial_fire_anom_mv_mult_),
              fieldForBuff(buff.exSpecial_physical_anom_mv_mult_),
              fieldForBuff(buff.exSpecial_ice_anom_mv_mult_),
            ],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_afterburn_dmg.tag)}>
              {ch('core_afterburn_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_afterburn_dmg.tag,
        },
        {
          title: ch('core_afterburn_anomBuildup'),
          fieldRef: formula.core_afterburn_anomBuildup.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_afterburn_dmg_.tag)}>
              {ch('core_afterburn_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_afterburn_dmg_.tag,
        },
      ],
    },
  ],
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      fields: [
        fieldForBuff(buff.potential_anomMas),
        fieldForBuff(buff.potential_common_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        {
          title: ch('m1_afterburn_mv_mult'),
          fieldValue: dm.m1.afterburn_dmg * 100,
          unit: '%',
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Burnice_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.thermal_penetration,
        fields: [fieldForBuff(buff.m2_pen_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: ch('m4_exSpecial_crit_'),
          fieldRef: buff.m4_exSpecial_crit_.tag,
        },
        {
          title: ch('m4_assistSkill_crit_'),
          fieldRef: buff.m4_assistSkill_crit_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(formula.m6_additional_afterburn_dmg.tag)}
            >
              {ch('m6_additional_afterburn_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_afterburn_dmg.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Burnice_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.exSpecial_active,
        fields: [
          fieldForBuff(buff.m6_burn_fire_resIgn_),
          {
            title: ch('m6_fire_resIgn'),
            fieldRef: buff.m6_fire_resIgn_.tag,
          },
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6CondBurn'),
        description: (
          <GameDesc ns="char_Burnice_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.additional_burn,
        fields: [fieldForBuff(buff.m6_fire_anom_mv_mult_)],
      },
    },
  ],
})

export default sheet
