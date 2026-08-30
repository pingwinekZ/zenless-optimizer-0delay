import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Jane } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Jane'
const [, ch] = trans('char', key)
const cond = Jane.conditionals
const buff = Jane.buffs
const formula = Jane.formulas

function PassionDescription() {
  return (
    <>
      <GameDesc ns="char_Jane_gen" key18="basic.Passion.desc.0" />
      <div style={{ marginTop: 8 }}>
        <GameDesc ns="char_Jane_gen" key18="basic.Passion.desc.1" />
      </div>
    </>
  )
}

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Jane_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns="char_Jane_gen"
          key18="ability.desc.1"
          from="Jane's <ct color=#F0D12B>Physical Anomaly Buildup Rate</ct> is increased by"
          to="20%"
        />
      </AbilityBodyText>
    </>
  )
}

function CoreGnawedDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDescSlice
        ns="char_Jane_gen"
        key18={`core.desc.${coreLevel}`}
        from="<ct color=#F0D12B>Assault</ct> DMG has a chance to trigger a critical hit"
        to="CRIT DMG of 50%"
      />
      <div style={{ marginTop: 8 }}>
        <GameDescSlice
          ns="char_Jane_gen"
          key18={`core.desc.${coreLevel}`}
          from="Each point of Jane's Anomaly Proficiency"
          to="%</ct>."
          toExact
        />
      </div>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_Jane_gen"
          key18="mindscapes.2.desc"
          from="Additionally, when <ct color=#F0D12B>Assault</ct> DMG triggers a critical hit"
          to="50%"
        />
      </PrefixedLine>
    </>
  )
}

function M1Description() {
  return (
    <GameDescSlice
      ns="char_Jane_gen"
      key18="mindscapes.1.desc"
      from="While in the <ct color=#FFFFFF>Passion</ct> state, Jane's <ct color=#F0D12B>Physical Anomaly Buildup Rate</ct> increases by an extra 15%"
      to="30%"
    />
  )
}

function M2DefDescription() {
  return (
    <GameDescSlice
      ns="char_Jane_gen"
      key18="mindscapes.2.desc"
      from="When Jane's attack hits an enemy in the <ct color=#FFFFFF>Gnawed</ct> state"
      to="15% of the enemy's DEF is ignored"
    />
  )
}

function M4Description() {
  return <GameDesc ns="char_Jane_gen" key18="mindscapes.4.desc" />
}

function M6PassionDescription() {
  return (
    <GameDescSlice
      ns="char_Jane_gen"
      key18="mindscapes.6.desc"
      from="While in the <ct color=#FFFFFF>Passion</ct> state, Jane's CRIT Rate increases by"
      to="40%"
    />
  )
}

function M6AdditionalDescription() {
  return (
    <GameDescSlice
      ns="char_Jane_gen"
      key18="mindscapes.6.desc"
      from="After any squad member inflicts <ct color=#F0D12B>Assault</ct>"
      to="1,600%"
    />
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      Passion: [
        {
          type: 'conditional',
          conditional: {
            label: ch('passionCond'),
            description: <PassionDescription />,
            metadata: cond.passion,
            fields: [fieldForBuff(buff.passion_atk)],
            linked: ['m1_passion', 'm6_passion'],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreGnawedCond'),
        description: <CoreGnawedDescription />,
        metadata: cond.core_gnawed,
        linked: ['m2_gnawed'],
        fields: [
          fieldForBuff(buff.core_assault_crit_),
          fieldForBuff(buff.core_assault_crit_dmg_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [fieldForBuff(buff.ability_physical_anomBuildup_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityEnemyAnomalyCond'),
        description: (
          <>
            <GameDesc ns="char_Jane_gen" key18="ability.desc.0" />
            <div style={{ marginTop: 8 }}>
              <AbilityBodyText characterKey={key}>
                <GameDescSlice
                  ns="char_Jane_gen"
                  key18="ability.desc.1"
                  from="When the enemy is already suffering from an Attribute Anomaly"
                  to="15%"
                />
              </AbilityBodyText>
            </div>
          </>
        ),
        metadata: cond.enemy_anomaly,
        fields: [fieldForBuff(buff.ability_additional_physical_anomBuildup_)],
      },
    },
  ],
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      description: <GameDesc ns="char_Jane_gen" key18="potential.desc.6" />,
      fields: [fieldForBuff(buff.potential_assault_crit_dmg_)],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1PassionCond'),
        description: <M1Description />,
        metadata: cond.m1_passion,
        fields: [
          fieldForBuff(buff.m1_physical_anomBuildup_),
          fieldForBuff(buff.m1_common_dmg_),
        ],
        linked: ['passion', 'm6_passion'],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2GnawedCond'),
        description: <M2DefDescription />,
        metadata: cond.m2_gnawed,
        linked: ['core_gnawed'],
        fields: [
          fieldForBuff(buff.m2_defIgn_),
          fieldForBuff(buff.m2_assault_defIgn_),
        ],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <M4Description />,
        metadata: cond.assault_or_disorder_triggered,
        fields: [fieldForBuff(buff.m4_anomaly_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6PassionCond'),
        description: <M6PassionDescription />,
        metadata: cond.m6_passion,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
        linked: ['passion', 'm1_passion'],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: <M6AdditionalDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_additional_dmg.tag)}>
              {ch('m6_additional_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
