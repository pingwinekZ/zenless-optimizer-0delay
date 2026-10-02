import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Norma } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Norma'
const [, ch] = trans('char', key)
const cond = Norma.conditionals
const buff = Norma.buffs
const formula = Norma.formulas
const ns = 'char_Norma_gen'

function TechDivideDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns={ns} key18="ability.desc.1" />
        <div style={{ marginBottom: 8 }} />
        <GameDesc ns={ns} key18="ability.desc.2" />
      </AbilityBodyText>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="The Stun DMG Multiplier"
          to="is increased to 6%"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_critDmg_') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [fieldForBuff(buff.core_critDmg_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      description: <CoreGameDesc characterKey={key} paragraph={1} />,
      fields: [
        fieldForBuff(buff.core_exSpecial_dazeInc_),
        fieldForBuff(buff.core_special_dazeInc_),
        fieldForBuff(buff.core_ult_dazeInc_),
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_atk') },
      description: <CoreGameDesc characterKey={key} paragraph={2} />,
      fields: [fieldForBuff(buff.core_atk)],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('techDivideCond'),
        description: <TechDivideDescription />,
        metadata: cond.tech_divide_stacks,
        fields: [fieldForBuff(buff.ability_stun_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('enNahBarrageAtkCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns={ns} key18="ability.desc.3" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.enNahBarrage_atk,
        fields: [fieldForBuff(buff.ability_atk)],
        linked: ['enNahBarrage_dmg'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('enNahBarrageDmgCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns={ns} key18="ability.desc.4" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.enNahBarrage_dmg,
        fields: [fieldForBuff(buff.ability_squadDmg_)],
        linked: ['enNahBarrage_atk'],
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
            ns={ns}
            key18="mindscapes.1.desc"
            from="When an Armor-Piercing Warhead"
            to="Repeated triggers reset the duration"
          />
        ),
        metadata: cond.warheadHit,
        fields: [fieldForBuff(buff.m1_allResRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc"
          from="The Daze inflicted by Armor-Piercing Warhead"
          to="High-Explosive Warhead increases by <ct color=#FFFFFF>30%</ct>"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_daze_.tag)}>
              {ch('m6_daze_')}
            </ColorText>
          ),
          fieldRef: buff.m6_daze_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_dmg_.tag)}>
              {ch('m6_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_dmg_.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_missile_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc"
          from="After any squad member Stuns an enemy"
          to="This effect can trigger once every 30s"
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_missile_dmg.tag)}>
              {ch('m6_missile_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_missile_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
