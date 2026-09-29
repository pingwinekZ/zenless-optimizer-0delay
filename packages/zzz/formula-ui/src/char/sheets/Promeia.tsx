import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Promeia } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Promeia'
const [, ch] = trans('char', key)
const cond = Promeia.conditionals
const buff = Promeia.buffs
const formula = Promeia.formulas

function AbilityPresumptionDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns="char_Promeia_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Promeia_gen" key18="ability.desc.3" />
      </AbilityBodyText>
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns="char_Promeia_gen"
          key18="mindscapes.1.desc"
          from="When any squad member triggers"
          to="20% DEF."
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [
        fieldForBuff(buff.core_anomProf),
        fieldForBuff(buff.core_abloomDmg),
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialIceBuildupCond'),
        description: (
          <>
            <GameDesc ns="char_Promeia_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Promeia_gen" key18="ability.desc.1" />
              <GameDesc ns="char_Promeia_gen" key18="ability.desc.2" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.exSpecialIceBuildup,
        fields: [fieldForBuff(buff.ability_iceAnomBuildup_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('presumptionOfGuiltCond'),
        description: <AbilityPresumptionDescription />,
        metadata: cond.presumptionOfGuilt,
        fields: [fieldForBuff(buff.ability_presumptionDefIgn)],
      },
    },
  ],
  perSkillAbility: {
    chain: {
      ChainAttackHangingJudgment: [
        {
          type: 'fields',
          header: { icon: null, text: ch('chainAbloom_header') },
          description: (
            <GameDescSlice
              ns="char_Promeia_gen"
              key18="chain.ChainAttackHangingJudgment.desc.2"
              from="When the"
              to="corresponding attribute."
            />
          ),
          fields: [
            {
              title: (
                <ColorText color={getVariant(formula.chainAbloomDmg.tag)}>
                  {ch('chainAbloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.chainAbloomDmg.tag,
            },
          ],
        },
      ],
      UltimateGlaciatingImpalement: [
        {
          type: 'fields',
          header: { icon: null, text: ch('ultAbloom_header') },
          description: (
            <GameDescSlice
              ns="char_Promeia_gen"
              key18="chain.UltimateGlaciatingImpalement.desc.2"
              from="When the"
              to="corresponding attribute."
            />
          ),
          fields: [
            {
              title: (
                <ColorText color={getVariant(formula.ultAbloomDmg.tag)}>
                  {ch('ultAbloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.ultAbloomDmg.tag,
            },
          ],
        },
      ],
    },
  },
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_ap_header') },
      description: (
        <GameDescSlice
          ns="char_Promeia_gen"
          key18="mindscapes.2.desc"
          from="Promeia's Anomaly Proficiency"
          to="by 40."
        />
      ),
      fields: [fieldForBuff(buff.m2_anomProf)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_trialAbloom_header') },
      description: (
        <GameDescSlice
          ns="char_Promeia_gen"
          key18="mindscapes.2.desc"
          from="The multiplier of"
          to="120%."
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.trialByColdAbloomDmg.tag)}>
              {ch('m2_trialAbloomDmg')}
            </ColorText>
          ),
          fieldRef: formula.trialByColdAbloomDmg.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_specialAbloom_header') },
      description: (
        <GameDescSlice
          ns="char_Promeia_gen"
          key18="mindscapes.6.desc"
          from="When Promeia consumes"
          to="200% multiplier."
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6SpecialAbloomDmg.tag)}>
              {ch('m6_specialAbloomDmg')}
            </ColorText>
          ),
          fieldRef: formula.m6SpecialAbloomDmg.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_Promeia_gen"
          key18="mindscapes.6.desc"
          from="Attribute Anomaly DMG and"
          to="All-Attribute RES."
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_resIgn_anomaly.tag)}>
              {ch('m6_resIgn_anomaly')}
            </ColorText>
          ),
          fieldRef: buff.m6_resIgn_anomaly.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_resIgn_disorder.tag)}>
              {ch('m6_resIgn_disorder')}
            </ColorText>
          ),
          fieldRef: buff.m6_resIgn_disorder.tag,
        },
      ],
    },
  ],
})

export default sheet
