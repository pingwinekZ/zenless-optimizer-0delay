import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Cissia } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Cissia'
const [, ch] = trans('char', key)
const cond = Cissia.conditionals
const buff = Cissia.buffs
const formula = Cissia.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateOphidiophobia: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Cissia_gen"
                key18="chain.UltimateOphidiophobia.desc"
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.core_etherVeil_crit_dmg_)],
          },
        },
      ],
    },
    basic: {
      CorrodeBone: [
        {
          type: 'conditional',
          conditional: {
            label: ch('corrodeBoneCritStacksCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Cissia_gen"
                key18="basic.CorrodeBone.desc"
              />
            ),
            metadata: cond.corrodeBone_crit_stacks,
            fields: [fieldForBuff(buff.core_corrodeBone_crit_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('venomDefIgnCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.venomDefIgn,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_defIgn_.tag)}>
                {ch('core_defIgn_')}
              </ColorText>
            ),
            fieldRef: buff.core_defIgn_.tag,
          },
        ],
        linked: 'venomCritDmg',
      },
    },
    {
      type: 'fields',
      paragraph: 3,
      header: { icon: null, text: ch('core_dmg_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_corrodeBone_dmg_.tag)}>
              {ch('core_corrodeBone_dmg_')}
            </ColorText>
          ),
          fieldRef: formula.core_corrodeBone_dmg_.tag,
        },
      ],
    },
    {
      type: 'fields',
      paragraph: 4,
      header: { icon: null, text: ch('core_daze_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_corrodeBone_daze_.tag)}>
              {ch('core_corrodeBone_daze_')}
            </ColorText>
          ),
          fieldRef: buff.core_corrodeBone_daze_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('venomCritDmgCond'),
        description: (
          <>
            <GameDesc ns="char_Cissia_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Cissia_gen" key18="ability.desc.1" />
          </>
        ),
        metadata: cond.venomCritDmg,
        fields: [
          fieldForBuff(buff.ability_squad_crit_dmg_),
          fieldForBuff(buff.ability_self_crit_dmg_),
        ],
        linked: 'venomDefIgn',
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_electric_resIgn_') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_electric_resIgn_.tag)}>
              {ch('m1_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_electric_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_corrodeBone_resIgn_.tag)}>
              {ch('m1_corrodeBone_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_corrodeBone_resIgn_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_serpentsKiss_dmg_.tag)}>
              {ch('m2_serpentsKiss_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_serpentsKiss_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
