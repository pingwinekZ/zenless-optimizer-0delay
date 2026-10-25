import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Severian } from '@zenless-optimizer/zzz/formula'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Severian'
const [, ch] = trans('char', key)
const cond = Severian.conditionals
const buff = Severian.buffs
const formula = Severian.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [
        fieldForBuff(buff.core_crit_dmg_),
        fieldForBuff(buff.core_dmg_),
        fieldForBuff(buff.core_wind_ally_dmg_),
      ],
    },
  ],

  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_atk_header') },
      description: (
        <>
          <GameDesc ns="char_Severian_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Severian_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      fields: [fieldForBuff(buff.ability_atk)],
    },
  ],

  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: (
        <GameDesc ns="char_Severian_gen" key18="mindscapes.1.desc.3" />
      ),
      fields: [fieldForBuff(buff.m1_wind_resIgn_)],
    },
  ],

  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2_penCond'),
        description: (
          <GameDesc ns="char_Severian_gen" key18="mindscapes.2.desc.1" />
        ),
        metadata: cond.m2_pen,
        fields: [fieldForBuff(buff.m2_pen_)],
      },
    },
  ],

  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4_atkCond'),
        description: (
          <GameDesc ns="char_Severian_gen" key18="mindscapes.4.desc.0" />
        ),
        metadata: cond.m4_atk,
        fields: [fieldForBuff(buff.m4_atk_)],
      },
    },
  ],

  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDesc ns="char_Severian_gen" key18="mindscapes.6.desc.1" />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_shadowhunt_final_dmg.tag)}>
              {ch('m6_shadowhunt_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_shadowhunt_final_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
