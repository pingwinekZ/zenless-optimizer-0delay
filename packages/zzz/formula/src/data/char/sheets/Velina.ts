import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
  max,
  min,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customAnomalyDmg,
  enemyDebuff,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
  teamBuff,
} from '../../util'
import {
  anomalyMultipliers,
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  hitBuff,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Velina'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

// Conditionals
const {
  exSpecialAtk,
  vortexAllResIgn,
  windsweptWindResIgn,
  windbiteVortex,
  sweepingCycloneHit,
  windAnomalyEnemy,
} = allBoolConditionals(key, undefined, {
  exSpecialAtk: 4,
  vortexAllResIgn: 1,
  windsweptWindResIgn: 1,
  windAnomalyEnemy: 6,
})
// M6: remaining Sweeping Cyclone duration when Windswept is reapplied.
// Each remaining second adds 2.5% Windswept DMG, capped at 40% (16s).
const { windsweptRemaining } = allNumConditionals(key, true, 0, 16, undefined, {
  windsweptRemaining: 6,
})

// Ability check: party has another Anomaly character or shares same attribute (Wind)
const ability_check = (a: number | NumNode) =>
  cmpGE(
    sum(team.common.count.withSpecialty('anomaly'), team.common.count.wind),
    3,
    a
  )

// Core Passive: Breeze in Bloom — ER scaling
// ER > 1.2, each 0.01 → +0.21% DMG (max 35%), +0.5 Anomaly Mastery (max 84)
const core_common_dmg_ = ownBuff.combat.common_dmg_.add(
  min(
    percent(dm.core.maxDmg),
    prod(
      max(0, sum(own.initial.enerRegen, -dm.core.erThreshold)),
      percent(dm.core.dmgPerStep / dm.core.erStep)
    )
  )
)
const core_anomMas = ownBuff.combat.anomMas.add(
  min(
    dm.core.maxAnomMas,
    prod(
      max(0, sum(own.initial.enerRegen, -dm.core.erThreshold)),
      dm.core.anomMasPerStep / dm.core.erStep
    )
  )
)

// Core: 2 Windbite consumed → that Vortex's DMG Multiplier +90-150% (core level)
const core_windbite_vortex_dmg_ = ownBuff.combat.dmg_.vortex.map((r) =>
  r.add(
    windbiteVortex.ifOn(
      percent(subscript(char.core, dm.core.condensedCycloneVortexDmg))
    )
  )
)

// Core + Ability: Sweeping Cyclone hit → enemy Anomaly Buildup RES -7%,
// further -7% when the ability trigger is met (one effect, one toggle, merged).
// Modeled unscoped (all attributes): the Chromatic Tint branch reduces the
// corresponding attribute's RES, which varies per enemy and can't be scoped.
const core_sweeping_anomBuildupRes_ = enemyDebuff.common.anomBuildupRes_.add(
  sweepingCycloneHit.ifOn(
    sum(
      percent(-dm.core.windAnomResRed_),
      ability_check(percent(-dm.ability.anomResRed_))
    )
  )
)

// Additional Ability: Tea Party Etiquette
// Windswept/Vortex DMG +10%, further +15% at M2 (M2 only augments: merged)
const ability_wind_dmg_ = ownBuff.combat.dmg_.windswept.map((r) =>
  r.add(
    sum(
      ability_check(percent(dm.ability.windsweptVortexDmg_)),
      cmpGE(char.mindscape, 2, percent(dm.m2.windsweptVortexDmg_))
    )
  )
)
const ability_vortex_dmg_ = ownBuff.combat.dmg_.vortex.map((r) =>
  r.add(
    sum(
      ability_check(percent(dm.ability.windsweptVortexDmg_)),
      cmpGE(char.mindscape, 2, percent(dm.m2.windsweptVortexDmg_))
    )
  )
)
// Sweeping Cyclone Daze +30%, further +20% at M1 (merged, Sweeping-only via overrides)
const ability_sweepingCyclone_dazeInc_ = ownBuff.combat.dazeInc_.add(
  sum(
    ability_check(percent(dm.ability.daze_)),
    cmpGE(char.mindscape, 1, percent(dm.m1.sweepingCycloneDaze))
  )
)
// Sweeping Cyclone Anomaly Buildup +15% (Sweeping-only via overrides)
const ability_sweepingCyclone_anomBuildup_ =
  ownBuff.combat.anomBuildup_.wind.add(
    ability_check(percent(dm.ability.anomBuildup_))
  )

// M1: Sweeping Cyclone +20% Daze is folded into the ability buff above.
// Vortex trigger → Velina ignores 20% All-Attribute RES. Toggle-gated global
// approximation: resIgn_ cannot scope to Vortex's damageType2-only anomaly hits.
const m1_all_resIgn_ = ownBuff.combat.resIgn_.add(
  cmpGE(char.mindscape, 1, vortexAllResIgn.ifOn(percent(dm.m1.allResIgn_)))
)
// Squad members dealing Windswept DMG → 20% Wind RES ignored (team buff)
const m1_wind_resIgn_ = teamBuff.combat.resIgn_.wind.add(
  cmpGE(char.mindscape, 1, windsweptWindResIgn.ifOn(percent(dm.m1.windResIgn_)))
)

// M4: EX Special Attack → ATK +15%
const m4_atk_ = ownBuff.combat.atk_.add(
  cmpGE(char.mindscape, 4, exSpecialAtk.ifOn(percent(dm.m4.atk_)))
)

// M6: vs Wind-Anomaly enemies, Velina's Wind Anomaly Buildup +20%
const m6_wind_anomBuildup_ = ownBuff.combat.anomBuildup_.wind.add(
  cmpGE(
    char.mindscape,
    6,
    windAnomalyEnemy.ifOn(percent(dm.m6.windAnomBuildup_))
  )
)
// M6: reapplied Windswept DMG +2.5% per remaining second (max 40%)
const m6_windswept_dmg_ = ownBuff.combat.dmg_.windswept.map((r) =>
  r.add(
    cmpGE(
      char.mindscape,
      6,
      min(
        percent(dm.m6.maxWindsweptDmg_),
        prod(windsweptRemaining, percent(dm.m6.windsweptDmgPerRemainingSec))
      )
    )
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
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'SweepingCyclone',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ability_sweepingCyclone_dazeInc_,
      ability_sweepingCyclone_anomBuildup_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'SweepingCyclone',
      1,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ability_sweepingCyclone_dazeInc_,
      ability_sweepingCyclone_anomBuildup_
    )
  ),

  // Core cyclone-explosion Abloom: vs Wind Anomaly, an extra Wind Anomaly hit
  // at a fixed ratio of Wind Anomaly DMG (core-level: condensed 85-145%,
  // sweeping 135-255%). Follows the Grace fixed-fraction Abloom pattern.
  ...customAnomalyDmg(
    'core_condensed_abloom_dmg',
    { attribute: 'wind', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(
      percent(anomalyMultipliers.wind),
      percent(subscript(char.core, dm.core.condensedCycloneAbloom)),
      own.final.atk,
      sum(percent(1), own.final.anom_mv_mult_)
    )
  ),
  ...customAnomalyDmg(
    'core_sweeping_abloom_dmg',
    { attribute: 'wind', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(
      percent(anomalyMultipliers.wind),
      percent(subscript(char.core, dm.core.sweepingCycloneAbloom)),
      own.final.atk,
      sum(percent(1), own.final.anom_mv_mult_)
    )
  ),
  // Ability: Ult heavy attack vs Wind Anomaly → Abloom at 680% Wind Anomaly DMG
  ...customAnomalyDmg(
    'ability_ult_abloom_dmg',
    { attribute: 'wind', damageType1: 'anomaly', damageType2: 'abloom' },
    prod(
      percent(anomalyMultipliers.wind),
      ability_check(percent(dm.ability.ultAbloomDmg)),
      own.final.atk,
      sum(percent(1), own.final.anom_mv_mult_)
    )
  ),

  // Buffs
  registerBuff('core_common_dmg_', core_common_dmg_),
  registerBuff('core_anomMas', core_anomMas),
  registerBuff('core_windbite_vortex_dmg_', core_windbite_vortex_dmg_),
  registerBuff(
    'core_sweeping_anomBuildupRes_',
    core_sweeping_anomBuildupRes_,
    undefined,
    true
  ),
  registerBuff(
    'core_condensed_abloom_dmg',
    ownBuff.combat.anom_mv_mult_.wind.addWithDmgType(
      'abloom',
      percent(subscript(char.core, dm.core.condensedCycloneAbloom))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_sweeping_abloom_dmg',
    ownBuff.combat.anom_mv_mult_.wind.addWithDmgType(
      'abloom',
      percent(subscript(char.core, dm.core.sweepingCycloneAbloom))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff('ability_wind_dmg_', ability_wind_dmg_),
  registerBuff('ability_vortex_dmg_', ability_vortex_dmg_),
  hitBuff('ability_sweepingCyclone_dazeInc_', ability_sweepingCyclone_dazeInc_),
  hitBuff(
    'ability_sweepingCyclone_anomBuildup_',
    ability_sweepingCyclone_anomBuildup_
  ),
  registerBuff(
    'ability_ult_abloom_dmg',
    ownBuff.combat.anom_mv_mult_.wind.addWithDmgType(
      'abloom',
      ability_check(percent(dm.ability.ultAbloomDmg))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff('m1_wind_resIgn_', m1_wind_resIgn_, undefined, true),
  registerBuff('m1_all_resIgn_', m1_all_resIgn_),
  registerBuff('m4_atk_', m4_atk_),
  registerBuff('m6_wind_anomBuildup_', m6_wind_anomBuildup_),
  registerBuff('m6_windswept_dmg_', m6_windswept_dmg_)
)
export default sheet
