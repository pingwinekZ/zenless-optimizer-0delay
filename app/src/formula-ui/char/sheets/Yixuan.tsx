import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Yixuan } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Yixuan'
const [, ch] = trans('char', key)
const cond = Yixuan.conditionals
const buff = Yixuan.buffs
const formula = Yixuan.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_sheerForce_header') },
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
    {
      type: 'fields',
      paragraph: 5,
      header: { icon: null, text: ch('core_dmg_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_auricArray_dmg_.tag)}>
              {ch('core_auricArray_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_auricArray_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_qingmingEruption_dmg_.tag)}>
              {ch('core_qingmingEruption_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_qingmingEruption_dmg_.tag,
        },
        fieldForBuff(buff.core_exSpecial_dmg_),
        fieldForBuff(buff.core_assistFollowUp_dmg_),
        fieldForBuff(buff.core_chain_dmg_),
        fieldForBuff(buff.core_ult_dmg_),
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      paragraph: 2,
      header: { icon: null, text: ch('ability_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.ability_dmg.tag)}>
              {ch('ability_dmg')}
            </ColorText>
          ),
          fieldRef: formula.ability_dmg.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_cloudShaper_dmg_.tag)}>
              {ch('ability_cloudShaper_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_cloudShaper_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.ability_ashenInk_dmg_.tag)}>
              {ch('ability_ashenInk_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.ability_ashenInk_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('meditationCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Yixuan_gen"
            key18="ability.desc.3"
          />
        ),
        metadata: cond.meditation,
        fields: [fieldForBuff(buff.ability_crit_dmg_)],
        linked: 'm6_meditation',
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        fieldForBuff(buff.m1_crit_),
        {
          title: (
            <ColorText color={getVariant(formula.m1_dmg.tag)}>
              {ch('m1_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m1_dmg.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        fieldForBuff(buff.m2_ult_ether_resIgn_),
        fieldForBuff(buff.m2_exSpecial_ether_resIgn_),
        {
          title: (
            <ColorText color={getVariant(formula.m2_dmg.tag)}>
              {ch('m2_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m2_dmg.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Yixuan_gen"
            key18="mindscapes.4.desc"
          />
        ),
        metadata: cond.tranquility,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m4_cloudShaper_dmg_.tag)}>
                {ch('m4_cloudShaper_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_cloudShaper_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m4_ashenInk_dmg_.tag)}>
                {ch('m4_ashenInk_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_ashenInk_dmg_.tag,
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6_header'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Yixuan_gen"
            key18="mindscapes.6.desc"
          />
        ),
        metadata: cond.m6_meditation,
        linked: 'meditation',
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_sheer_dmg_.tag)}>
                {ch('m6_sheer_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_sheer_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
