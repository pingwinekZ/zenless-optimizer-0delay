import type { CharacterKey } from '../../../consts'
import { Caesar } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { st, trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'Caesar'
const [, ch] = trans('char', key)
const cond = Caesar.conditionals
const buff = Caesar.buffs
const formula = Caesar.formulas
const dm = mappedStats.char[key]

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
        description: <CoreGameDesc characterKey={key} />,
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
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <GameDesc ns="char_Caesar_gen" key18="ability.desc.1" />,
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
          <GameDesc ns="char_Caesar_gen" key18="mindscapes.2.desc" />
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
      fields: [
        {
          title: ch('m6_exSpecial_assistFollowup_crit_'),
          fieldRef: buff.m6_exSpecial_assistFollowup_crit_.tag,
        },
        {
          title: ch('m6_dmg_'),
          fieldRef: buff.m6_dmg_.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Caesar_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.exSpecial_assistFollowup_used,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
      },
    },
  ],
})

export default sheet
