import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Sigrid } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Sigrid'
const [, ch] = trans('char', key)
const cond = Sigrid.conditionals
const buff = Sigrid.buffs
const formula = Sigrid.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      ChainAttackEncroachingIce: [
        {
          type: 'conditional',
          conditional: {
            label: ch('temperedCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Sigrid_gen"
                key18="chain.ChainAttackEncroachingIce.desc"
              />
            ),
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
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_atk') },
      fields: [fieldForBuff(buff.ability_atk)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('contaminationCond'),
        description: (
          <>
            <GameDesc ns="char_Sigrid_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Sigrid_gen" key18="ability.desc.2" />
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
      fields: [fieldForBuff(buff.m1_atk_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_dmg_') },
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
        description: (
          <GameDesc ns="char_Sigrid_gen" key18="mindscapes.4.desc" />
        ),
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
