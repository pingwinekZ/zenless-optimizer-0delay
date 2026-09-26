import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Yixuan } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { AbilityBodyText, createBaseSheet, fieldForBuff } from '../sheetUtil'
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
      header: { icon: null, text: ch('ability_lightning_header') },
      description: (
        <>
          <GameDesc ns="char_Yixuan_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDescSlice
              ns="char_Yixuan_gen"
              key18="ability.desc.1"
              from="If Yixuan is switched out"
              to="5 Adrenaline"
            />
          </AbilityBodyText>
        </>
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.ability_dmg.tag)}>
              {ch('ability_dmg')}
            </ColorText>
          ),
          fieldRef: formula.ability_dmg.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: (
        <>
          <GameDesc ns="char_Yixuan_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Yixuan_gen" key18="ability.desc.2" />
          </AbilityBodyText>
        </>
      ),
      fields: [
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
          <>
            <GameDesc ns="char_Yixuan_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Yixuan_gen" key18="ability.desc.3" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.meditation,
        fields: [fieldForBuff(buff.ability_crit_dmg_)],
        linked: ['m6_meditation'],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_crit_header') },
      description: (
        <GameDescSlice
          ns="char_Yixuan_gen"
          key18="mindscapes.1.desc"
          from="Upon entering combat"
          to="CRIT Rate increases by 10%"
        />
      ),
      fields: [fieldForBuff(buff.m1_crit_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_dmg_header') },
      description: (
        <GameDescSlice
          ns="char_Yixuan_gen"
          key18="mindscapes.1.desc"
          from="When any squad member lands a hit"
          to="once every 6s"
        />
      ),
      fields: [
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
      header: { icon: null, text: ch('m2_resIgn_header') },
      description: (
        <GameDescSlice
          ns="char_Yixuan_gen"
          key18="mindscapes.2.desc"
          from="When an"
          to="Ether RES"
        />
      ),
      fields: [
        fieldForBuff(buff.m2_ult_ether_resIgn_),
        fieldForBuff(buff.m2_exSpecial_ether_resIgn_),
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_dmg_header') },
      description: (
        <GameDescSlice
          ns="char_Yixuan_gen"
          key18="mindscapes.2.desc"
          from="when using"
          to="held at a time"
          capitalize
        />
      ),
      fields: [
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
          <GameDesc ns="char_Yixuan_gen" key18="mindscapes.4.desc" />
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
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_Yixuan_gen"
            key18="mindscapes.6.desc"
            from="while in the"
            to="increased by 20%"
            capitalize
          />
        ),
        metadata: cond.m6_meditation,
        linked: ['meditation'],
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
