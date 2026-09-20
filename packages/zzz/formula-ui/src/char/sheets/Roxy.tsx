import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { Roxy } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { AbilityBodyText, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Roxy'
const [, ch] = trans('char', key)
const cond = Roxy.conditionals
const buff = Roxy.buffs
const ns = 'char_Roxy_gen'

function useCoreKey(paragraph: number) {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return `core.desc.${coreLevel}.${paragraph}`
}

// Core p1: Energy Regen → ATK / Impact (single sentence, so the slice covers
// the whole paragraph regardless of per-level numbers).
// Note: `to` must be "</ct>." — ending at "0.4" would stop at the decimal
// point, since sliceBetween ends at the first "." after the marker.
function CoreRegenDescription() {
  const key18 = useCoreKey(1)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="When Roxy's initial"
      to="</ct>."
    />
  )
}

// Core p3: Contamination / Cleanse team buff (paragraph only).
function ContaminationSurgeDescription() {
  const key18 = useCoreKey(3)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="When any squad member triggers"
      to="repeated triggers reset the duration."
    />
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_regen_header') },
      description: <CoreRegenDescription />,
      fields: [
        fieldForBuff(buff.core_regen_atk),
        fieldForBuff(buff.core_regen_impact),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('contaminationSurgeCond'),
        description: <ContaminationSurgeDescription />,
        metadata: cond.contaminationSurge,
        fields: [
          fieldForBuff(buff.core_team_crit_dmg_),
          fieldForBuff(buff.core_team_laceration_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: (
        <>
          <GameDesc ns={ns} key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDescSlice
              ns={ns}
              key18="ability.desc.1"
              from="Roxy's DMG increases by"
              to="up to 80%."
            />
          </AbilityBodyText>
        </>
      ),
      fields: [fieldForBuff(buff.ability_self_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('ability_stun_header'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns={ns}
                key18="ability.desc.2"
                from="When any squad member's attack hits an enemy"
                to="once the Stun ends."
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.stunSurge,
        fields: [fieldForBuff(buff.ability_stun_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('windsweptCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns={ns}
                key18="ability.desc.3"
                from="While an enemy is in the"
                to="are increased by 8%."
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.windsweptVulnerability,
        fields: [fieldForBuff(buff.ability_windswept_dmgInc_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('exAnomalyCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDescSlice
                ns={ns}
                key18="ability.desc.6"
                from="When using an"
                to="Repeated triggers reset the duration."
              />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.exAnomalySurge,
        fields: [fieldForBuff(buff.ability_ex_anomBuildup_)],
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
            from="When"
            to="Repeated triggers reset the duration."
          />
        ),
        metadata: cond.m1ResShred,
        fields: [fieldForBuff(buff.m1_allResRed_)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_crit_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.1.desc"
          from="CRIT DMG increases by"
          to="40%."
        />
      ),
      fields: [fieldForBuff(buff.m1_crit_dmg_)],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_exDaze_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc.0"
          from="<ct color=#ffffff>EX Special Attack"
          to="more Daze."
        />
      ),
      fields: [fieldForBuff(buff.m2_ex_daze_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.2.desc.3"
            from="When"
            to="recovers from Stun."
          />
        ),
        metadata: cond.m2StunSurge,
        fields: [fieldForBuff(buff.m2_stun_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_ult_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.4.desc"
          from="<ct color=#ffffff>Ultimate: Requiem"
          to="10% more Daze."
        />
      ),
      fields: [
        {
          title: ch('m4_ult_dmg_'),
          fieldRef: buff.m4_ult_dmg_.tag,
        },
        {
          title: ch('m4_ult_daze_'),
          fieldRef: buff.m4_ult_daze_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_res_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc.0"
          from="The DMG dealt by attacks ignores"
          to="Wind RES"
        />
      ),
      fields: [fieldForBuff(buff.m6_wind_resIgn_)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m6Cond') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.6.desc.1"
          from="The DMG dealt by the"
          to="the Daze it inflicts increases by 20%."
        />
      ),
      fields: [
        {
          title: ch('m6_afterecho_mult_display_'),
          fieldRef: buff.m6_afterecho_mult_display_.tag,
        },
        {
          title: ch('m6_afterecho_daze_'),
          fieldRef: buff.m6_afterecho_daze_.tag,
        },
      ],
    },
  ],
})

export default sheet
