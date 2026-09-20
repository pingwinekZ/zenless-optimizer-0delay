import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { Claret } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { AbilityBodyText, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Claret'
const [, ch] = trans('char', key)
const cond = Claret.conditionals
const buff = Claret.buffs
const formula = Claret.formulas
const ns = 'char_Claret_gen'

function useCoreKey(paragraph: number) {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  return `core.desc.${coreLevel}.${paragraph}`
}

function CritPerCritDmgDescription() {
  const key18 = useCoreKey(1)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="For every 1% of Claret's initial CRIT DMG"
      to="0.35%"
      toExact
    />
  )
}

function CrimsonInscriptionDescription() {
  const key18 = useCoreKey(4)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="While Claret is in the Crimson Inscription state"
      to="Gash Buildup Rate increases by"
    />
  )
}

// Always-on part of the same effect: applies to Chain / Ultimate / Counter
// Assist / Assist Follow-Up even outside Crimson Inscription. While in
// Crimson Inscription (toggle below) it extends to all attacks.
function M2SkillDescription() {
  return (
    <GameDescSlice
      ns={ns}
      key18="mindscapes.2.desc"
      from="While Claret is in the Crimson Inscription state"
      to="Electric RES"
    />
  )
}

function PerfectDodgeDescription() {
  const key18 = useCoreKey(4)
  return (
    <GameDescSlice
      ns={ns}
      key18={key18}
      from="Triggering a Perfect Dodge"
      to="remainder of the skill"
    />
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_critPerCritDmg_header') },
      description: <CritPerCritDmgDescription />,
      fields: [fieldForBuff(buff.core_critPerCritDmg)],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('crimsonSkill_header') },
      description: <CrimsonInscriptionDescription />,
      fields: [
        fieldForBuff(buff.core_crimson_skill_crit_chain_),
        fieldForBuff(buff.core_crimson_skill_crit_ult_),
        fieldForBuff(buff.core_crimson_skill_crit_counterAssist_),
        fieldForBuff(buff.core_crimson_skill_crit_assistFollowUp_),
        fieldForBuff(buff.core_crimson_skill_gashBuildup_chain_),
        fieldForBuff(buff.core_crimson_skill_gashBuildup_ult_),
        fieldForBuff(buff.core_crimson_skill_gashBuildup_counterAssist_),
        fieldForBuff(buff.core_crimson_skill_gashBuildup_assistFollowUp_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('crimsonInscriptionCond'),
        description: <CrimsonInscriptionDescription />,
        metadata: cond.crimsonInscription,
        fields: [
          fieldForBuff(buff.core_crimson_crit_),
          fieldForBuff(buff.core_crimson_gashBuildup_),
        ],
        linked: ['m2_crimsonInscription'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('perfectDodgeCond'),
        description: <PerfectDodgeDescription />,
        metadata: cond.perfectDodge,
        fields: [
          {
            title: ch('perfectDodge_starforging'),
            fieldRef: buff.core_perfectDodge_starforging_dmg_.tag,
          },
          {
            title: ch('perfectDodge_subduingAxe'),
            fieldRef: buff.core_perfectDodge_subduingAxe_dmg_.tag,
          },
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('remnantEdgeCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns={ns} key18="ability.desc.2" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.remnantEdge,
        fields: [fieldForBuff(buff.ability_remnant_laceration_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_gashBuildup_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.1.desc"
          from="When Claret's attacks hit enemies and trigger Laceration"
          to="Gash Buildup Rate increases by 20%"
        />
      ),
      fields: [
        {
          title: ch('m1_gashBuildup_title'),
          fieldRef: buff.m1_gashBuildup_.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_maim_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.1.desc"
          from="The DMG Multiplier of Maim"
          to="130% of its original value"
        />
      ),
      fields: [
        {
          title: ch('m1_maim'),
          fieldRef:
            formula.SpecialAttackBloodbloomOathCleavingGoldAndIron_2_dmg.tag,
        },
        {
          title: ch('m1_maim_multiplier'),
          fieldRef: buff.m1_maim_mult_display_.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2Skill_header') },
      description: <M2SkillDescription />,
      fields: [
        fieldForBuff(buff.m2_skill_electric_resIgn_chain_),
        fieldForBuff(buff.m2_skill_electric_resIgn_ult_),
        fieldForBuff(buff.m2_skill_electric_resIgn_counterAssist_),
        fieldForBuff(buff.m2_skill_electric_resIgn_assistFollowUp_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <M2SkillDescription />,
        metadata: cond.m2_crimsonInscription,
        fields: [fieldForBuff(buff.m2_electric_resIgn_)],
        linked: ['crimsonInscription'],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.4.desc"
          from="DMG dealt by Basic Attack: Bloodbloom Oath - Starforging's 3rd hit"
          to="increases by 20%"
        />
      ),
      fields: [
        {
          title: ch('m4_starforging'),
          fieldRef: buff.m4_starforging_dmg_.tag,
        },
        {
          title: ch('m4_resonant'),
          fieldRef: buff.m4_resonant_dmg_.tag,
        },
        {
          title: ch('m4_trial'),
          fieldRef: buff.m4_trial_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
