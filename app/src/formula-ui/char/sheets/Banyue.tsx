import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Banyue } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Banyue'
const [, ch] = trans('char', key)
const cond = Banyue.conditionals
const buff = Banyue.buffs
const formula = Banyue.formulas

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
        description: <CoreGameDesc characterKey={key} paragraph={11} />,
        metadata: cond.coreExSpecialFollowUpUsed,
        fields: [
          fieldForBuff(buff.core_sheerForce),
          fieldForBuff(buff.core_fire_dmg_),
          fieldForBuff(buff.core_crit_dmg_),
        ],
        linked: 'm2ExSpecialFollowUpUsed',
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityVidyarajaCond'),
        description: (
          <>
            <GameDesc ns="char_Banyue_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Banyue_gen" key18="ability.desc.1" />
          </>
        ),
        metadata: cond.abilityVidyaraja,
        fields: [fieldForBuff(buff.ability_fire_dmg_)],
        linked: 'm6Vidyaraja',
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('tremorCond'),
        description: (
          <GameDesc ns="char_Banyue_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.tremor,
        fields: [
          fieldForBuff(buff.m1_fire_resRed_),
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
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2ExSpecialFollowUpUsedCond'),
        description: (
          <GameDesc ns="char_Banyue_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.m2ExSpecialFollowUpUsed,
        fields: [
          fieldForBuff(buff.m2_fire_dmg_),
          fieldForBuff(buff.m2_crit_dmg_),
        ],
        linked: 'coreExSpecialFollowUpUsed',
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
      type: 'conditional',
      conditional: {
        label: ch('m6VidyarajaCond'),
        description: (
          <GameDesc ns="char_Banyue_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.m6Vidyaraja,
        fields: [fieldForBuff(buff.m6_fire_dmg_)],
        linked: 'abilityVidyaraja',
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
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
