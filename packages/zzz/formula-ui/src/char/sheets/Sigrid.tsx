import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Sigrid } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Sigrid'
const [, ch] = trans('char', key)
const cond = Sigrid.conditionals
const buff = Sigrid.buffs
const formula = Sigrid.formulas

const ns = 'char_Sigrid_gen'

function TemperedDescription() {
  return (
    <>
      <GameDesc ns={ns} key18="chain.ChainAttackEncroachingIce.desc.0" />
      <div style={{ marginBottom: 8 }} />
      <GameDesc ns={ns} key18="chain.ChainAttackEncroachingIce.desc.2" />
    </>
  )
}

function M1AdditionalDmgDescription() {
  return (
    <GameDescSlice
      ns={ns}
      key18="mindscapes.1.desc"
      from="Upon activating the 3rd stage of <ct color=#FFFFFF>Basic Attack: Converging Spear</ct>"
      to="<ct color=#98EFF0>Ice DMG</ct>"
    />
  )
}

function M1AtkDescription() {
  return (
    <GameDescSlice
      ns={ns}
      key18="mindscapes.1.desc"
      from="Sigrid's <ct color=#FFFFFF>ATK</ct> increases by"
      to="<ct color=#FFFFFF>25%</ct>"
    />
  )
}

function M2Description() {
  return (
    <GameDescSlice
      ns={ns}
      key18="mindscapes.2.desc"
      from="PEN Ratio of <ct color=#FFFFFF>Unbridled Spear</ct> attacks and <ct color=#FFFFFF>Basic Attack: Converging Spear</ct>"
      to="extended by 2s"
    />
  )
}

function M6Description() {
  return (
    <GameDescSlice
      ns={ns}
      key18="mindscapes.6.desc"
      from="When <ct color=#FFFFFF>Basic Attack: Converging Spear</ct>'s"
      to="<ct color=#98EFF0>Ice DMG</ct>"
    />
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      ChainAttackEncroachingIce: [
        {
          type: 'conditional',
          conditional: {
            label: ch('temperedCond'),
            description: <TemperedDescription />,
            metadata: cond.tempered,
            fields: [
              {
                title: (
                  <ColorText
                    color={getVariant(buff.tempered_convergeSpear_dmg_.tag)}
                  >
                    {ch('tempered_convergeSpear_dmg_')}
                  </ColorText>
                ),
                fieldRef: buff.tempered_convergeSpear_dmg_.tag,
              },
            ],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('patrolActiveCond'),
        description: <CoreGameDesc characterKey={key} paragraph={5} />,
        metadata: cond.patrolActive,
        fields: [fieldForBuff(buff.core_patrol_crit_)],
        linked: 'patrolActiveM4',
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('stunnedEnemyHitCond'),
        description: <CoreGameDesc characterKey={key} paragraph={6} />,
        metadata: cond.stunnedEnemyHit,
        fields: [fieldForBuff(buff.core_stun_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_atk') },
      description: (
        <>
          <GameDesc ns={ns} key18="ability.desc.0" />
          <div style={{ marginBottom: 8 }} />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns={ns} key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      fields: [fieldForBuff(buff.ability_atk)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('contaminationCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns={ns}
                key18="ability.desc.2"
                from="DMG increases by"
                to="Contamination"
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.contaminationActive,
        fields: [fieldForBuff(buff.ability_contamination_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_atk_') },
      description: <M1AtkDescription />,
      fields: [fieldForBuff(buff.m1_atk_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_dmg_') },
      description: <M1AdditionalDmgDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m1_overCap_dmg_.tag)}>
              {ch('m1_overCap_dmg_')}
            </ColorText>
          ),
          fieldRef: formula.m1_overCap_dmg_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: <M2Description />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_frostTipped_pen_.tag)}>
              {ch('m2_frostTipped_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_frostTipped_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_convergeSpear1_pen_.tag)}>
              {ch('m2_convergeSpear1_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_convergeSpear1_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_convergeSpear2_pen_.tag)}>
              {ch('m2_convergeSpear2_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_convergeSpear2_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_convergeSpear3_pen_.tag)}>
              {ch('m2_convergeSpear3_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_convergeSpear3_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_dodgeCounter_pen_.tag)}>
              {ch('m2_dodgeCounter_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_dodgeCounter_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_scatteredJade_pen_.tag)}>
              {ch('m2_scatteredJade_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_scatteredJade_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_shatteredJade_pen_.tag)}>
              {ch('m2_shatteredJade_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_shatteredJade_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_chain_pen_.tag)}>
              {ch('m2_chain_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_chain_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_ult_pen_.tag)}>
              {ch('m2_ult_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_ult_pen_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_assistFollowUp_pen_.tag)}>
              {ch('m2_assistFollowUp_pen_')}
            </ColorText>
          ),
          fieldRef: buff.m2_assistFollowUp_pen_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('patrolActiveM4Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.4.desc" />,
        metadata: cond.patrolActiveM4,
        fields: [fieldForBuff(buff.m4_dmg_)],
        linked: 'patrolActive',
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: <M6Description />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_convergeSpear1_dmg_.tag)}>
              {ch('m6_convergeSpear1_dmg_')}
            </ColorText>
          ),
          fieldRef: formula.m6_convergeSpear1_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.m6_convergeSpear2_dmg_.tag)}>
              {ch('m6_convergeSpear2_dmg_')}
            </ColorText>
          ),
          fieldRef: formula.m6_convergeSpear2_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.m6_convergeSpear3_dmg_.tag)}>
              {ch('m6_convergeSpear3_dmg_')}
            </ColorText>
          ),
          fieldRef: formula.m6_convergeSpear3_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
