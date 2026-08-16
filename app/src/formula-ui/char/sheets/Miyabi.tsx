import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Miyabi } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { st, trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Miyabi'
const [, ch] = trans('char', key)
const cond = Miyabi.conditionals
const buff = Miyabi.buffs
const formula = Miyabi.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateLingeringSnow: [
        {
          type: 'conditional',
          conditional: {
            label: st('uponLaunch.1', { val1: '$t(skills.ult)' }),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Miyabi_gen"
                key18="chain.UltimateLingeringSnow.desc"
              />
            ),
            metadata: cond.ult_used,
            fields: [fieldForBuff(buff.ult_ice_dmg_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_frostburnBreak_dmg.tag)}>
              {ch('core_frostburnBreak_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_frostburnBreak_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.ability_dmg_.tag)}>
              {ch('ability_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <GameDesc ns="char_Miyabi_gen" key18="ability.desc" />,
        metadata: cond.disorder_triggered,
        fields: [fieldForBuff(buff.ability_ice_resIgn_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDesc ns="char_Miyabi_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.fallen_frost,
        fields: [
          {
            title: ch('m1_defIgn_'),
            fieldRef: buff.m1_defIgn_.tag,
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
            <ColorText color={getVariant(buff.m2_dmg_.tag)}>
              {ch('m2_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_dmg_.tag,
        },
        fieldForBuff(buff.m2_dodgeCounter_dmg_),
        fieldForBuff(buff.m2_crit_),
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_frostburnBreak_dmg_.tag)}>
              {ch('m4_frostburnBreak_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_frostburnBreak_dmg_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Miyabi_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.polar,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_dmg_.tag)}>
                {ch('m6_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
