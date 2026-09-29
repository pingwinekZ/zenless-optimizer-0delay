import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Yuzuha } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Yuzuha'
const [, ch] = trans('char', key)
const cond = Yuzuha.conditionals
const buff = Yuzuha.buffs
const formula = Yuzuha.formulas

/**
 * Additional Ability trigger, the Tanuki Wish Anomaly/Disorder buff (dimmed
 * while the ability is inactive), and the M1 increase to that buff.
 */
function AbilityDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns="char_Yuzuha_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Yuzuha_gen" key18="ability.desc.1" />
      </AbilityBodyText>
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns="char_Yuzuha_gen"
          key18="mindscapes.1.desc"
          from="The Attribute Anomaly DMG"
          to="original value"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: (
          <>
            <CoreGameDesc characterKey={key} paragraph={2} />
            <div style={{ marginBottom: 8 }} />
            <CoreGameDesc characterKey={key} paragraph={3} />
            <div style={{ marginBottom: 8 }} />
            <CoreGameDesc characterKey={key} paragraph={4} />
          </>
        ),
        metadata: cond.tanuki_wish,
        fields: [
          fieldForBuff(buff.core_atk),
          fieldForBuff(buff.core_common_dmg_),
        ],
        linked: ['tanuki_wish_ability'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <AbilityDescription />,
        metadata: cond.tanuki_wish_ability,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.ability_anomaly_buff_.tag)}>
                {ch('ability_anomaly_buff_')}
              </ColorText>
            ),
            fieldRef: buff.ability_anomaly_buff_.tag,
            team: buff.ability_anomaly_buff_.team,
          },
          {
            title: (
              <ColorText color={getVariant(buff.ability_disorder_buff_.tag)}>
                {ch('ability_disorder_buff_')}
              </ColorText>
            ),
            fieldRef: buff.ability_disorder_buff_.tag,
            team: buff.ability_disorder_buff_.team,
          },
          fieldForBuff(buff.ability_anomBuildup_),
        ],
        linked: ['tanuki_wish'],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDescSlice
            ns="char_Yuzuha_gen"
            key18="mindscapes.1.desc"
            from="Enemies in the"
            to="reduced by 10%"
          />
        ),
        metadata: cond.sweet_scare,
        fields: [fieldForBuff(buff.m1_resRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns="char_Yuzuha_gen"
            key18="mindscapes.2.desc"
            from="When Yuzuha's"
            to="DMG increases by 15%"
          />
        ),
        metadata: cond.exSpecial_ult_hit,
        fields: [
          fieldForBuff(buff.m2_common_dmg_),
          fieldForBuff(buff.m2_anomBuildup_),
        ],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(4)} size={1.5} />,
        text: ch('m4_header'),
      },
      description: (
        <GameDescSlice
          ns="char_Yuzuha_gen"
          key18="mindscapes.4.desc"
          from="The DMG of Yuzuha's"
          to="increases by 30%"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_weHaveCookies_dmg_.tag)}>
              {ch('m4_weHaveCookies_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_weHaveCookies_dmg_.tag,
        },
        {
          title: ch('m4_weHaveCookies_anomBuildup_'),
          fieldRef: buff.m4_weHaveCookies_anomBuildup_.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_stuffedHardCandyShot_dmg_.tag)}
            >
              {ch('m4_stuffedHardCandyShot_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_stuffedHardCandyShot_dmg_.tag,
        },
        {
          title: ch('m4_stuffedHardCandyShot_anomBuildup_'),
          fieldRef: buff.m4_stuffedHardCandyShot_anomBuildup_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6AdditionalDmg') },
      description: (
        <GameDescSlice
          ns="char_Yuzuha_gen"
          key18="mindscapes.6.desc"
          from="For every 0.4s charged"
          to="Physical DMG"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6ChargedShellDmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_Yuzuha_gen"
            key18="mindscapes.6.desc"
            from="If any powerful shell"
            to="stacking up to 3 times"
          />
        ),
        metadata: cond.powerful_shell_hits,
        fields: [fieldForBuff(buff.m6_addl_disorder_)],
      },
    },
  ],
})

export default sheet
