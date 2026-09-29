import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Dialyn } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Dialyn'
const [, ch] = trans('char', key)
const cond = Dialyn.conditionals
const buff = Dialyn.buffs
const formula = Dialyn.formulas

function MaliciousComplaintDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} paragraph={3} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Dialyn_gen"
          key18="mindscapes.2.desc"
          from="Enemies affected by"
          to="Stun DMG Multiplier when Stunned"
          toExact
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [fieldForBuff(buff.core_impact)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('maliciousComplaintStunCond'),
        description: <MaliciousComplaintDescription />,
        metadata: cond.malicious_complaint,
        fields: [fieldForBuff(buff.core_stun_)],
        linked: ['m2_malicious_complaint'],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: (
        <>
          <GameDesc ns="char_Dialyn_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      fields: [fieldForBuff(buff.ability_exSpecial_crit_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveCommonCond'),
        description: (
          <>
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns="char_Dialyn_gen"
                key18="ability.desc.2"
                from="When an <ct color=#FFFFFF>EX Special Attack</ct> or <ct color=#FFFFFF>Ultimate</ct> is activated"
                to="DMG dealt is increased by 40%"
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.overwhelmingly_positive_common,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
        linked: [
          'overwhelmingly_positive_resIgn',
          'overwhelmingly_positive_atk',
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('teammateSlotCond'),
        description: (
          <>
            <GameDesc ns="char_Dialyn_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Dialyn_gen" key18="ability.desc.3" />
              <div style={{ marginBottom: 8 }} />
              <GameDesc ns="char_Dialyn_gen" key18="ability.desc.4" />
              <div style={{ marginBottom: 8 }} />
              <GameDesc ns="char_Dialyn_gen" key18="ability.desc.5" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.teammateSlot,
        badge: (_, value) =>
          value > 0 ? ch(`teammateSlot_.${value}`) : undefined,
        fields: [
          {
            title: (
              <ColorText color={getVariant(formula.ability_dmg.tag)}>
                {ch('ability_dmg')}
              </ColorText>
            ),
            fieldRef: formula.ability_dmg.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveResIgnCond'),
        description: (
          <GameDescSlice
            ns="char_Dialyn_gen"
            key18="mindscapes.1.desc"
            from="While the <ct color=#FFFFFF>Overwhelmingly Positive</ct> effect is active"
            to="All-Attribute RES"
          />
        ),
        metadata: cond.overwhelmingly_positive_resIgn,
        fields: [fieldForBuff(buff.m1_resIgn_)],
        linked: [
          'overwhelmingly_positive_common',
          'overwhelmingly_positive_atk',
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('maliciousComplaintCond'),
        description: (
          <GameDescSlice
            ns="char_Dialyn_gen"
            key18="mindscapes.2.desc"
            from="all units deal 15% increased DMG"
            to="to targets affected by"
            capitalize
          />
        ),
        metadata: cond.m2_malicious_complaint,
        fields: [fieldForBuff(buff.m2_common_dmg_)],
        linked: ['malicious_complaint'],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('overwhelminglyPositiveAtkCond'),
        description: (
          <GameDescSlice
            ns="char_Dialyn_gen"
            key18="mindscapes.4.desc"
            from="While the <ct color=#FFFFFF>Overwhelmingly Positive</ct> effect is active, Dialyn's ATK"
            to="increases by 500"
          />
        ),
        metadata: cond.overwhelmingly_positive_atk,
        fields: [fieldForBuff(buff.m4_atk)],
        linked: [
          'overwhelmingly_positive_common',
          'overwhelmingly_positive_resIgn',
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_dmg') },
      description: <GameDesc ns="char_Dialyn_gen" key18="mindscapes.6.desc" />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6AdditionalDmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
