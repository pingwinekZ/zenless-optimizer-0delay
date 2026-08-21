import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Lighter } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
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

const key: CharacterKey = 'Lighter'
const [, ch] = trans('char', key)
const cond = Lighter.conditionals
const buff = Lighter.buffs
const formula = Lighter.formulas

function CoreImpactDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return (
    <GameDescSlice
      ns="char_Lighter_gen"
      key18={`core.desc.${coreLevel}.0`}
      from="Lighter automatically gains"
      to="and lasting 6s"
    />
  )
}

function AbilityDescription() {
  const ns = 'char_Lighter_gen'
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns={ns} key18="ability.desc.1" />
        <GameDesc ns={ns} key18="ability.desc.2" />
      </AbilityBodyText>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="The increase to"
          to="120% of the original"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('morale_consumedCond'),
        description: <CoreImpactDescription />,
        metadata: cond.morale_consumed,
        fields: [fieldForBuff(buff.core_impact_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('morale_burst_hitCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.morale_burst_hit,
        fields: [
          fieldForBuff(buff.core_ice_resRed_),
          fieldForBuff(buff.core_fire_resRed_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('elationCond'),
        description: <AbilityDescription />,
        metadata: cond.elation,
        fields: [
          fieldForBuff(buff.ability_ice_dmg_),
          fieldForBuff(buff.ability_fire_dmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1CollapseCond'),
        description: (
          <GameDescSlice
            ns="char_Lighter_gen"
            key18="mindscapes.1.desc"
            from="Among the debuffs imposed"
            to="by 10%"
          />
        ),
        metadata: cond.m1_collapse,
        linked: ['m2_collapse'],
        fields: [
          fieldForBuff(buff.m1_ice_resRed_),
          fieldForBuff(buff.m1_fire_resRed_),
        ],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_finishing_move_header') },
      description: (
        <GameDescSlice
          ns="char_Lighter_gen"
          key18="mindscapes.1.desc"
          from="The more powerful Finishing Move"
          to="increased DMG"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_finishing_move_dmg_.tag)}>
              {ch('m1_finishing_move_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m1_finishing_move_dmg_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2CollapseCond'),
        description: (
          <GameDescSlice
            ns="char_Lighter_gen"
            key18="mindscapes.2.desc"
            from="When applying"
            to="increases by 25%"
          />
        ),
        metadata: cond.m2_collapse,
        linked: ['m1_collapse'],
        fields: [fieldForBuff(buff.m2_stun_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_Lighter_gen"
          key18="mindscapes.6.desc"
          from="When Lighter lands a heavy strike"
          to="maximum increase of 500%"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_blazing_impact_dmg.tag)}>
              {ch('m6_blazing_impact_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_blazing_impact_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
