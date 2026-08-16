import type { CharacterKey } from '../../../consts'
import { Ellen } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'

const key: CharacterKey = 'Ellen'
const [, ch] = trans('char', key)
const cond = Ellen.conditionals
const buff = Ellen.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        fieldForBuff(buff.core_basic_crit_dmg_),
        fieldForBuff(buff.core_dash_crit_dmg_),
        fieldForBuff(buff.core_chain_crit_dmg_),
        fieldForBuff(buff.core_ult_crit_dmg_),
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityIceAttacksCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="ability.desc"
          />
        ),
        metadata: cond.ability_ice_attacks,
        linked: ['potential_ice_attacks'],
        fields: [fieldForBuff(buff.ability_ice_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('potentialIceAttacksCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="potential.desc"
          />
        ),
        metadata: cond.potential_ice_attacks,
        linked: ['ability_ice_attacks'],
        fields: [
          fieldForBuff(buff.ability_crit_dmg_),
          fieldForBuff(buff.ability_ice_resIgn_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="mindscapes.1.desc"
          />
        ),
        metadata: cond.flash_freeze_consumed,
        fields: [fieldForBuff(buff.m1_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="mindscapes.2.desc"
          />
        ),
        metadata: cond.flash_freeze,
        fields: [fieldForBuff(buff.m2_exSpecial_crit_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="mindscapes.6.desc"
          />
        ),
        metadata: cond.exSpecial_chain_quickCharge,
        fields: [fieldForBuff(buff.m6_pen_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond2'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Ellen_gen"
            key18="mindscapes.6.desc"
          />
        ),
        metadata: cond.feast_begins,
        fields: [fieldForBuff(buff.m6_dash_mv_mult_)],
      },
    },
  ],
})

export default sheet
