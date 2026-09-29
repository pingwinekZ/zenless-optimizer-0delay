import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Aria } from '@zenless-optimizer/zzz/formula'
import { GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  SkillGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Aria'
const [, ch] = trans('char', key)
const cond = Aria.conditionals
const buff = Aria.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      Ultimate100Energy: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Aria_gen"
                key18="chain.Ultimate100Energy.desc"
                paragraph={2}
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.ultimate_atk)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [fieldForBuff(buff.core_anomProf)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('coreAbloom') },
      description: <CoreGameDesc characterKey={key} paragraph={1} />,
      fields: [
        fieldForBuff(buff.core_ether_anom_mv_mult_),
        fieldForBuff(buff.core_electric_anom_mv_mult_),
        fieldForBuff(buff.core_fire_anom_mv_mult_),
        fieldForBuff(buff.core_physical_anom_mv_mult_),
        fieldForBuff(buff.core_ice_anom_mv_mult_),
        fieldForBuff(buff.core_wind_anom_mv_mult_),
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_res_header') },
      description: (
        <GameDescSlice
          ns="char_Aria_gen"
          key18="mindscapes.1.desc"
          from="When Aria's"
          to="Ether Anomaly Buildup RES"
        />
      ),
      fields: [fieldForBuff(buff.m1_ether_anomBuildupResRed_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_crit_header') },
      description: (
        <GameDescSlice
          ns="char_Aria_gen"
          key18="mindscapes.1.desc"
          from="Additionally, when Aria triggers"
          to="by 0.5%"
          toExact
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_abloom.tag)}>
              {ch('m1_abloom')}
            </ColorText>
          ),
          fieldRef: buff.m1_abloom.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_abloom_crit_dmg.tag)}>
              {ch('m1_abloom_crit_dmg')}
            </ColorText>
          ),
          fieldRef: buff.m1_abloom_crit_dmg.tag,
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
          ns="char_Aria_gen"
          key18="mindscapes.2.desc"
          from="When Aria attacks"
          to="16% of the target's DEF"
        />
      ),
      fields: [fieldForBuff(buff.m2_defIgn_base)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns="char_Aria_gen"
            key18="mindscapes.2.desc"
            from="During <ct color=#FFFFFF>Moment of Delusion</ct>"
            to="8% of the target's DEF"
          />
        ),
        metadata: cond.m2Delusion,
        fields: [fieldForBuff(buff.m2_defIgn_delusion)],
        linked: ['m6Delusion'],
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
            ns="char_Aria_gen"
            key18="mindscapes.6.desc"
            from="After Aria enters"
            to="increased <ct color=#FE437E>Ether DMG</ct>"
          />
        ),
        metadata: cond.m6Delusion,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_perfectPitch_dmg_.tag)}>
                {ch('m6_perfectPitch_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_perfectPitch_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_ult_dmg_.tag)}>
                {ch('m6_ult_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_ult_dmg_.tag,
          },
        ],
        linked: ['m2Delusion'],
      },
    },
  ],
})

export default sheet
