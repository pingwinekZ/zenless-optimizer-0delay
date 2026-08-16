import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Yuzuha } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Yuzuha'
const [, ch] = trans('char', key)
const cond = Yuzuha.conditionals
const buff = Yuzuha.buffs
const formula = Yuzuha.formulas
const dm = mappedStats.char[key]

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
        description: (
          <>
            <GameDesc ns="char_Yuzuha_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Yuzuha_gen" key18="ability.desc.1" />
          </>
        ),
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
          <GameDesc ns="char_Yuzuha_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.sweet_scare,
        fields: [fieldForBuff(buff.m1_resRed_)],
      },
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(1)} size={1.5} />,
        text: ch('m1_header'),
      },
      fields: [
        {
          title: ch('m1_buffInc_'),
          fieldValue: dm.m1.buffInc_ * 100,
          unit: '%',
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Yuzuha_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.exSpecial_ult_hit,
        fields: [fieldForBuff(buff.m2_common_dmg_)],
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
          title: (
            <ColorText
              color={getVariant(buff.m4_stuffedHardCandyShot_dmg_.tag)}
            >
              {ch('m4_stuffedHardCandyShot_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m4_stuffedHardCandyShot_dmg_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6AdditionalDmg') },
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
          <GameDesc ns="char_Yuzuha_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.powerful_shell_hits,
        fields: [fieldForBuff(buff.m6_addl_disorder_)],
      },
    },
  ],
})

export default sheet
