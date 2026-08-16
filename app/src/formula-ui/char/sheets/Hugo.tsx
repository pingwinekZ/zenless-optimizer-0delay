import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Hugo } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Hugo'
const [, ch] = trans('char', key)
const cond = Hugo.conditionals
const buff = Hugo.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreDarkAbyssReverb'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.core_dark_abyss_reverb,
        linked: ['m1_dark_abyss_reverb'],
        fields: [
          fieldForBuff(buff.core_crit_),
          fieldForBuff(buff.core_crit_dmg_),
        ],
      },
    },
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('core_atk') },
      fields: [fieldForBuff(buff.core_atk)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreStunLeft'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.stun_left,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_exSpecial_mv_mult_.tag)}>
                {ch('core_exSpecial_mv_mult_')}
              </ColorText>
            ),
            fieldRef: buff.core_exSpecial_mv_mult_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.core_ult_mv_mult_.tag)}>
                {ch('core_ult_mv_mult_')}
              </ColorText>
            ),
            fieldRef: buff.core_ult_mv_mult_.tag,
          },
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('core_dazeInc_header'),
        description: <CoreGameDesc characterKey={key} paragraph={4} />,
        metadata: cond.ex_special_daze_inc,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_exSpecial_dazeInc_.tag)}>
                {ch('core_exSpecial_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.core_exSpecial_dazeInc_.tag,
          },
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('abilityCond') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_chain_dmg_.tag)}>
              {ch('ability_chain_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_chain_dmg_.tag,
        },
      ],
    },
    {
      type: 'fields',
      paragraph: 1,
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_exSpecial_dmg_.tag)}>
              {ch('ability_exSpecial_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_exSpecial_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_ult_dmg_.tag)}>
              {ch('ability_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_ult_dmg_.tag,
        },
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1DarkAbyssReverbCond'),
        description: <GameDesc ns="char_Hugo_gen" key18="mindscapes.1.desc" />,
        metadata: cond.m1_dark_abyss_reverb,
        linked: ['core_dark_abyss_reverb'],
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m1_exSpecial_crit_.tag)}>
                {ch('m1_exSpecial_crit_')}
              </ColorText>
            ),
            fieldRef: buff.m1_exSpecial_crit_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_exSpecial_crit_dmg_.tag)}>
                {ch('m1_exSpecial_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_exSpecial_crit_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_ult_crit_.tag)}>
                {ch('m1_ult_crit_')}
              </ColorText>
            ),
            fieldRef: buff.m1_ult_crit_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_ult_crit_dmg_.tag)}>
                {ch('m1_ult_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_ult_crit_dmg_.tag,
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_exSpecial_defIgn_.tag)}>
              {ch('m2_exSpecial_defIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m2_exSpecial_defIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_ult_defIgn_.tag)}>
              {ch('m2_ult_defIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m2_ult_defIgn_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Hugo_gen" key18="mindscapes.4.desc" />,
        metadata: cond.charged_shot_hit,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m4_ice_resIgn_.tag)}>
                {ch('m4_ice_resIgn_')}
              </ColorText>
            ),
            fieldRef: buff.m4_ice_resIgn_.tag,
          },
        ],
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
            <ColorText color={getVariant(buff.m6_exSpecial_dmg_.tag)}>
              {ch('m6_exSpecial_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_exSpecial_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_ult_dmg_.tag)}>
              {ch('m6_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_ult_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_exSpecial_mv_mult_.tag)}>
              {ch('m6_exSpecial_mv_mult_')}
            </ColorText>
          ),
          fieldRef: buff.m6_exSpecial_mv_mult_.tag,
        },
      ],
    },
  ],
})

export default sheet
