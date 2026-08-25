import {
  cmpGE,
  constant,
  max,
  min,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customAnomalyBuildup,
  customAnomalyDmg,
  customDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Burnice'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { exSpecial_active } = allBoolConditionals(key, undefined, {
  exSpecial_active: 6,
})
const { thermal_penetration } = allNumConditionals(
  key,
  true,
  0,
  dm.m2.stacks,
  undefined,
  { thermal_penetration: 2 }
)

const core_afterburn_dmg_ = ownBuff.combat.common_dmg_.add(
  min(
    percent(dm.core.max_afterburn_dmg_),
    prod(
      percent(1 / dm.core.anomProf_step),
      percent(dm.core.afterburn_dmg_),
      own.final.anomProf
    )
  )
)
const m6_fire_resIgn_ = ownBuff.combat.resIgn_.fire.add(
  cmpGE(
    char.mindscape,
    6,
    exSpecial_active.ifOn(dm.m6.exSpecial_specialAfterburn_burn_fire_resIgn_)
  )
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic Direct Flame Blend hit 2 is physical, hit 1 partially physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackDirectFlameBlend',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dodge Fluttering Steps is partially physical
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackMixedFlameBlend',
      0,
      {
        ...baseTag,
        damageType1: 'basic',
        skillType1: 'basicSkill',
        skillType2: 'assistSkill',
      },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackMixedFlameBlend',
      1,
      {
        ...baseTag,
        damageType1: 'basic',
        skillType1: 'basicSkill',
        skillType2: 'assistSkill',
      },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackIntenseHeatStirringMethod',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackIntenseHeatStirringMethod',
      1,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackIntenseHeatStirringMethodDoubleShot',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk',
      undefined,
      m6_fire_resIgn_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackIntenseHeatStirringMethodDoubleShot',
      1,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk',
      undefined,
      m6_fire_resIgn_
    )
  ),

  ...customDmg(
    'core_afterburn_dmg',
    { ...baseTag, skillType1: 'assistSkill' },
    prod(
      own.final.atk,
      sum(
        percent(subscript(char.core, dm.core.afterburn_dmg)),
        cmpGE(char.mindscape, 1, percent(dm.m1.afterburn_dmg))
      )
    ),
    undefined,
    core_afterburn_dmg_
  ),
  ...customAnomalyBuildup(
    'core_afterburn_anomBuildup',
    {
      ...baseTag,
      skillType1: 'assistSkill',
    },
    constant(60),
    undefined,
    core_afterburn_dmg_
  ),
  ...customDmg(
    'm6_additional_afterburn_dmg',
    { ...baseTag, skillType1: 'assistSkill' },
    cmpGE(
      char.mindscape,
      6,
      prod(own.final.atk, percent(dm.m6.special_afterburn_dmg))
    ),
    undefined,
    m6_fire_resIgn_
  ),
  ...customAnomalyDmg(
    'm6_burn_dmg',
    { attribute: 'fire', damageType1: 'anomaly', damageType2: 'burn' },
    cmpGE(
      char.mindscape,
      6,
      prod(percent(18), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
    )
  ),

  // Buffs
  // Abloom — EX Special Attack: Intense Heat Tossing Method (per-element damage instances)
  ...customAnomalyDmg(
    'exSpecial_ether_abloomDmg',
    { attribute: 'ether', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(480), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  ...customAnomalyDmg(
    'exSpecial_electric_abloomDmg',
    { attribute: 'electric', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(240), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  ...customAnomalyDmg(
    'exSpecial_fire_abloomDmg',
    { attribute: 'fire', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(600), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  ...customAnomalyDmg(
    'exSpecial_physical_abloomDmg',
    { attribute: 'physical', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(40), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  ...customAnomalyDmg(
    'exSpecial_ice_abloomDmg',
    { attribute: 'ice', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(60), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  ...customAnomalyDmg(
    'exSpecial_wind_abloomDmg',
    { attribute: 'wind', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(percent(24), own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  registerBuff(
    'core_afterburn_dmg',
    core_afterburn_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'potential_anomMas',
    ownBuff.combat.anomMas.add(
      min(
        dm.potential.max_anomMas,
        prod(
          max(0, sum(own.initial.enerRegen, -dm.potential.initial_enerRegen)),
          subscript(char.potential, dm.potential.anomMas),
          percent(1 / dm.potential.enerRegenStep)
        )
      )
    )
  ),
  registerBuff(
    'potential_common_dmg_',
    ownBuff.combat.common_dmg_.add(
      min(
        percent(dm.potential.max_common_dmg_),
        prod(
          max(0, sum(own.initial.enerRegen, -dm.potential.initial_enerRegen)),
          subscript(char.potential, dm.potential.common_dmg_),
          percent(1 / dm.potential.enerRegenStep)
        )
      )
    )
  ),
  registerBuff(
    'm2_pen_',
    teamBuff.combat.pen_.add(
      cmpGE(char.mindscape, 2, prod(thermal_penetration, percent(dm.m2.pen_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_exSpecial_crit_',
    ownBuff.combat.crit_.addWithDmgType(
      'exSpecial',
      cmpGE(char.mindscape, 4, dm.m4.exSpecial_assist_crit_)
    )
  ),
  registerBuff(
    'm4_assistSkill_crit_',
    ownBuff.combat.crit_.addWithSkillType(
      'assistSkill',
      cmpGE(char.mindscape, 4, dm.m4.exSpecial_assist_crit_)
    )
  ),
  registerBuff(
    'm6_burn_fire_resIgn_',
    ownBuff.combat.resIgn_.fire.addWithDmgType(
      'anomaly',
      cmpGE(
        char.mindscape,
        6,
        exSpecial_active.ifOn(
          dm.m6.exSpecial_specialAfterburn_burn_fire_resIgn_
        )
      )
    )
  ),
  registerBuff('m6_fire_resIgn_', m6_fire_resIgn_, undefined, undefined, false),
  registerBuff(
    'm6_burn_dmg',
    ownBuff.combat.anom_mv_mult_.fire.addWithDmgType(
      'burn',
      cmpGE(char.mindscape, 6, percent(18))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_additional_afterburn_dmg',
    ownBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 6, percent(dm.m6.special_afterburn_dmg))
    ),
    undefined,
    undefined,
    false
  )
)
export default sheet
