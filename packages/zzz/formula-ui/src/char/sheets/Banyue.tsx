import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Banyue } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Banyue'
const [, ch] = trans('char', key)
const cond = Banyue.conditionals
const buff = Banyue.buffs
const formula = Banyue.formulas

function CoreFollowUpDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={11} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Banyue_gen"
          key18="mindscapes.2.desc"
          from="The CRIT DMG bonus"
          to="bonus is increased by an additional 15%"
        />
      </PrefixedLine>
    </>
  )
}

function VidyarajaDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns="char_Banyue_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Banyue_gen" key18="ability.desc.1" />
      </AbilityBodyText>
      <PrefixedLine prefix="M6" dimmed={mindscape < 6}>
        <GameDescSlice
          ns="char_Banyue_gen"
          key18="mindscapes.6.desc"
          from="At any time"
          to="extended to 30s"
        />{' '}
        <GameDescSlice
          ns="char_Banyue_gen"
          key18="mindscapes.6.desc"
          from="<ct color=#FFFFFF>Dodge: Battle Cry"
          to="also grants"
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
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreExSpecialFollowUpUsedCond'),
        description: <CoreFollowUpDescription />,
        metadata: cond.coreExSpecialFollowUpUsed,
        fields: [
          fieldForBuff(buff.core_sheerForce),
          fieldForBuff(buff.core_fire_dmg_),
          fieldForBuff(buff.core_crit_dmg_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityVidyarajaCond'),
        description: <VidyarajaDescription />,
        metadata: cond.abilityVidyaraja,
        fields: [fieldForBuff(buff.ability_fire_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tremorResRedCond'),
        description: (
          <GameDescSlice
            ns="char_Banyue_gen"
            key18="mindscapes.1.desc"
            from="he inflicts the"
            to="lasting 30s"
            capitalize
          />
        ),
        metadata: cond.tremorResRed,
        fields: [fieldForBuff(buff.m1_fire_resRed_)],
        linked: ['tremorDmg'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('tremorDmgCond'),
        description: (
          <GameDescSlice
            ns="char_Banyue_gen"
            key18="mindscapes.1.desc"
            from="<ct color=#FFFFFF>EX Special Attack: Lion's Roar</ct>"
            to="increased by 10%"
          />
        ),
        metadata: cond.tremorDmg,
        fields: [
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_topplingMountain_sheer_dmg_.tag)}
              >
                {ch('m1_topplingMountain_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_topplingMountain_sheer_dmg_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_crushingPeaks_sheer_dmg_.tag)}
              >
                {ch('m1_crushingPeaks_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_crushingPeaks_sheer_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_lionsRoar_sheer_dmg_.tag)}>
                {ch('m1_lionsRoar_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_lionsRoar_sheer_dmg_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_lionsRoarWrath_sheer_dmg_.tag)}
              >
                {ch('m1_lionsRoarWrath_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_lionsRoarWrath_sheer_dmg_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_mountainTremor_sheer_dmg_.tag)}
              >
                {ch('m1_mountainTremor_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_mountainTremor_sheer_dmg_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_mountainTremorWrath_sheer_dmg_.tag)}
              >
                {ch('m1_mountainTremorWrath_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_mountainTremorWrath_sheer_dmg_.tag,
          },
        ],
        linked: ['tremorResRed'],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_topplingMountain_dmg_.tag)}>
              {ch('m4_topplingMountain_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_topplingMountain_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_crushingPeaks_dmg_.tag)}>
              {ch('m4_crushingPeaks_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_crushingPeaks_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_lionsRoarWrath_dmg_.tag)}>
              {ch('m4_lionsRoarWrath_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_lionsRoarWrath_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_mountainTremorWrath_dmg_.tag)}>
              {ch('m4_mountainTremorWrath_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_mountainTremorWrath_dmg_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_Banyue_gen"
          key18="mindscapes.6.desc"
          from="When activating"
          to="nearby enemies"
        />
      ),
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
