import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Caesar } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { st, trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'

const key: CharacterKey = 'Caesar'
const [, ch] = trans('char', key)
const cond = Caesar.conditionals
const buff = Caesar.buffs
const formula = Caesar.formulas
const dm = mappedStats.char[key]

function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const mindscape = useEffectiveMindscape(key)
  const ns = `char_${key}_gen`
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={`core.desc.${coreLevel}.0`}
        from="When Caesar activates"
        to="will not exceed the shield value"
      />
      <GameDescSlice
        ns={ns}
        key18={`core.desc.${coreLevel}.2`}
        from="While <ct color=#FFFFFF>Radiant Aegis</ct> is active, the shield bearer's ATK is increased by"
        to="5s"
      />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="While <ct color=#FFFFFF>Radiant Aegis</ct> from"
          to="is active"
          toExact
        />
        {', '}
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="the shield bearer's ATK boost is increased to"
          to="original value"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      StanceSwitch: [
        {
          type: 'conditional',
          conditional: {
            label: ch('stanceSwitchCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Caesar_gen"
                key18="special.StanceSwitch.desc"
              />
            ),
            metadata: cond.stance_switch,
            fields: [fieldForBuff(buff.stance_switch_impact_)],
          },
        },
      ],
    },
    chain: {
      UltimateSavageSmash: [
        {
          type: 'conditional',
          conditional: {
            label: ch('ultCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Caesar_gen"
                key18="chain.UltimateSavageSmash.desc"
              />
            ),
            metadata: cond.enemy_shielded,
            fields: [fieldForBuff(buff.ult_dazeInc_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_shield_header') },
      fields: [
        {
          title: st('shield'),
          fieldRef: formula.core_shield.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreDescription />,
        metadata: cond.core_radiant_aegis,
        fields: [fieldForBuff(buff.core_atk)],
        linked: ['m1_radiant_aegis', 'm2_radiant_aegis'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityTeamCond'),
        description: <GameDesc ns="char_Caesar_gen" key18="ability.desc.0" />,
        metadata: cond.can_defensive_assist,
        section: 'ability',
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Caesar_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        ),
        metadata: cond.ability_debuff,
        fields: [fieldForBuff(buff.ability_dmgInc_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1RadiantAegisCond'),
        description: (
          <GameDesc ns="char_Caesar_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.m1_radiant_aegis,
        fields: [fieldForBuff(buff.m1_resRed_)],
        linked: ['core_radiant_aegis', 'm2_radiant_aegis'],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2RadiantAegisCond'),
        description: (
          <GameDescSlice
            ns="char_Caesar_gen"
            key18="mindscapes.2.desc"
            from="While <ct color=#FFFFFF>Radiant Aegis</ct> from"
            to="increases by 10%"
            toExact
          />
        ),
        metadata: cond.m2_radiant_aegis,
        linked: ['core_radiant_aegis', 'm1_radiant_aegis'],
        fields: [
          fieldForBuff(buff.m2_enerRegen_),
          {
            title: ch('m2_atkInc_'),
            fieldValue: dm.m2.atk_increase_ * 100,
            unit: '%',
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      description: (
        <GameDescSlice
          ns="char_Caesar_gen"
          key18="mindscapes.6.desc"
          from="<ct color=#FFFFFF>EX Special Attack: Overpowered Shield Bash</ct> and <ct color=#FFFFFF>Assist Follow-Up: Aiding Blade</ct> are guaranteed"
          to="primary target"
        />
      ),
      fields: [
        {
          title: ch('m6_exSpecial_crit_'),
          fieldRef: buff.m6_exSpecial_crit_.tag,
        },
        {
          title: ch('m6_assistFollowup_crit_'),
          fieldRef: buff.m6_assistFollowup_crit_.tag,
        },
        {
          title: ch('m6_exSpecial_dmg_'),
          fieldRef: buff.m6_exSpecial_dmg_.tag,
        },
        {
          title: ch('m6_assistFollowup_dmg_'),
          fieldRef: buff.m6_assistFollowup_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_Caesar_gen"
            key18="mindscapes.6.desc"
            from="When Caesar uses <ct color=#FFFFFF>EX Special Attack: Overpowered Shield Bash</ct> or <ct color=#FFFFFF>Assist Follow-Up: Aiding Blade</ct>, her CRIT Rate"
            to="15s"
          />
        ),
        metadata: cond.exSpecial_assistFollowup_used,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
      },
    },
  ],
})

export default sheet
