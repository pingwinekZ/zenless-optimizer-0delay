import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Lucia } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { st, trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Lucia'
const [, ch] = trans('char', key)
const cond = Lucia.conditionals
const buff = Lucia.buffs
const formula = Lucia.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      EXSpecialAttackSymphonyOfTheReaperDaybreak: [
        {
          type: 'conditional',
          conditional: {
            label: ch('exSpecialStateCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Lucia_gen"
                key18="special.EXSpecialAttackSymphonyOfTheReaperDaybreak.desc"
                paragraph={2}
              />
            ),
            metadata: cond.exSpecialState,
            fields: [fieldForBuff(buff.exSpecial_sheerForce)],
            linked: 'darkbreaker',
          },
        },
        {
          type: 'fields',
          descKey: 'special.EXSpecialAttackSymphonyOfTheReaperDaybreak.desc',
          paragraph: 3,
          header: { icon: null, text: ch('exSpecial_harmony_dmg_') },
          fields: [fieldForBuff(buff.exSpecial_harmony_dmg_)],
        },
      ],
    },
    chain: {
      UltimateChargeGreatArmor: [
        {
          type: 'fields',
          fields: [
            {
              title: st('heal'),
              fieldRef: formula.ult_heal.tag,
            },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('dreamersNurseryRhymeCond'),
        description: <CoreGameDesc characterKey={key} paragraph={3} />,
        metadata: cond.dreamersNurseryRhyme,
        fields: [fieldForBuff(buff.core_common_dmg_)],
        linked: 'm1DreamersNurseryRhyme',
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('etherVeilCond'),
        description: (
          <>
            <CoreGameDesc characterKey={key} paragraph={0} />
            <div style={{ marginBottom: 8 }} />
            <CoreGameDesc characterKey={key} paragraph={1} />
          </>
        ),
        metadata: cond.etherVeil,
        fields: [fieldForBuff(buff.core_hp_)],
        linked: ['m2EtherVeil', 'm6EtherVeil'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('darkbreakerCond'),
        description: (
          <>
            <GameDesc ns="char_Lucia_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Lucia_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.darkbreaker,
        fields: [fieldForBuff(buff.ability_crit_dmg_)],
        linked: 'exSpecialState',
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1DreamersNurseryRhymeCond'),
        description: (
          <GameDescSlice
            ns="char_Lucia_gen"
            key18="mindscapes.1.desc"
            from="When <ct color=#FFFFFF>Dreamer's Nursery Rhyme</ct> deals additional DMG"
            to="Decibel Generation Rate"
          />
        ),
        metadata: cond.m1DreamersNurseryRhyme,
        fields: [fieldForBuff(buff.m1_resIgn_)],
        linked: 'dreamersNurseryRhyme',
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2EtherVeilCond'),
        description: (
          <GameDescSlice
            ns="char_Lucia_gen"
            key18="mindscapes.2.desc"
            from="While Lucia is inside"
            to="deals 15% more DMG"
          />
        ),
        metadata: cond.m2EtherVeil,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_harmony_dmg_.tag)}>
                {ch('m2_harmony_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_harmony_dmg_.tag,
          },
        ],
        linked: 'etherVeil',
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2DarkbreakerCond'),
        description: (
          <GameDescSlice
            ns="char_Lucia_gen"
            key18="mindscapes.2.desc"
            from="Agents in the"
            to="Sheer DMG increase"
          />
        ),
        metadata: cond.m2Darkbreaker,
        fields: [fieldForBuff(buff.m2_sheer_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6EtherVeilCond'),
        description: <GameDesc ns="char_Lucia_gen" key18="mindscapes.6.desc" />,
        metadata: cond.m6EtherVeil,
        fields: [
          fieldForBuff(buff.m6_atk_),
          {
            title: (
              <ColorText color={getVariant(buff.m6_harmony_crit_.tag)}>
                {ch('m6_harmony_crit_')}
              </ColorText>
            ),
            fieldRef: buff.m6_harmony_crit_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_harmony_crit_dmg_.tag)}>
                {ch('m6_harmony_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_harmony_crit_dmg_.tag,
          },
        ],
        linked: 'etherVeil',
      },
    },
  ],
})

export default sheet
