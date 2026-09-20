import {
  cmpEq,
  cmpGE,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  target,
  team,
  teamBuff,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Koleda'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { quick_use, furnace_fire } = allBoolConditionals(key, undefined, {
  quick_use: 1,
})
const { exSpecial_debuff } = allNumConditionals(key, true, 0, dm.ability.stacks)
const { charge } = allNumConditionals(key, true, 0, dm.m4.stacks, undefined, {
  charge: 4,
})

const core_exSpecial_dazeInc_ = ownBuff.combat.dazeInc_.addWithDmgType(
  'exSpecial',
  percent(subscript(char.core, dm.core.dazeInc_))
)
const core_basic_dazeInc_ = ownBuff.combat.dazeInc_.addWithDmgType(
  'basic',
  percent(subscript(char.core, dm.core.dazeInc_))
)

// Additional Ability trigger: another squad member is a Rupture or Armorer
// character or shares the same Attribute or Faction. Display-only marker so
// the sheet can dim the ability description on the trigger alone, independent
// of the EX Special debuff stack count (mirrors Lighter's `ability_active`).
const ability_trigger_met = cmpGE(
  sum(
    team.common.count.fire,
    team.common.count.withFaction('BelebogHeavyIndustries'),
    team.common.count.withSpecialty('rupture'),
    team.common.count.withSpecialty('armorer')
  ),
  3,
  1
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic Attack 1-4 hits are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      2,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      3,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dash Attack is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackTremble',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Per-hit buffs — only Enhanced Basic (hits 4-6) get core basic daze
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      4,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...core_basic_dazeInc_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      5,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...core_basic_dazeInc_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSmashNBash',
      6,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...core_basic_dazeInc_
    )
  ),

  ...customDmg(
    'm6_dmg',
    { damageType1: 'elemental' },
    prod(own.final.atk, percent(dm.m6.dmg))
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'elemental',
      cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff('core_exSpecial_dazeInc_', core_exSpecial_dazeInc_),
  registerBuff(
    'core_basic_dazeInc_',
    core_basic_dazeInc_,
    undefined,
    undefined,
    false
  ),
  // Basic Attack: consuming Furnace Fire grants all Agents 35% more damage
  // for 40s. No data in dm (static text value).
  registerBuff(
    'basic_common_dmg_',
    teamBuff.combat.common_dmg_.add(furnace_fire.ifOn(percent(0.35))),
    undefined,
    true
  ),
  registerBuff(
    'ability_chain_dmg_',
    teamBuff.combat.dmg_.addWithDmgType(
      'chain',
      cmpGE(
        sum(
          team.common.count.fire,
          team.common.count.withFaction('BelebogHeavyIndustries'),
          team.common.count.withSpecialty('rupture'),
          team.common.count.withSpecialty('armorer')
        ),
        3,
        prod(exSpecial_debuff, percent(dm.ability.chain_dmg_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_active',
    teamBuff.combat.dmg_.fire.add(ability_trigger_met),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm1_special_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType(
      'special',
      cmpGE(char.mindscape, 1, quick_use.ifOn(percent(dm.m1.dazeInc_)))
    )
  ),
  registerBuff(
    'm1_exSpecial_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType(
      'exSpecial',
      cmpGE(char.mindscape, 1, quick_use.ifOn(percent(dm.m1.dazeInc_)))
    )
  ),
  registerBuff(
    'm4_chain_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'chain',
      cmpGE(char.mindscape, 4, prod(charge, percent(dm.m4.chain_ult_dmg_)))
    )
  ),
  registerBuff(
    'm4_ult_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'ult',
      cmpGE(char.mindscape, 4, prod(charge, percent(dm.m4.chain_ult_dmg_)))
    )
  ),
  registerBuff(
    'potential_laceration_dmg_',
    teamBuff.combat.laceration_dmg_.add(
      cmpEq(
        target.char.specialty,
        'armorer',
        percent(dm.potential.laceration_dmg_[6])
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'potential_crit_dmg_',
    teamBuff.combat.crit_dmg_.add(
      cmpEq(
        target.char.specialty,
        'armorer',
        percent(0),
        percent(dm.potential.crit_dmg_[6])
      )
    ),
    undefined,
    true
  )
)
export default sheet
