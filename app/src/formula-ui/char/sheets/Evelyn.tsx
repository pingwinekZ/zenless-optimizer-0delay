import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Evelyn } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Evelyn'
const [, ch] = trans('char', key)
const cond = Evelyn.conditionals
const buff = Evelyn.buffs
const formula = Evelyn.formulas

function CoreDescription() {
  const char = useCharacter(key)
  return (
    <GameDescSlice
      ns="char_Evelyn_gen"
      key18={`core.desc.${char?.core ?? 0}`}
      from="Upon entering"
      to="she retains the buff for 10s"
    />
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('bindingSealCond'),
        description: <CoreDescription />,
        metadata: cond.binding_seal,
        fields: [fieldForBuff(buff.core_crit_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      description: (
        <>
          <GameDesc ns="char_Evelyn_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDescSlice
              ns="char_Evelyn_gen"
              key18="ability.desc.1"
              from="Evelyn's <ct color=#FFFFFF>Chain Attack</ct> and <ct color=#FFFFFF>Ultimate</ct> DMG increases by"
              to="125% of the original value."
            />
          </AbilityBodyText>
        </>
      ),
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_chain_ult_dmg_.tag)}>
              {ch('ability_chain_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_chain_ult_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_chain_ult_dmg_.tag)}>
              {ch('ability_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_chain_ult_dmg_.tag,
        },
        fieldForBuff(buff.ability_chainSkill_mv_mult),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('enemyBoundCond'),
        description: (
          <GameDescSlice
            ns="char_Evelyn_gen"
            key18="mindscapes.1.desc"
            from="Enemies affected by"
            to="effect lasts for 10s"
          />
        ),
        metadata: cond.enemy_bound,
        fields: [fieldForBuff(buff.m1_defIgn_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_Evelyn_gen"
          key18="mindscapes.2.desc"
          from="Evelyn's ATK"
          to="15%"
        />
      ),
      fields: [fieldForBuff(buff.m2_atk_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: ch('m4_shield'),
          fieldRef: formula.m4_shield.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4ShieldExistsCond'),
        description: (
          <GameDesc ns="char_Evelyn_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.m4_shield_exists,
        fields: [fieldForBuff(buff.m4_crit_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_follow_up_dmg_.tag)}>
              {ch('m6_follow_up_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_follow_up_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
