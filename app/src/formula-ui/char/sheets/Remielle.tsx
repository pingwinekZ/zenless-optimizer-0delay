import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Remielle } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Remielle'
const [, ch] = trans('char', key)
const cond = Remielle.conditionals
const buff = Remielle.buffs
const formula = Remielle.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  // Core: Refringe Coefficient + Luminize AP% scaling (visual-only)
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_refringeCoeff') },
      fields: [fieldForBuff(buff.core_refringeCoeff_)],
    },
    {
      type: 'fields',
      paragraph: 3,
      header: { icon: null, text: ch('core_luminize_anom_mv_mult_') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_luminize_anom_mv_mult_.tag)}>
              {'Luminize DMG'}
            </ColorText>
          ),
          fieldRef: buff.core_luminize_anom_mv_mult_.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_luminize_formulas') },
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(formula.luminizeRainbowsEndDmgInst.tag)}
            >
              {ch('luminizeRainbowsEndDmgInst')}
            </ColorText>
          ),
          fieldRef: formula.luminizeRainbowsEndDmgInst.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(formula.luminizeFleetingGraceDmgInst.tag)}
            >
              {ch('luminizeFleetingGraceDmgInst')}
            </ColorText>
          ),
          fieldRef: formula.luminizeFleetingGraceDmgInst.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.luminizeUltimateDmgInst.tag)}>
              {ch('luminizeUltimateDmgInst')}
            </ColorText>
          ),
          fieldRef: formula.luminizeUltimateDmgInst.tag,
        },
        {
          title: (
            <ColorText
              color={getVariant(formula.luminizeFlowerFeatherDmgInst.tag)}
            >
              {ch('luminizeFlowerFeatherDmgInst')}
            </ColorText>
          ),
          fieldRef: formula.luminizeFlowerFeatherDmgInst.tag,
        },
      ],
    },
  ],

  // Ability: ATK buff, Daze buff
  // paragraph=1 on the Daze field overrides the auto-generated index 2
  // (Prismatic paragraph) to show the ATK/Daze paragraph instead.
  // Phase Flow team DMG conditional moved to perSkillAbility.special below.
  // Phase Flow · Daze is a bool conditional linked to the team DMG
  // conditional: toggling either toggles the other.
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_atkBuff') },
      fields: [fieldForBuff(buff.ability_atkBuff)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('phaseFlowDazeCond'),
        description: (
          <>
            <SkillGameDesc
              characterKey={key}
              ns="char_Remielle_gen"
              key18="ability.desc.0"
            />
            <div style={{ marginBottom: 8 }} />
            <SkillGameDesc
              characterKey={key}
              ns="char_Remielle_gen"
              key18="ability.desc.1"
            />
          </>
        ),
        metadata: cond.phaseFlow_daze,
        fields: [fieldForBuff(buff.ability_dazeInc_)],
        linked: ['phaseFlow', 'phaseFlow_m1'],
      },
    },
  ],

  // Special: Phase Flow team DMG conditional (shows under "Special" section)
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
          },
        },
      ],
    },
  },

  // Mindscapes
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
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
          <GameDesc ns="char_Remielle_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.phaseFlow_m1,
        fields: [fieldForBuff(buff.m1_teamAnomDmg_)],
        linked: ['phaseFlow', 'phaseFlow_daze'],
      },
    },
  ],

  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: ch('m2_refringeCoeff'),
          fieldValue: dm.m2.refringeCoeff_ * 100,
          unit: '%',
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('prismaticCond'),
        description: (
          <GameDesc ns="char_Remielle_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.prismatic,
        fields: [fieldForBuff(buff.m2_teamAnomDefIgn_)],
      },
    },
  ],

  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_luminizeDmg_)],
    },
  ],

  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: ch('m6_luminizeTriggerCount'),
          fieldValue: dm.m6.luminizeTriggerCount,
          unit: '×',
        },
      ],
    },
  ],
})

export default sheet
