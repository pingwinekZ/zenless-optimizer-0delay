import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Koleda } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Koleda'
const [, ch] = trans('char', key)
const cond = Koleda.conditionals
const buff = Koleda.buffs
const formula = Koleda.formulas

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Koleda_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Koleda_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackSmashNBash: [
        {
          type: 'conditional',
          conditional: {
            label: ch('furnaceFireCond'),
            description: (
              <GameDescSlice
                ns="char_Koleda_gen"
                key18="basic.BasicAttackSmashNBash.desc.5"
                from="When <ct color=#FFFFFF>Furnace Fire</ct> is consumed"
                to="Repeated triggers reset the duration."
              />
            ),
            metadata: cond.furnace_fire,
            fields: [fieldForBuff(buff.basic_common_dmg_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_exSpecial_dazeInc_.tag)}>
              {ch('core_exSpecial_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.core_exSpecial_dazeInc_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_basic_dazeInc_.tag)}>
              {ch('core_basic_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.core_basic_dazeInc_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialDebuffCond'),
        description: <AbilityDescription />,
        metadata: cond.exSpecial_debuff,
        fields: [fieldForBuff(buff.ability_chain_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      description: <GameDesc ns="char_Koleda_gen" key18="potential.desc.6" />,
      fields: [
        fieldForBuff(buff.potential_laceration_dmg_),
        fieldForBuff(buff.potential_crit_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('quickUseCond'),
        description: (
          <GameDesc ns="char_Koleda_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.quick_use,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m1_special_dazeInc_.tag)}>
                {ch('m1_special_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.m1_special_dazeInc_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_exSpecial_dazeInc_.tag)}>
                {ch('m1_exSpecial_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.m1_exSpecial_dazeInc_.tag,
          },
        ],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('chargeCond'),
        description: (
          <GameDesc ns="char_Koleda_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.charge,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m4_chain_dmg_.tag)}>
                {ch('m4_chain_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_chain_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m4_ult_dmg_.tag)}>
                {ch('m4_ult_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_ult_dmg_.tag,
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_additional_dmg') },
      description: <GameDesc ns="char_Koleda_gen" key18="mindscapes.6.desc" />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
