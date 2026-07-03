import {
  cmpGE,
  constant,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'StarlightBilly'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { cpCritDmg, m1PhysResIgn } = allBoolConditionals(key, undefined, {
  m1PhysResIgn: 1,
})
const { starlightStacks } = allNumConditionals(
  key,
  true,
  0,
  dm.ability.starlightMaxStacks
)
const { m4CritDmgStacks } = allNumConditionals(
  key,
  true,
  0,
  dm.m4.maxStacks,
  undefined,
  { m4CritDmgStacks: 4 }
)

const ability_dmg = cmpGE(
  sum(
    team.common.count.withSpecialty('stun'),
    team.common.count.withSpecialty('defense'),
    team.common.count.withSpecialty('support')
  ),
  1,
  percent(prod(starlightStacks, constant(dm.ability.starlightDmgPerStack)))
)

const ability_basic_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'basic',
  ability_dmg
)
const ability_chain_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'chain',
  ability_dmg
)
const ability_ult_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'ult',
  ability_dmg
)
const ability_exSpecial_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'exSpecial',
  ability_dmg
)

const m2_basic_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)
const m2_ult_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)
const m2_exSpecial_dmg = ownBuff.combat.common_dmg_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)

const core_critDmg = cpCritDmg.ifOn(subscript(char.core, dm.core.critDmgPerUse))
const core_hpSheerForce = prod(
  own.final.hp,
  constant(dm.core.sheerForcePerHp[0])
)

// M2 + Ability + M6 (as sheer_dmg_) combined for Full-Throttle Starlight and Ultimate
const m2_ability_m6 = ownBuff.combat.common_dmg_.add(
  sum(ability_dmg, cmpGE(char.mindscape, 2, dm.m2.dmg_))
)
const m6_sheer = ownBuff.combat.sheer_dmg_.add(
  cmpGE(char.mindscape, 6, dm.m6.sheerDmg_)
)
const m6_basic_sheer = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 6, dm.m6.sheerDmg_)
)
const m6_ult_sheer = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 6, dm.m6.sheerDmg_)
)

// M2 + Ability for EX Special Cool Wheelie
const m2_plus_ability = ownBuff.combat.common_dmg_.add(
  sum(ability_dmg, cmpGE(char.mindscape, 2, dm.m2.dmg_))
)

const sheet = register(
  key,
  entriesForChar(data_gen),
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // M2 + Ability + M6 (sheer): Full-Throttle Starlight, Ultimate
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFullThrottleStarlight',
      0,
      { ...baseTag, damageType1: 'basic' },
      'sheerForce',
      undefined,
      m2_ability_m6,
      m6_sheer
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateStarlightKnightFlyingKick',
      0,
      { ...baseTag, damageType1: 'ult' },
      'sheerForce',
      undefined,
      m2_ability_m6,
      m6_sheer
    ),
    // M2 + Ability (no M6): EX Special Cool Wheelie
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackCoolWheelie',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      m2_plus_ability
    ),
    // Ability-only (no M2/M6): other EX Specials and Chain Attack
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackHighTractionWheels',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ownBuff.combat.common_dmg_.add(ability_dmg)
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackRockingFootwork',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ownBuff.combat.common_dmg_.add(ability_dmg)
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackKnightsSwagger',
      0,
      { ...baseTag, damageType1: 'chain' },
      'sheerForce',
      undefined,
      ownBuff.combat.common_dmg_.add(ability_dmg)
    )
  ),

  registerBuff(
    'ability_basic_dmg_',
    ability_basic_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_chain_dmg_',
    ability_chain_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_ult_dmg_',
    ability_ult_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_exSpecial_dmg_',
    ability_exSpecial_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff('core_critDmg', ownBuff.combat.crit_dmg_.add(core_critDmg)),
  registerBuff(
    'core_hpSheerForce',
    ownBuff.initial.sheerForce.add(core_hpSheerForce)
  ),
  registerBuff(
    'm1_physResIgn',
    ownBuff.combat.resIgn_.physical.add(
      cmpGE(char.mindscape, 1, m1PhysResIgn.ifOn(percent(dm.m1.physResIgn)))
    )
  ),
  registerBuff(
    'm4_critDmg',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(
        char.mindscape,
        4,
        percent(prod(m4CritDmgStacks, constant(dm.m4.critDmgPerUse)))
      )
    )
  ),
  registerBuff('m2_basic_dmg_', m2_basic_dmg, undefined, undefined, false),
  registerBuff('m2_ult_dmg_', m2_ult_dmg, undefined, undefined, false),
  registerBuff(
    'm2_exSpecial_dmg_',
    m2_exSpecial_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_basic_sheer_', m6_basic_sheer, undefined, undefined, false),
  registerBuff('m6_ult_sheer_', m6_ult_sheer, undefined, undefined, false)
)
export default sheet
