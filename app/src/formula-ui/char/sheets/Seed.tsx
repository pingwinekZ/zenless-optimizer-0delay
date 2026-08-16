import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Seed } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Seed'
const [, ch] = trans('char', key)
const cond = Seed.conditionals
const buff = Seed.buffs
const formula = Seed.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('onslaughtAtkCond'),
        description: <CoreGameDesc characterKey={key} paragraph={1} />,
        metadata: cond.onslaught_atk,
        fields: [
          fieldForBuff(buff.core_atk),
          fieldForBuff(buff.core_crit_dmg_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('directStrikeCond'),
        description: <CoreGameDesc characterKey={key} paragraph={1} />,
        metadata: cond.directStrike,
        fields: [
          fieldForBuff(buff.core_vanguard_atk),
          fieldForBuff(buff.core_vanguard_crit_dmg_),
        ],
        targeted: true,
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('besiegeCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.besiege,
        fields: [fieldForBuff(buff.core_dmg_)],
        linked: ['besiege_defIgn', 'besiege_ult_dmg'],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      paragraph: 2,
      header: { icon: null, text: ch('ability_dmg_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
              {ch('ability_basic_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_basic_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
              {ch('ability_downfall_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_basic_dmg_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.ability_basic_electric_resIgn_.tag)}
            >
              {ch('ability_basic_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.ability_basic_electric_resIgn_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.ability_basic_electric_resIgn_.tag)}
            >
              {ch('ability_downfall_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.ability_basic_electric_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_ult_dmg_.tag)}>
              {ch('ability_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_ult_dmg_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.ability_ult_electric_resIgn_.tag)}
            >
              {ch('ability_ult_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.ability_ult_electric_resIgn_.tag,
        },
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_basic_crit_dmg_.tag)}>
              {ch('m1_basic_crit_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m1_basic_crit_dmg_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('besiegeDefIgnCond'),
        description: <GameDesc ns="char_Seed_gen" key18="mindscapes.2.desc" />,
        metadata: cond.besiege_defIgn,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_defIgn_.tag)}>
                {ch('m2_defIgn_')}
              </ColorText>
            ),
            fieldRef: buff.m2_defIgn_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_vanguard_defIgn_.tag)}>
                {ch('m2_vanguard_defIgn_')}
              </ColorText>
            ),
            fieldRef: buff.m2_vanguard_defIgn_.tag,
          },
        ],
        linked: ['besiege', 'besiege_ult_dmg'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2EnergyConsumedCond'),
        description: <GameDesc ns="char_Seed_gen" key18="mindscapes.2.desc" />,
        metadata: cond.energy_consumed,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_basic_dmg_.tag)}>
                {ch('ability_basic_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_basic_dmg_.tag,
          },
        ],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('besiegeUltDmgCond'),
        description: <GameDesc ns="char_Seed_gen" key18="mindscapes.4.desc" />,
        metadata: cond.besiege_ult_dmg,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m4_ult_dmg_.tag)}>
                {ch('m4_ult_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_ult_dmg_.tag,
          },
        ],
        linked: ['besiege', 'besiege_defIgn'],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: {
        icon: null,
        text: ch('m6_header'),
      },
      fields: [fieldForBuff(buff.m6_crit_dmg_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_additional_dmg') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_additional_laser_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
