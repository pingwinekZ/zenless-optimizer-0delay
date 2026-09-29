import {
  cmpGE,
  constant,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customSheerDmg,
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

const { cpCritDmg, m1PhysResIgn, turbo } = allBoolConditionals(key, undefined, {
  m1PhysResIgn: 1,
  turbo: 2,
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
const { brilliant_stacks } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.maxStacksConsumed,
  undefined,
  { brilliant_stacks: 6 }
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

const ability_basic_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'basic',
  ability_dmg
)
const ability_chain_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'chain',
  ability_dmg
)
const ability_ult_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'ult',
  ability_dmg
)
const ability_exSpecial_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'exSpecial',
  ability_dmg
)

const m2_basic_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)
const m2_ult_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)
const m2_exSpecial_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 2, dm.m2.dmg_)
)
// Turbocharged: the follow-up Cool Wheelie's CRIT DMG. Skill-scoped to Cool
// Wheelie only (see the override below).
const m2_turbo_crit_dmg_ = ownBuff.combat.crit_dmg_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 2, turbo.ifOn(percent(dm.m2.turboCritDmg)))
)

const core_critDmg = cpCritDmg.ifOn(subscript(char.core, dm.core.critDmgPerUse))
const core_hpSheerForce = prod(
  own.final.hp,
  constant(dm.core.sheerForcePerHp[0])
)

const m6_basic_sheer_ = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 6, dm.m6.sheerDmg_)
)
const m6_ult_sheer_ = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 6, dm.m6.sheerDmg_)
)

const sheet = register(
  key,
  entriesForChar(data_gen),
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Ability + M2 + M6 (sheer): Full-Throttle Starlight, Ultimate
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFullThrottleStarlight',
      0,
      { ...baseTag, damageType1: 'basic' },
      'sheerForce',
      undefined,
      ...ability_basic_dmg_,
      ...m2_basic_dmg_,
      ...m6_basic_sheer_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateStarlightKnightFlyingKick',
      0,
      { ...baseTag, damageType1: 'ult' },
      'sheerForce',
      undefined,
      ...ability_ult_dmg_,
      ...m2_ult_dmg_,
      ...m6_ult_sheer_
    ),
    // Ability + M2 (+Turbocharged CRIT DMG): EX Special Cool Wheelie
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackCoolWheelie',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ...ability_exSpecial_dmg_,
      ...m2_exSpecial_dmg_,
      ...m2_turbo_crit_dmg_
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
      ...ability_exSpecial_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackRockingFootwork',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ...ability_exSpecial_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackKnightsSwagger',
      0,
      { ...baseTag, damageType1: 'chain' },
      'sheerForce',
      undefined,
      ...ability_chain_dmg_
    )
  ),

  // M6 Brilliant Starlight: each consumed stack deals 100% Sheer Force as
  // additional Physical DMG on the Ult / Full-Throttle Starlight hit (both
  // are single-hit, so the bonus lands on hit 0). The 'elemental' type
  // matches no hit (Yixuan/Banyue precedent), so skill-scoped DMG% buffs
  // do not apply to this instance.
  ...customSheerDmg(
    'm6_brilliant_dmg',
    { ...baseTag, damageType1: 'elemental' },
    cmpGE(
      char.mindscape,
      6,
      prod(
        own.final.sheerForce,
        brilliant_stacks,
        constant(dm.m6.sheerPerStack)
      )
    )
  ),

  registerBuff(
    'ability_basic_dmg_',
    ability_basic_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_chain_dmg_',
    ability_chain_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_ult_dmg_',
    ability_ult_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_exSpecial_dmg_',
    ability_exSpecial_dmg_,
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
  registerBuff('m2_basic_dmg_', m2_basic_dmg_, undefined, undefined, false),
  registerBuff('m2_ult_dmg_', m2_ult_dmg_, undefined, undefined, false),
  registerBuff(
    'm2_exSpecial_dmg_',
    m2_exSpecial_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_turbo_crit_dmg_',
    m2_turbo_crit_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_basic_sheer_', m6_basic_sheer_, undefined, undefined, false),
  registerBuff('m6_ult_sheer_', m6_ult_sheer_, undefined, undefined, false),
  // Display-only pair for the sheer-damage instance above: the sheet display
  // filter drops fields whose name is missing from the buffs listing, so the
  // instance needs a matching registerBuff (Seed §1.6 pattern, Banyue
  // precedent). The 'elemental' type matches no hit and
  // includeOriginalEntry: false keeps it from ever applying.
  registerBuff(
    'm6_brilliant_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'elemental',
      cmpGE(
        char.mindscape,
        6,
        prod(brilliant_stacks, constant(dm.m6.sheerPerStack))
      )
    ),
    undefined,
    undefined,
    false
  )
)
export default sheet
