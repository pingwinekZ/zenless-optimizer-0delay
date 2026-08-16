import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
  min,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customDmg,
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

const key: CharacterKey = 'Sigrid'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

// Conditionals
const { patrolActive, tempered, contaminationActive, patrolActiveM4 } =
  allBoolConditionals(key, undefined, {
    patrolActiveM4: 4,
  })

// Additional Ability: Support or Stun character in squad
const abilityOn = (node: number | NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('support'),
      team.common.count.withSpecialty('stun')
    ),
    1,
    node
  )

// Core Passive: Aerial Patrol Spear → CRIT Rate (33% → 66% by core level)
const core_patrol_crit_ = ownBuff.combat.crit_.add(
  patrolActive.ifOn(percent(subscript(char.core, dm.core.patrolCrit_)))
)

// Additional Ability: flat ATK (120 base, +12/level, capped at 840)
const ability_atk = ownBuff.combat.atk.add(
  abilityOn(
    min(
      dm.ability.maxAtk,
      sum(dm.ability.baseAtk, prod(char.lvl, dm.ability.atkPerLevel))
    )
  )
)

// Additional Ability: DMG vs Contamination state enemies
const ability_contamination_dmg_ = ownBuff.combat.common_dmg_.add(
  abilityOn(contaminationActive.ifOn(percent(dm.ability.contaminationDmg_)))
)

// M1: ATK +25%
const m1_atk_ = ownBuff.combat.atk_.add(
  cmpGE(char.mindscape, 1, percent(dm.m1.atk_))
)

// M1: extra Ice DMG on the next Converging Spear final hit when over-capped
const m1_overCapValue = cmpGE(
  char.mindscape,
  1,
  percent(dm.m1.overCapConvergeSpearDmg)
)

// M2: PEN Ratio for Unbridled Spear attacks and Converging Spear (per-skill)
const m2_pen = cmpGE(char.mindscape, 2, percent(dm.m2.pen_))
const m2_frostTipped_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_convergeSpear1_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_convergeSpear2_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_convergeSpear3_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_dodgeCounter_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_scatteredJade_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_shatteredJade_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_chain_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_ult_pen_ = ownBuff.combat.pen_.add(m2_pen)
const m2_assistFollowUp_pen_ = ownBuff.combat.pen_.add(m2_pen)

// Chain Attack: Tempered → +20% Converging Spear DMG
const tempered_convergeSpear_dmg_ = ownBuff.combat.common_dmg_.add(
  tempered.ifOn(percent(0.2))
)

// M4: DMG while in Aerial Patrol Spear
const m4_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 4, patrolActiveM4.ifOn(percent(dm.m4.patrolDmg_)))
)

// M6: Converging Spear stage final hits deal extra Ice DMG (80%/90%/100% ATK)
const m6_convergeSpear1Value = cmpGE(
  char.mindscape,
  6,
  percent(dm.m6.convergeSpear1ExtraDmg)
)
const m6_convergeSpear2Value = cmpGE(
  char.mindscape,
  6,
  percent(dm.m6.convergeSpear2ExtraDmg)
)
const m6_convergeSpear3Value = cmpGE(
  char.mindscape,
  6,
  percent(dm.m6.convergeSpear3ExtraDmg)
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Dash Attack: Windchase deals Physical DMG
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackWindchase',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Unbridled Spear attacks get M2 PEN (4th hit of Frost-Tipped Spear)
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFrostTippedSpear',
      3,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m2_frostTipped_pen_
    ),
    // Converging Spear stages get M2 PEN + Tempered DMG
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackConvergingSpear1stStage',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m2_convergeSpear1_pen_,
      tempered_convergeSpear_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackConvergingSpear2ndStage',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m2_convergeSpear2_pen_,
      tempered_convergeSpear_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackConvergingSpear3rdStage',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m2_convergeSpear3_pen_,
      tempered_convergeSpear_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DodgeCounterCounterthrust',
      0,
      { ...baseTag, damageType1: 'dodgeCounter' },
      'atk',
      undefined,
      m2_dodgeCounter_pen_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackScatteredJade',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk',
      undefined,
      m2_scatteredJade_pen_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackShatteredJade',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk',
      undefined,
      m2_shatteredJade_pen_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackEncroachingIce',
      0,
      { ...baseTag, damageType1: 'chain' },
      'atk',
      undefined,
      m2_chain_pen_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateFrozenHeavens',
      0,
      { ...baseTag, damageType1: 'ult' },
      'atk',
      undefined,
      m2_ult_pen_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'assist',
      'AssistFollowUpDevouringFrost',
      0,
      { ...baseTag, damageType1: 'assistFollowUp' },
      'atk',
      undefined,
      m2_assistFollowUp_pen_
    )
  ),

  // M1: over-cap Converging Spear extra hit
  ...customDmg(
    'm1_overCap_dmg_',
    { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
    prod(own.final.atk, m1_overCapValue)
  ),

  // M6: Converging Spear stage final hit extras
  ...customDmg(
    'm6_convergeSpear1_dmg_',
    { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
    prod(own.final.atk, m6_convergeSpear1Value)
  ),
  ...customDmg(
    'm6_convergeSpear2_dmg_',
    { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
    prod(own.final.atk, m6_convergeSpear2Value)
  ),
  ...customDmg(
    'm6_convergeSpear3_dmg_',
    { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
    prod(own.final.atk, m6_convergeSpear3Value)
  ),

  // Buffs
  registerBuff('core_patrol_crit_', core_patrol_crit_),
  registerBuff('ability_atk', ability_atk),
  registerBuff('ability_contamination_dmg_', ability_contamination_dmg_),
  registerBuff('m1_atk_', m1_atk_),
  registerBuff(
    'm1_overCap_dmg_',
    ownBuff.combat.dmg_.ice.add(m1_overCapValue),
    undefined,
    undefined,
    false
  ),
  // M2 per-skill PEN (applied via dmgDazeAndAnomOverride extras)
  registerBuff(
    'm2_frostTipped_pen_',
    m2_frostTipped_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_convergeSpear1_pen_',
    m2_convergeSpear1_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_convergeSpear2_pen_',
    m2_convergeSpear2_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_convergeSpear3_pen_',
    m2_convergeSpear3_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_dodgeCounter_pen_',
    m2_dodgeCounter_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_scatteredJade_pen_',
    m2_scatteredJade_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_shatteredJade_pen_',
    m2_shatteredJade_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m2_chain_pen_', m2_chain_pen_, undefined, undefined, false),
  registerBuff('m2_ult_pen_', m2_ult_pen_, undefined, undefined, false),
  registerBuff(
    'm2_assistFollowUp_pen_',
    m2_assistFollowUp_pen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'tempered_convergeSpear_dmg_',
    tempered_convergeSpear_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m4_dmg_', m4_dmg_),
  registerBuff(
    'm6_convergeSpear1_dmg_',
    ownBuff.combat.dmg_.ice.add(m6_convergeSpear1Value),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_convergeSpear2_dmg_',
    ownBuff.combat.dmg_.ice.add(m6_convergeSpear2Value),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_convergeSpear3_dmg_',
    ownBuff.combat.dmg_.ice.add(m6_convergeSpear3Value),
    undefined,
    undefined,
    false
  )
)
export default sheet
