import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Cissia } from '@zenless-optimizer/zzz/formula'
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
import { getVariant } from '../util'

const key: CharacterKey = 'Cissia'
const [, ch] = trans('char', key)
const cond = Cissia.conditionals
const buff = Cissia.buffs
const formula = Cissia.formulas

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={2} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns="char_Cissia_gen"
          key18="mindscapes.1.desc"
          from="The DEF ignore from the"
          to="140% of its original value"
          toExact
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateOphidiophobia: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <GameDescSlice
                ns="char_Cissia_gen"
                key18="chain.UltimateOphidiophobia.desc.3"
                from="After using this skill, activate"
                to="increases by 5% for the duration."
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
              <GameDescSlice
                ns="char_Cissia_gen"
                key18="basic.CorrodeBone.desc.1"
                from="Each trigger increases CRIT Rate"
                to="refresh the duration."
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
        description: <CoreDescription />,
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
        linked: ['venomCritDmg'],
      },
    },
    {
      type: 'fields',
      paragraph: 3,
      description: <CoreGameDesc characterKey={key} paragraph={3} />,
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
      description: <CoreGameDesc characterKey={key} paragraph={4} />,
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
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Cissia_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.venomCritDmg,
        fields: [
          fieldForBuff(buff.ability_squad_crit_dmg_),
          fieldForBuff(buff.ability_self_crit_dmg_),
        ],
        linked: ['venomDefIgn'],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Cissia_gen"
          key18="mindscapes.1.desc"
          from="all squad members ignore 5%"
          to="Electric RES"
          capitalize
        />
      ),
      header: { icon: null, text: ch('m1_squad_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_electric_resIgn_.tag)}>
              {ch('m1_electric_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_electric_resIgn_.tag,
        },
      ],
    },
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Cissia_gen"
          key18="mindscapes.1.desc"
          from="<ct color=#FFFFFF>Corrode Bone</ct> DMG ignores 10%"
          to="Electric RES"
        />
      ),
      header: { icon: null, text: ch('m1_corrodeBone_header') },
      fields: [
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
      description: (
        <GameDescSlice
          ns="char_Cissia_gen"
          key18="mindscapes.2.desc"
          from="<ct color=#FFFFFF>Basic Attack: Serpent's Kiss</ct>"
          to="35% increased DMG."
        />
      ),
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
