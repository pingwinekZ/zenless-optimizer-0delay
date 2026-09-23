import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Rina } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'

const key: CharacterKey = 'Rina'
const [, ch] = trans('char', key)
const cond = Rina.conditionals
const buff = Rina.buffs

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDesc ns="char_Rina_gen" key18="mindscapes.1.desc.1" />
      </PrefixedLine>
    </>
  )
}

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Rina_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Rina_gen"
          key18="ability.desc.1"
          from="When <ct color=#2EB6FF>Shocked</ct> enemies are on the field"
          to="increases by 10%"
        />
      </AbilityBodyText>
    </>
  )
}

function PotentialDescription() {
  return <GameDesc ns="char_Rina_gen" key18="potential.desc.6" />
}

function PotentialAtkDefDescription() {
  return (
    <GameDescSlice
      ns="char_Rina_gen"
      key18="potential.desc.6"
      from="While the buff gained from"
      to="468 DEF"
    />
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('minionsOnFieldCond'),
        description: <CoreDescription />,
        metadata: cond.minions_onField,
        fields: [fieldForBuff(buff.core_pen_)],
        linked: ['minions_onField_enerRegen', 'potential_minions_onField'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('shockedEnemyCond'),
        description: <AbilityDescription />,
        metadata: cond.shocked_enemy,
        fields: [fieldForBuff(buff.ability_electric_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_pen_header') },
      description: <PotentialDescription />,
      fields: [fieldForBuff(buff.potential_pen_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('potentialMinionsOnFieldCond'),
        description: <PotentialAtkDefDescription />,
        metadata: cond.potential_minions_onField,
        fields: [
          fieldForBuff(buff.potential_atk_),
          fieldForBuff(buff.potential_def_),
        ],
        linked: ['minions_onField', 'minions_onField_enerRegen'],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('activeCharCond'),
        description: <GameDesc ns="char_Rina_gen" key18="mindscapes.2.desc" />,
        metadata: cond.active_char,
        fields: [fieldForBuff(buff.m2_common_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('minionsOnFieldEnerRegenCond'),
        description: <GameDesc ns="char_Rina_gen" key18="mindscapes.4.desc" />,
        metadata: cond.minions_onField_enerRegen,
        fields: [fieldForBuff(buff.m4_enerRegen)],
        linked: ['minions_onField', 'potential_minions_onField'],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialChainUltHitCond'),
        description: <GameDesc ns="char_Rina_gen" key18="mindscapes.6.desc" />,
        metadata: cond.exSpecial_chain_ult_hit,
        fields: [fieldForBuff(buff.m6_electric_dmg_)],
      },
    },
  ],
})

export default sheet
