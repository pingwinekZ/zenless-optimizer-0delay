import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Vivian } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Vivian'
const [, ch] = trans('char', key)
const cond = Vivian.conditionals
const buff = Vivian.buffs
const formula = Vivian.formulas

/**
 * Abloom core line, with the M2 Abloom bonus appended and dimmed until M2 is
 * unlocked (the ratio is applied as a multiplier in the `abloomDmgInst_*`
 * formulas and shown per attribute by the `core_*_anom_mv_mult_` fields).
 */
function AbloomDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={0} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Vivian_gen"
          key18="mindscapes.2.desc"
          from="The benefits of <ct color=#FFFFFF>Abloom</ct> from Anomaly Proficiency are raised"
          to="original value"
          toExact
        />
      </PrefixedLine>
    </>
  )
}

/** Ability trigger (always shown) plus the Corruption DMG buff, dimmed while inactive. */
function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Vivian_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Vivian_gen" key18="ability.desc.2" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('coreAbloom') },
      description: <AbloomDescription />,
      fields: [
        fieldForBuff(buff.core_ether_anom_mv_mult_),
        fieldForBuff(buff.core_electric_anom_mv_mult_),
        fieldForBuff(buff.core_fire_anom_mv_mult_),
        fieldForBuff(buff.core_physical_anom_mv_mult_),
        fieldForBuff(buff.core_ice_anom_mv_mult_),
        fieldForBuff(buff.core_wind_anom_mv_mult_),
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={1} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_prophecy_dmg.tag)}>
              {ch('core_prophecy_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_prophecy_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [
        fieldForBuff(buff.ability_corruption_dmg_),
        fieldForBuff(buff.ability_corruption_disorder_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('prophecyCond'),
        description: (
          <GameDescSlice
            ns="char_Vivian_gen"
            key18="mindscapes.1.desc"
            from="All Attribute Anomaly DMG"
            to="16%"
          />
        ),
        metadata: cond.prophecy,
        fields: [
          fieldForBuff(buff.m1_anomaly_dmg_),
          fieldForBuff(buff.m1_disorder_dmg_),
        ],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_buildup_header') },
      description: (
        <GameDescSlice
          ns="char_Vivian_gen"
          key18="mindscapes.2.desc"
          from="Vivian's <ct color=#FE437E>Ether Anomaly Buildup Rate</ct> increases by"
          to="25%"
        />
      ),
      fields: [fieldForBuff(buff.m2_ether_anomBuildup_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_Vivian_gen"
          key18="mindscapes.2.desc"
          from="15% of the target's All-Attribute RES"
          to="ignored"
        />
      ),
      fields: [fieldForBuff(buff.m2_resIgn_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      description: (
        <GameDescSlice
          ns="char_Vivian_gen"
          key18="mindscapes.4.desc.0"
          from="<ct color=#FFFFFF>Basic Attack: Fluttering Frock - Suspension</ct> and"
          to="CRIT on hit"
          toExact
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_suspension_crit_.tag)}>
              {ch('m4_suspension_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m4_suspension_crit_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m4_featherbloom_crit_.tag)}>
              {ch('m4_featherbloom_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m4_featherbloom_crit_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDescSlice
            ns="char_Vivian_gen"
            key18="mindscapes.4.desc.0"
            from="<ct color=#FFFFFF>Basic Attack: Fluttering Frock - Suspension</ct>"
            to="Repeated triggers reset the duration"
          />
        ),
        metadata: cond.fluttering_featherbloom_used,
        fields: [fieldForBuff(buff.m4_atk_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_Vivian_gen"
          key18="mindscapes.6.desc"
          from="Vivian's <ct color=#FE437E>Ether DMG</ct> increases by"
          to="40%"
        />
      ),
      fields: [fieldForBuff(buff.m6_ether_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6AbloomCond'),
        description: (
          <GameDescSlice
            ns="char_Vivian_gen"
            key18="mindscapes.6.desc"
            from="Launching <ct color=#FFFFFF>Basic Attack: Fluttering Frock - Suspension</ct>"
            to="maximum of 5 times the original"
          />
        ),
        metadata: cond.m6_guard_feathers,
        fields: [fieldForBuff(buff.m6_abloom_dmg_)],
      },
    },
  ],
})

export default sheet
