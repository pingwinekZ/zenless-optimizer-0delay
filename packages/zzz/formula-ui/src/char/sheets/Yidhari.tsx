import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Yidhari } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Yidhari'
const [, ch] = trans('char', key)
const cond = Yidhari.conditionals
const buff = Yidhari.buffs
const formula = Yidhari.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      EtherVeilWellspring: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Yidhari_gen"
                key18="chain.EtherVeilWellspring.desc"
                paragraph={0}
              />
            ),
            metadata: cond.etherVeil,
            linked: 'm4EtherVeil',
            fields: [fieldForBuff(buff.etherVeil_hp_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_hpSheerForce') },
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCommonDmgCond'),
        description: (
          <>
            <CoreGameDesc characterKey={key} paragraph={2} />
            <div style={{ marginBottom: 8 }} />
            <CoreGameDesc characterKey={key} paragraph={3} />
          </>
        ),
        metadata: cond.missingHp,
        fields: [fieldForBuff(buff.core_common_dmg_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCritDmgCond'),
        description: (
          <>
            <GameDesc ns="char_Yidhari_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Yidhari_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.abilityMissingHp,
        fields: [fieldForBuff(buff.ability_crit_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: (
        <GameDescSlice
          ns="char_Yidhari_gen"
          key18="mindscapes.1.desc"
          from="Yidhari's <ct color=#FFFFFF>Basic Attacks</ct> and <ct color=#FFFFFF>EX Special Attacks</ct> ignore"
          to="Ice RES"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_basic_ice_resIgn_.tag)}>
              {ch('m1_basic_ice_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_basic_ice_resIgn_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_exSpecial_ice_resIgn_.tag)}>
              {ch('m1_exSpecial_ice_resIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_exSpecial_ice_resIgn_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_Yidhari_gen"
          key18="mindscapes.2.desc"
          from="Yidhari's CRIT DMG increases by"
          to="40%"
        />
      ),
      fields: [fieldForBuff(buff.m2_crit_dmg_)],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4EtherVeilCond'),
        description: (
          <GameDescSlice
            ns="char_Yidhari_gen"
            key18="mindscapes.4.desc"
            from="While in <ct color=#FFFFFF>Ether Veil: Wellspring</ct>"
            to="Max HP is further increased by 5%"
          />
        ),
        metadata: cond.m4EtherVeil,
        linked: 'etherVeil',
        fields: [fieldForBuff(buff.m4_hp_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('eruditionCond'),
        description: (
          <GameDescSlice
            ns="char_Yidhari_gen"
            key18="mindscapes.6.desc"
            from="After Yidhari spends Decibels to activate or extend"
            to="her Sheer DMG increases by 25%"
          />
        ),
        metadata: cond.erudition,
        fields: [fieldForBuff(buff.m6_sheer_dmg_)],
      },
    },
    {
      type: 'fields',
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_heal.tag)}>
              {ch('m6_heal')}
            </ColorText>
          ),
          fieldRef: formula.m6_heal.tag,
        },
      ],
    },
  ],
})

export default sheet
