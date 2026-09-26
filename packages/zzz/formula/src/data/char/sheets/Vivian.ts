import type { NumNode } from '@zenless-optimizer/pando/engine'
import { cmpGE, prod, subscript, sum } from '@zenless-optimizer/pando/engine'
import {
  type AttributeAnomalyKey,
  allAttributeAnomalyKeys,
  type CharacterKey,
} from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customAnomalyDmg,
  customDmg,
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
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Vivian'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { prophecy, fluttering_featherbloom_used } = allBoolConditionals(
  key,
  undefined,
  {
    prophecy: 1,
    fluttering_featherbloom_used: 4,
  }
)

// M6: Guard Feathers consumed by Basic Attack: Fluttering Frock - Suspension.
// 0 = M6 Abloom bonus disabled.
const { m6_guard_feathers } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.max_guard_feathers_consumed,
  undefined,
  { m6_guard_feathers: 6 }
)

const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(team.common.count.withSpecialty('anomaly'), team.common.count.ether),
    3,
    node
  )
const m4_suspension_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 4, percent(1))
)
const m4_featherbloom_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 4, percent(1))
)
const m2_ether_anomBuildup_ = ownBuff.combat.anomBuildup_.ether.add(
  cmpGE(char.mindscape, 2, dm.m2.ether_anomBuildup_)
)
// M6: the special Abloom instance's additional DMG scales with Guard Feathers
// consumed — n feathers adds n × 100% Anomaly DMG (0 = disabled).
const m6_abloom_dmg_ = ownBuff.combat.common_dmg_.addWithDmgType(
  'abloom',
  cmpGE(char.mindscape, 6, m6_guard_feathers)
)

// Abloom deals an additional instance of DMG equal to the core's Abloom ratio
// (X% per 10 Anomaly Proficiency of the original Anomaly's DMG, ×1.3 at M2).
// That ratio is a multiplier on the original anomaly DMG, so it folds into the
// base anomaly MV instead of being added to the generic anomaly MV multiplier
// (which would compute `original × (1 + ratio)` instead of `original × ratio`).
const abloomRatio = (dmgPerAp: number[]) =>
  prod(
    percent(subscript(char.core, dmgPerAp)),
    percent(1 / dm.core.anomProf_step),
    own.final.anomProf,
    cmpGE(char.mindscape, 2, dm.m2.abloom_bonus, 1)
  )
const abloomRatioByAttr: Record<AttributeAnomalyKey, NumNode> = {
  ether: abloomRatio(dm.core.dmg_ether),
  electric: abloomRatio(dm.core.dmg_electric),
  fire: abloomRatio(dm.core.dmg_fire),
  physical: abloomRatio(dm.core.dmg_physical),
  ice: abloomRatio(dm.core.dmg_ice),
  wind: abloomRatio(dm.core.dmg_wind),
}

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic hits 1-3 are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFeatheredStrike',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFeatheredStrike',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFeatheredStrike',
      2,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dash attack is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackSilverThornedMelody',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFlutteringFrockSuspension',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m4_suspension_crit_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackFeatherbloom',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      m4_featherbloom_crit_
    )
  ),

  ...customDmg(
    'core_prophecy_dmg',
    { ...baseTag, damageType1: 'elemental' },
    prod(own.final.atk, percent(dm.core.dmg))
  ),

  // Abloom DMG instances — an additional hit equal to the Abloom ratio of the
  // original anomaly's DMG, registered for every anomaly attribute. The bare
  // `abloomDmgInst` from `entriesForChar` stays hidden (no abloom MV-mult
  // source), so ether is registered here too with the correct ratio.
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `abloomDmgInst_${attr}`,
      {
        attribute: attr,
        damageType1: 'anomaly',
        damageType2: 'abloom',
      },
      prod(
        percent(anomalyMultipliers[attr]),
        abloomRatioByAttr[attr],
        own.final.atk,
        sum(percent(1), own.final.anom_mv_mult_)
      )
    )
  ),

  registerBuff(
    'core_prophecy_dmg',
    ownBuff.combat.dmg_.ether.add(percent(dm.core.dmg)),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'core_ether_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.ether.addWithDmgType(
      'abloom',
      abloomRatioByAttr.ether
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_electric_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.electric.addWithDmgType(
      'abloom',
      abloomRatioByAttr.electric
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_fire_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.fire.addWithDmgType(
      'abloom',
      abloomRatioByAttr.fire
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_physical_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.physical.addWithDmgType(
      'abloom',
      abloomRatioByAttr.physical
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_ice_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.ice.addWithDmgType(
      'abloom',
      abloomRatioByAttr.ice
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_wind_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.wind.addWithDmgType(
      'abloom',
      abloomRatioByAttr.wind
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'ability_corruption_dmg_',
    teamBuff.combat.buff_.ether.addWithDmgType(
      'anomaly',
      abilityCheck(dm.ability.ether_anom_dmg_)
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_corruption_disorder_dmg_',
    teamBuff.combat.buff_.ether.addWithDmgType(
      'disorder',
      abilityCheck(dm.ability.ether_anom_dmg_)
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_anomaly_dmg_',
    teamBuff.combat.buff_.addWithDmgType(
      'anomaly',
      cmpGE(char.mindscape, 1, prophecy.ifOn(dm.m1.anomaly_disorder_dmg_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_disorder_dmg_',
    teamBuff.combat.buff_.addWithDmgType(
      'disorder',
      cmpGE(char.mindscape, 1, prophecy.ifOn(dm.m1.anomaly_disorder_dmg_))
    ),
    undefined,
    true
  ),
  registerBuff('m2_ether_anomBuildup_', m2_ether_anomBuildup_),
  registerBuff(
    'm2_resIgn_',
    teamBuff.combat.resIgn_.add(cmpGE(char.mindscape, 2, dm.m2.resIgn_)),
    undefined,
    true
  ),
  registerBuff(
    'm4_suspension_crit_',
    m4_suspension_crit_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm4_featherbloom_crit_',
    m4_featherbloom_crit_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm4_atk_',
    ownBuff.combat.atk_.add(
      cmpGE(char.mindscape, 4, fluttering_featherbloom_used.ifOn(dm.m4.atk_))
    )
  ),
  registerBuff(
    'm6_ether_dmg_',
    ownBuff.combat.dmg_.ether.add(cmpGE(char.mindscape, 6, dm.m6.ether_dmg_))
  ),
  registerBuff('m6_abloom_dmg_', m6_abloom_dmg_)
)
export default sheet
