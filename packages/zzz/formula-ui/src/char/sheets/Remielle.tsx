import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Remielle } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Remielle'
const [, ch] = trans('char', key)
const cond = Remielle.conditionals
const buff = Remielle.buffs

/**
 * Core Refringe Coefficient, with the M2 +20% line appended and dimmed
 * until M2 is unlocked (the value is folded into `core_refringeCoeff_` via
 * `cmpGE(char.mindscape, 2, ...)`).
 */
function CoreRefringeDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={0} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Remielle_gen"
          key18="mindscapes.2.desc"
          from="<ct color=#FFA9DD>Refringe Coefficient</ct>"
          to="increases by 20%"
        />
      </PrefixedLine>
    </>
  )
}

/**
 * Additional Ability trigger plus the ATK clause (dimmed while the ability
 * is inactive). The Daze clause lives in the Phase Flow · Daze conditional.
 */
function AbilityAtkDescription() {
  return (
    <>
      <GameDesc ns="char_Remielle_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Remielle_gen"
          key18="ability.desc.1"
          from="all squad members gain an ATK increase"
          to="1,600 ATK"
          capitalize
        />
      </AbilityBodyText>
    </>
  )
}

/**
 * Additional Ability trigger plus the Phase Flow Daze clause.
 */
function PhaseFlowDazeDescription() {
  return (
    <>
      <GameDesc ns="char_Remielle_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Remielle_gen"
          key18="ability.desc.1"
          from="Remielle's Daze dealt while in the Phase Flow state"
          to="35%"
        />
      </AbilityBodyText>
    </>
  )
}

/**
 * Additional Ability trigger plus the Prismatic buildup clause.
 */
function PrismaticBuildupDescription() {
  return (
    <>
      <GameDesc ns="char_Remielle_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Remielle_gen" key18="ability.desc.2" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_refringeCoeff') },
      description: <CoreRefringeDescription />,
      fields: [fieldForBuff(buff.core_refringeCoeff_)],
    },
    {
      type: 'fields',
      paragraph: 3,
      header: { icon: null, text: ch('core_luminize_anom_mv_mult_') },
      description: <CoreGameDesc characterKey={key} paragraph={3} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_luminize_anom_mv_mult_.tag)}>
              {ch('core_luminize_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_luminize_anom_mv_mult_.tag,
        },
      ],
    },
  ],

  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_atkBuff') },
      description: <AbilityAtkDescription />,
      fields: [fieldForBuff(buff.ability_atkBuff)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('phaseFlowDazeCond'),
        description: <PhaseFlowDazeDescription />,
        metadata: cond.phaseFlow_daze,
        fields: [fieldForBuff(buff.ability_dazeInc_)],
        linked: ['phaseFlow', 'phaseFlow_m1'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('prismaticBuildupCond'),
        description: <PrismaticBuildupDescription />,
        metadata: cond.prismatic_buildup,
        fields: [fieldForBuff(buff.ability_prismatic_anomBuildup_)],
        linked: ['prismatic'],
        targeted: true,
      },
    },
  ],

  // Phase Flow team DMG conditional (shows under the "Special" section).
  // Linked with Phase Flow · Daze and the M1 Phase Flow conditional:
  // toggling any one toggles all three (same Phase Flow state).
  perSkillAbility: {
    special: {
      SpecialAttackOdeToDawnRadiantTurn: [
        {
          type: 'conditional',
          conditional: {
            label: ch('phaseFlowCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Remielle_gen"
                key18="special.SpecialAttackOdeToDawnRadiantTurn.desc.3"
              />
            ),
            metadata: cond.phaseFlow,
            fields: [fieldForBuff(buff.special_teamDmg_)],
            linked: ['phaseFlow_daze', 'phaseFlow_m1'],
            targeted: true,
          },
        },
      ],
    },
  },

  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      description: (
        <GameDescSlice
          ns="char_Remielle_gen"
          key18="mindscapes.1.desc"
          from="When Remielle triggers Luminize to deal DMG"
          to="All-Attribute RES"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_allResIgn_.tag)}>
              {ch('m1_allResIgn_')}
            </ColorText>
          ),
          fieldRef: buff.m1_allResIgn_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1PhaseFlowCond'),
        description: (
          <GameDescSlice
            ns="char_Remielle_gen"
            key18="mindscapes.1.desc"
            from="While Remielle is in the Phase Flow state"
            to="increases by 10%"
          />
        ),
        metadata: cond.phaseFlow_m1,
        fields: [fieldForBuff(buff.m1_teamAnomDmg_)],
        linked: ['phaseFlow', 'phaseFlow_daze'],
        targeted: true,
      },
    },
  ],

  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('prismaticCond'),
        description: (
          <GameDescSlice
            ns="char_Remielle_gen"
            key18="mindscapes.2.desc"
            from="When an <ct color=#FFFFFF>Anomaly</ct> character in the squad deals Anomaly DMG"
            to="persists for an additional 8s after <ct color=#FFFFFF>Prismatic</ct> ends"
          />
        ),
        metadata: cond.prismatic,
        fields: [fieldForBuff(buff.m2_teamAnomDefIgn_)],
        linked: ['prismatic_buildup'],
        targeted: true,
      },
    },
  ],

  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      description: (
        <GameDescSlice
          ns="char_Remielle_gen"
          key18="mindscapes.4.desc"
          from="When Remielle triggers Luminize"
          to="additional 12%"
        />
      ),
      fields: [fieldForBuff(buff.m4_luminizeDmg_)],
    },
  ],
})

export default sheet
