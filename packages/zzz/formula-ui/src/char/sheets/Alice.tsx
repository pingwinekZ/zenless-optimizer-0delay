import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Alice } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { AbilityBodyText, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Alice'
const [, ch] = trans('char', key)
const cond = Alice.conditionals
const buff = Alice.buffs
const formula = Alice.formulas

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Alice_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Alice_gen" key18="ability.desc.2" />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [],
  ability: [
    {
      type: 'fields',
      description: <AbilityDescription />,
      header: { icon: null, text: ch('ability_header') },
      fields: [fieldForBuff(buff.ability_anomProf)],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1AssaultCond'),
        description: (
          <GameDescSlice
            ns="char_Alice_gen"
            key18="mindscapes.1.desc"
            from="When she triggers <ct color=#F0D12B>Assault</ct> against an enemy"
            to="for 30s"
          />
        ),
        metadata: cond.assault_triggered,
        fields: [fieldForBuff(buff.m1_defRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Alice_gen"
          key18="mindscapes.2.desc"
          from="All squad members'"
          to="increases by 15%"
        />
      ),
      header: { icon: null, text: ch('m2_header') },
      fields: [fieldForBuff(buff.m2_assault_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2PhysicalAnomalyCond'),
        description: (
          <GameDescSlice
            ns="char_Alice_gen"
            key18="mindscapes.2.desc"
            from="<ct color=#FFFFFF>Disorder</ct> DMG against enemies"
            to="increases by 15%"
          />
        ),
        metadata: cond.physical_anomaly_enemy,
        fields: [fieldForBuff(buff.m2_disorder_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Alice_gen"
          key18="mindscapes.4.desc"
          from="Alice ignores 10%"
          to="Physical RES</ct>"
        />
      ),
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_phys_resIgn_)],
    },
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns="char_Alice_gen"
          key18="mindscapes.4.desc"
          from="Enhanced <ct color=#FFFFFF>Basic Attack: Celestial Overture</ct>"
          to="Physical Anomaly Buildup</ct>"
        />
      ),
      header: { icon: null, text: ch('m4_anomBuildup_header') },
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(buff.m4_basic_physical_anomBuildup_.tag)}
            >
              {ch('m4_basic_physical_anomBuildup_')}
            </ColorText>
          ),
          fieldRef: buff.m4_basic_physical_anomBuildup_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_crit_.tag)}>
              {ch('m6_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m6_crit_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
