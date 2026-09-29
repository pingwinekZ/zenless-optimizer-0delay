import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Sunna } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Sunna'
const [, ch] = trans('char', key)
const cond = Sunna.conditionals
const buff = Sunna.buffs
const formula = Sunna.formulas

// Cat's Gaze trigger rules (core) plus the M2 multiplier augmentation,
// appended as a mindscape-prefixed line so the teaser shows what each copy
// adds (Trigger §3.12 pattern).
function CatsgazeDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={2} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={3} />
      <div style={{ marginBottom: 8 }} />
      <CoreGameDesc characterKey={key} paragraph={4} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDesc ns="char_Sunna_gen" key18="mindscapes.2.desc.1" />
        <div style={{ marginBottom: 8 }} />
        <GameDesc ns="char_Sunna_gen" key18="mindscapes.2.desc.2" />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      EXSpecialAttackSpecialPhotographyTechnique: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilRepriseCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Sunna_gen"
                key18="special.EXSpecialAttackSpecialPhotographyTechnique.desc"
                paragraph={2}
              />
            ),
            metadata: cond.etherVeilReprise,
            fields: [fieldForBuff(buff.reprise_atk)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('angelicChordinationCond'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.angelic_chordination,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('teammateSlotCond'),
        description: <CatsgazeDescription />,
        metadata: cond.teammateSlot,
        badge: (_, value) =>
          value > 0 ? ch(`teammateSlot_.${value}`) : undefined,
        fields: [
          formula.catsgaze_dmg_fire,
          formula.catsgaze_dmg_electric,
          formula.catsgaze_dmg_ice,
          formula.catsgaze_dmg_physical,
          formula.catsgaze_dmg_ether,
          formula.catsgaze_dmg_wind,
        ].map((f) => ({
          title: (
            <ColorText color={getVariant(f.tag)}>
              {ch('catsgaze_dmg')}
            </ColorText>
          ),
          fieldRef: f.tag,
        })),
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityStunCond'),
        description: (
          <>
            <GameDesc ns="char_Sunna_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Sunna_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.abilityStun,
        fields: [fieldForBuff(buff.ability_stun_)],
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
            ns="char_Sunna_gen"
            key18="mindscapes.1.desc"
            from="When <ct color=#FFFFFF>Cat's Gaze</ct> triggers"
            to="calculated separately"
          />
        ),
        metadata: cond.m1DefReductionStacks,
        fields: [fieldForBuff(buff.m1_defRed_)],
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
            ns="char_Sunna_gen"
            key18="mindscapes.2.desc.0"
            from="While Sunna is within"
            to="every 10s"
          />
        ),
        metadata: cond.etherVeil,
        fields: [fieldForBuff(buff.m2_etherVeil_atk)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.4.desc" />,
        metadata: cond.ult_used,
        fields: [fieldForBuff(buff.m4_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <>
            <GameDesc ns="char_Sunna_gen" key18="mindscapes.6.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Sunna_gen" key18="mindscapes.6.desc.1" />
          </>
        ),
        metadata: cond.focusedCreation,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
        linked: ['focusedCreationDmg'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6DmgCond'),
        description: (
          <GameDesc ns="char_Sunna_gen" key18="mindscapes.6.desc.4" />
        ),
        metadata: cond.focusedCreationDmg,
        fields: [
          {
            ...fieldForBuff(buff.m6_catsgaze_dmg_),
            title: (
              <ColorText color={getVariant(buff.m6_catsgaze_dmg_.tag)}>
                {ch('m6_catsgaze_dmg_')}
              </ColorText>
            ),
          },
        ],
        linked: ['focusedCreation'],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_self_trigger') },
      description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.6.desc.3" />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_catsgaze_dmg.tag)}>
              {ch('m6_catsgaze_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_catsgaze_dmg.tag,
        },
      ],
    },
  ],
})
export default sheet
