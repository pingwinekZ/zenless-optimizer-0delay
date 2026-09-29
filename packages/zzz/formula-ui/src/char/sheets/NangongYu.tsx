import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { NangongYu } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'NangongYu'
const [, ch] = trans('char', key)
const cond = NangongYu.conditionals
const buff = NangongYu.buffs
const formula = NangongYu.formulas

/**
 * Additional Ability trigger plus the squad Anomaly Buildup buff (dimmed
 * while the ability is inactive).
 */
function AbilityBuildupDescription() {
  return (
    <>
      <GameDesc ns="char_NangongYu_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_NangongYu_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

/**
 * Core Vibrato Abloom, with the M2 per-stack bonus appended and dimmed until
 * M2 is unlocked (the ratio is applied as a multiplier in the
 * `abloomDmgInst_*` formulas and shown per attribute by the
 * `core_*_anom_mv_mult_` fields — Vivian pattern).
 */
function VibratoDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={2} />
      <CoreGameDesc characterKey={key} paragraph={3} />
      <CoreGameDesc characterKey={key} paragraph={4} />
      <CoreGameDesc characterKey={key} paragraph={5} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.2.desc"
          from="Each stack of"
          to="by an additional 10%"
        />
      </PrefixedLine>
    </>
  )
}

/**
 * Misstep Stun DMG Multiplier plus the M2 increase folded in (Trigger
 * §3.10 pattern). Opens with the Additional Ability trigger line since
 * Misstep also requires it.
 */
function MisstepDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns="char_NangongYu_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="ability.desc.5"
          from="Under this effect, Stun DMG Multiplier increases by 30%"
          to="can only trigger once on the same target"
        />
      </AbilityBodyText>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.2.desc"
          from="The Stun DMG Multiplier provided by"
          to="increases by an additional 30%"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('coreStats') },
      fields: [fieldForBuff(buff.core_anomProf)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_impact_header') },
      description: <CoreGameDesc characterKey={key} paragraph={1} />,
      fields: [fieldForBuff(buff.core_impact)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('dazeSquadBuffCond'),
        description: <CoreGameDesc characterKey={key} paragraph={6} />,
        metadata: cond.dazeSquadBuff,
        fields: [
          fieldForBuff(buff.core_anomBuildup_),
          fieldForBuff(buff.core_daze_),
          fieldForBuff(buff.core_squad_dmg_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('vibratoStacksCond'),
        description: <VibratoDescription />,
        metadata: cond.vibrato_stacks,
        fields: [
          fieldForBuff(buff.core_ether_anom_mv_mult_),
          fieldForBuff(buff.core_electric_anom_mv_mult_),
          fieldForBuff(buff.core_fire_anom_mv_mult_),
          fieldForBuff(buff.core_physical_anom_mv_mult_),
          fieldForBuff(buff.core_ice_anom_mv_mult_),
          fieldForBuff(buff.core_wind_anom_mv_mult_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('stunnedBuildupCond'),
        description: <AbilityBuildupDescription />,
        metadata: cond.stunned_buildup,
        fields: [
          fieldForBuff(buff.ability_squad_anomBuildup_),
          fieldForBuff(buff.ability_chain_anomBuildup_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('misstepHitCond'),
        description: <MisstepDescription />,
        metadata: cond.misstep_hit,
        fields: [fieldForBuff(buff.ability_misstep_stun_)],
      },
    },
  ],
  perSkillAbility: {
    chain: {
      UltimateMeteorShower: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <GameDesc
                ns="char_NangongYu_gen"
                key18="chain.UltimateMeteorShower.desc.2"
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.core_etherVeil_atk)],
          },
        },
      ],
    },
  },
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1ResIgnCond'),
        description: (
          <GameDesc ns="char_NangongYu_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.m1ResIgn,
        fields: [fieldForBuff(buff.m1_resRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(2)} size={1.5} />,
        text: ch('polarityDisorderCond'),
      },
      description: (
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.2.desc"
          from="When the active character's"
          to="once during the same Stun period"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m2_polarity_disorder_dmg.tag)}>
              {ch('m2_polarity_disorder_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m2_polarity_disorder_dmg.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(4)} size={1.5} />,
        text: ch('m4_ap_header'),
      },
      description: (
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.4.desc"
          from="Anomaly Proficiency increases"
          to="by 40"
        />
      ),
      fields: [fieldForBuff(buff.m4_anomProf)],
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(4)} size={1.5} />,
        text: ch('m4_buildup_header'),
      },
      description: (
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.4.desc"
          from="The Anomaly Buildup"
          to="increases by 35%"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_basic_anomBuildup_.tag)}>
              {ch('m4_basic_anomBuildup_')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_anomBuildup_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_NangongYu_gen"
          key18="mindscapes.6.desc"
          from="Nangong Yu's attacks deal"
          to="50% more Daze"
        />
      ),
      fields: [fieldForBuff(buff.m6_daze_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('modifiedStacksCond'),
        description: (
          <GameDescSlice
            ns="char_NangongYu_gen"
            key18="mindscapes.6.desc"
            from="When the enemy is not Stunned"
            to="cannot stack with"
          />
        ),
        metadata: cond.modified_stacks,
        fields: [
          fieldForBuff(buff.m6_ether_anom_mv_mult_),
          fieldForBuff(buff.m6_electric_anom_mv_mult_),
          fieldForBuff(buff.m6_fire_anom_mv_mult_),
          fieldForBuff(buff.m6_physical_anom_mv_mult_),
          fieldForBuff(buff.m6_ice_anom_mv_mult_),
          fieldForBuff(buff.m6_wind_anom_mv_mult_),
        ],
      },
    },
  ],
})

export default sheet
