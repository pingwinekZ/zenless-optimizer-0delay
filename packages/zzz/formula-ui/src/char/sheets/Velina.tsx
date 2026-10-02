import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { Velina } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Velina'
const ns = 'char_Velina_gen'
const [, ch] = trans('char', key)
const cond = Velina.conditionals
const buff = Velina.buffs
const formula = Velina.formulas

function useCoreKey(paragraph: number) {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return `core.desc.${coreLevel}.${paragraph}`
}

function CoreWindbiteDescription() {
  const key18 = useCoreKey(2)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="When Velina has 2 points"
      to="which does not grant <ct color=#FFFFFF>Windbite</ct>."
    />
  )
}

function CoreSweepingResDescription() {
  const key18 = useCoreKey(3)
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={key18}
        from="When <ct color=#FFFFFF>Sweeping Cyclone</ct> hits an enemy, the enemy's"
        to="is also reduced by 7% for 35s. Repeated triggers reset the duration."
        toExact
      />
      <AbilityBodyText characterKey={key}>
        AA:{' '}
        <GameDescSlice
          ns={ns}
          key18="ability.desc.2"
          from="For <ct color=#FFFFFF>Core Passive: Breeze in Bloom</ct>"
          to="further increased by 7%"
          toExact
        />
      </AbilityBodyText>
    </>
  )
}

function AbilityDmgDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18="ability.desc.1"
          from="Velina's <ct color=#A6C5FD>Windswept</ct>"
          to="increases by 10%."
        />
      </AbilityBodyText>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="The DMG increase effects"
          to="further increased by 15%."
        />
      </PrefixedLine>
    </>
  )
}

function AbilityDazeDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        {ch('ability_daze_desc')}
      </AbilityBodyText>
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.1.desc"
          from="<ct color=#FFFFFF>Sweeping Cyclone</ct> from"
          to="deals an additional 20% Daze."
        />
      </PrefixedLine>
    </>
  )
}

function AbilityBuildupDescription() {
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        {ch('ability_buildup_desc')}
      </AbilityBodyText>
    </>
  )
}

function AbilityAbloomDescription() {
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18="ability.desc.1"
          from="When the heavy attack"
          to="Wind Attribute Anomaly DMG</ct>."
        />
      </AbilityBodyText>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_dmg_') },
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      fields: [
        fieldForBuff(buff.core_common_dmg_),
        fieldForBuff(buff.core_anomMas),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreWindbiteCond'),
        description: <CoreWindbiteDescription />,
        metadata: cond.windbiteVortex,
        fields: [fieldForBuff(buff.core_windbite_vortex_dmg_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreSweepingResCond'),
        description: <CoreSweepingResDescription />,
        metadata: cond.sweepingCycloneHit,
        fields: [fieldForBuff(buff.core_sweeping_anomBuildupRes_)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_abloom_header') },
      description: <CoreGameDesc characterKey={key} paragraph={5} />,
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(formula.core_condensed_abloom_dmg.tag)}
            >
              {ch('core_condensed_abloom_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_condensed_abloom_dmg.tag,
        },
        {
          title: (
            <ColorText color={getVariant(formula.core_sweeping_abloom_dmg.tag)}>
              {ch('core_sweeping_abloom_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_sweeping_abloom_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_dmg_header') },
      description: <AbilityDmgDescription />,
      fields: [
        fieldForBuff(buff.ability_wind_dmg_),
        fieldForBuff(buff.ability_vortex_dmg_),
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_daze_header') },
      description: <AbilityDazeDescription />,
      fields: [fieldForBuff(buff.ability_sweepingCyclone_dazeInc_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_buildup_header') },
      description: <AbilityBuildupDescription />,
      fields: [fieldForBuff(buff.ability_sweepingCyclone_anomBuildup_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_abloom_header') },
      description: <AbilityAbloomDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.ability_ult_abloom_dmg.tag)}>
              {ch('ability_ult_abloom_dmg')}
            </ColorText>
          ),
          fieldRef: formula.ability_ult_abloom_dmg.tag,
        },
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1VortexCond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.1.desc"
            from="When Velina triggers <ct color=#FFFFFF>Vortex</ct>"
            to="All-Attribute RES"
          />
        ),
        metadata: cond.vortexAllResIgn,
        fields: [fieldForBuff(buff.m1_all_resIgn_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1WindsweptCond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.1.desc"
            from="When squad members deal"
            to="is ignored."
          />
        ),
        metadata: cond.windsweptWindResIgn,
        fields: [fieldForBuff(buff.m1_wind_resIgn_)],
        targeted: true,
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.4.desc" />,
        metadata: cond.exSpecialAtk,
        fields: [fieldForBuff(buff.m4_atk_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6BuildupCond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.6.desc"
            from="When Velina hits an enemy suffering a <ct color=#A6C5FD>Wind Attribute Anomaly</ct>"
            to="increases by 20%."
          />
        ),
        metadata: cond.windAnomalyEnemy,
        fields: [fieldForBuff(buff.m6_wind_anomBuildup_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6RefreshCond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.6.desc"
            from="When Velina inflicts <ct color=#A6C5FD>Windswept</ct> on an enemy already affected by <ct color=#A6C5FD>Windswept</ct>"
            to="up to a maximum increase of 40%."
          />
        ),
        metadata: cond.windsweptRemaining,
        fields: [fieldForBuff(buff.m6_windswept_dmg_)],
      },
    },
  ],
})

export default sheet
