import type { NumNode } from '@zenless-optimizer/pando/engine'
import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customDmg,
  notOwnBuff,
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

const key: CharacterKey = 'Seed'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const {
  directStrike,
  onslaught_atk,
  besiege,
  besiege_defIgn,
  besiege_ult_dmg,
} = allBoolConditionals(key, undefined, {
  besiege_defIgn: 2,
  besiege_ult_dmg: 4,
})
const { energy_consumed } = allNumConditionals(
  key,
  true,
  0,
  dm.m2.max_energy_consumed - dm.m2.energy_consumed
)

const abilityCheck = (node: NumNode | number) =>
  cmpGE(team.common.count.withSpecialty('attack'), 2, node)

const ability_basic_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  abilityCheck(percent(dm.ability.basic_ult_dmg_))
)
const ability_basic_electric_resIgn_ =
  ownBuff.combat.resIgn_.electric.addWithDmgType(
    'basic',
    abilityCheck(percent(dm.ability.electric_resIgn_))
  )
const m1_basic_crit_dmg_ = ownBuff.combat.crit_dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 1, percent(dm.m1.basic_crit_dmg_))
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic Attack Chrysanthemum 1-2 hits are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackChrysanthemumWheelDance',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackChrysanthemumWheelDance',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dash Attack is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackMagneticWheelDance',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFallingPetalsSlaughter',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...ability_basic_dmg_,
      ...ability_basic_electric_resIgn_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFallingPetalsDownfallFirstForm',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...ability_basic_dmg_,
      ...ability_basic_electric_resIgn_,
      ...m1_basic_crit_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFallingPetalsDownfallSecondForm',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...ability_basic_dmg_,
      ...ability_basic_electric_resIgn_,
      ...m1_basic_crit_dmg_
    )
  ),

  ...customDmg(
    'm6_dmg',
    { damageType1: 'elemental' },
    cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.dmg)))
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
  registerBuff(
    'core_atk',
    ownBuff.combat.atk.add(
      onslaught_atk.ifOn(subscript(char.core, dm.core.onslaught_atk))
    )
  ),
  registerBuff(
    'core_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      onslaught_atk.ifOn(
        percent(subscript(char.core, dm.core.onslaught_crit_dmg_))
      )
    )
  ),
  registerBuff(
    'core_vanguard_atk',
    notOwnBuff.combat.atk.add(
      directStrike.ifOn(subscript(char.core, dm.core.direct_strike_atk))
    ),
    undefined,
    true
  ),
  registerBuff(
    'core_vanguard_crit_dmg_',
    notOwnBuff.combat.crit_dmg_.add(
      directStrike.ifOn(
        percent(subscript(char.core, dm.core.direct_strike_crit_dmg_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'core_dmg_',
    ownBuff.combat.common_dmg_.add(
      besiege.ifOn(percent(subscript(char.core, dm.core.dmg_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_basic_dmg_',
    ability_basic_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_basic_electric_resIgn_',
    ability_basic_electric_resIgn_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_ult_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'ult',
      abilityCheck(percent(dm.ability.basic_ult_dmg_))
    )
  ),
  registerBuff(
    'ability_ult_electric_resIgn_',
    ownBuff.combat.resIgn_.electric.addWithDmgType(
      'ult',
      abilityCheck(percent(dm.ability.electric_resIgn_))
    )
  ),
  registerBuff(
    'm1_basic_crit_dmg_',
    m1_basic_crit_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_defIgn_',
    ownBuff.combat.defIgn_.add(
      cmpGE(
        char.mindscape,
        2,
        besiege_defIgn.ifOn(percent(dm.m2.besiege_defIgn_))
      )
    )
  ),
  registerBuff(
    'm2_vanguard_defIgn_',
    notOwnBuff.combat.defIgn_.add(
      cmpGE(
        char.mindscape,
        2,
        besiege_defIgn.ifOn(percent(dm.m2.besiege_defIgn_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_basic_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'basic',
      cmpGE(
        char.mindscape,
        2,
        prod(energy_consumed, percent(dm.m2.basic_dmg_), percent(0.2))
      )
    )
  ),
  registerBuff(
    'm4_ult_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'ult',
      cmpGE(char.mindscape, 4, besiege_ult_dmg.ifOn(percent(dm.m4.ult_dmg_)))
    )
  ),
  registerBuff(
    'm6_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(char.mindscape, 6, percent(dm.m6.crit_dmg_))
    )
  )
)
export default sheet
