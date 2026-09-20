import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpEq,
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
  enemyDebuff,
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

const key: CharacterKey = 'Roxy'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const {
  contaminationSurge,
  windsweptVulnerability,
  exAnomalySurge,
  stunSurge,
  m1ResShred,
  m2StunSurge,
} = allBoolConditionals(key, undefined, {
  m1ResShred: 1,
  m2StunSurge: 2,
})

// Additional Ability team check: another Attack, Rupture, or Armorer squad
// member. Counts include self, but Roxy (Stun) contributes 0, so >= 1 means
// a teammate matches. Copied from Pulchra/Dialyn.
const ability_check = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('attack'),
      team.common.count.withSpecialty('rupture'),
      team.common.count.withSpecialty('armorer')
    ),
    1,
    node
  )

// Core p1: initial Energy Regen above threshold → flat ATK / Impact.
// Follows the Velina ER-scaling pattern (static per-step factor, per-core
// cap via subscript).
const core_regen_atk = ownBuff.combat.atk.add(
  min(
    subscript(char.core, dm.core.maxAtk),
    prod(
      max(0, sum(own.initial.enerRegen, -dm.core.erThreshold)),
      dm.core.atkPerStep / dm.core.erStep
    )
  )
)
const core_regen_impact = ownBuff.combat.impact.add(
  min(
    subscript(char.core, dm.core.maxImpact),
    prod(
      max(0, sum(own.initial.enerRegen, -dm.core.erThreshold)),
      dm.core.impactPerStep / dm.core.erStep
    )
  )
)

// Core p3: on Contamination/Cleanse, team CRIT DMG (non-Armorer) and
// Laceration DMG (Armorer) scaling with Roxy's CRIT Rate, capped per core.
// Follows the Trigger/Dialyn final-crit scaling pattern; the Armorer split
// follows the Claret specialty gate.
const core_team_crit_dmg_ = teamBuff.combat.crit_dmg_.add(
  contaminationSurge.ifOn(
    cmpEq(
      target.char.specialty,
      'armorer',
      0,
      min(
        subscript(char.core, dm.core.maxCritDmg),
        prod(own.final.crit_, dm.core.critDmgPerStep / dm.core.critStep)
      )
    )
  )
)
const core_team_laceration_ = teamBuff.combat.laceration_dmg_.add(
  contaminationSurge.ifOn(
    cmpEq(
      target.char.specialty,
      'armorer',
      min(
        subscript(char.core, dm.core.maxLaceration),
        prod(own.final.crit_, dm.core.lacerationPerStep / dm.core.critStep)
      )
    )
  )
)

// Ability p1: Roxy's own DMG scales with character level. Norma pattern.
const ability_self_dmg_ = ownBuff.combat.common_dmg_.add(
  ability_check(
    min(
      dm.ability.selfDmgMax,
      sum(dm.ability.selfDmgBase, prod(char.lvl, dm.ability.selfDmgPerLevel))
    )
  )
)

// Ability p2: squad Stun DMG Multiplier while the target is stunned. The kit
// only buffs the stunned multiplier, so only stun_ is registered (no
// unstun_). The +2s Stun duration has no optimizer effect.
const ability_stun = ability_check(stunSurge.ifOn(percent(dm.ability.stun_)))

// Ability p3: enemies in Windswept take more direct DMG. Enemy dmgInc_
// follows the PanYinhu/Caesar pattern.
const ability_windswept_dmgInc_ = enemyDebuff.common.dmgInc_.add(
  ability_check(windsweptVulnerability.ifOn(percent(dm.ability.windsweptDmg_)))
)

// Ability p6: EX Special → Anomaly Buildup Rate for 50s.
const ability_ex_anomBuildup_ = ownBuff.combat.anomBuildup_.add(
  ability_check(exAnomalySurge.ifOn(percent(dm.ability.anomBuildup_)))
)

// Ability p4 (40 Energy on entry) and p5 (Windswept +20s duration) have no
// optimizer effect; description-only. Same for the Wind Energy stack
// mechanic, M4 Energy grants, and M2 Windflow sustain timing.

// M1: EX Kindly Rest in Peace → enemy All-Attribute RES reduction (Yuzuha /
// AstraYao resRed_ pattern, teamwide) + Roxy's own CRIT DMG (passive once M1,
// self-only).
const m1_allResRed_ = enemyDebuff.common.resRed_.add(
  cmpGE(char.mindscape, 1, m1ResShred.ifOn(percent(dm.m1.allResRed_)))
)
const m1_crit_dmg_ = ownBuff.combat.crit_dmg_.add(
  cmpGE(char.mindscape, 1, percent(dm.m1.crit_dmg_))
)

// M2: EX Don't Catch a Chill Daze +5%. Scoped to the ability via overrides
// (Velina Sweeping Cyclone pattern); the Windflow sustain is timing-only.
const m2_ex_daze_ = ownBuff.combat.dazeInc_.add(
  cmpGE(char.mindscape, 2, percent(dm.m2.exDaze_))
)
// M2: Stun DMG Multiplier while the target is stunned (Trigger pattern).
const m2_stun = cmpGE(char.mindscape, 2, m2StunSurge.ifOn(percent(dm.m2.stun_)))

// M4: Ultimate DMG/Daze up (Claret M4 buff + override pattern).
const m4_ult_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 4, percent(dm.m4.ult_dmg_))
)
const m4_ult_daze_ = ownBuff.combat.dazeInc_.add(
  cmpGE(char.mindscape, 4, percent(dm.m4.ult_daze_))
)

// M6: attacks ignore Wind RES (Soldier0Anby M4 resIgn_ pattern).
const m6_wind_resIgn_ = ownBuff.combat.resIgn_.wind.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.wind_resIgn_))
)
// M6 Afterecho: Giant Windstorm DMG "increases to 250%" = +150% additive,
// scoped to Eye of the Storm hit 2 via override; Daze +20% likewise. The 2
// extra storm instances are trigger counts, description-only. Passive once
// M6 (no toggle — the windstorm is always empowered).
const m6_afterecho_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.giantWindstormMult_ - 1))
)
// Display-only total multiplier (250%) for the UI row, following the Claret
// m1_maim_mult_display_ pattern. The additive buff above is what the
// override actually applies.
const m6_afterecho_daze_ = ownBuff.combat.dazeInc_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.giantWindstormDaze_))
)
const m6_afterecho_mult_display_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.giantWindstormMult_))
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
      'EXSpecialAttackDontCatchAChill',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m2_ex_daze_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackDontCatchAChill',
      1,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m2_ex_daze_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateRequiemForTheNightBurial',
      0,
      { ...baseTag, damageType1: 'ult', skillType1: 'chainSkill' },
      'atk',
      undefined,
      m4_ult_dmg_,
      m4_ult_daze_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EyeOfTheStorm',
      2,
      { ...baseTag, damageType1: 'special', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_afterecho_dmg_,
      m6_afterecho_daze_
    )
  ),

  // Buffs
  registerBuff('core_regen_atk', core_regen_atk),
  registerBuff('core_regen_impact', core_regen_impact),
  registerBuff('core_team_crit_dmg_', core_team_crit_dmg_, undefined, true),
  registerBuff('core_team_laceration_', core_team_laceration_, undefined, true),
  registerBuff('ability_self_dmg_', ability_self_dmg_),
  registerBuff(
    'ability_stun_',
    enemyDebuff.common.stun_.add(ability_stun),
    undefined,
    true
  ),
  registerBuff(
    'ability_windswept_dmgInc_',
    ability_windswept_dmgInc_,
    undefined,
    true
  ),
  registerBuff('ability_ex_anomBuildup_', ability_ex_anomBuildup_),
  registerBuff('m1_allResRed_', m1_allResRed_, undefined, true),
  registerBuff('m1_crit_dmg_', m1_crit_dmg_),
  registerBuff('m2_ex_daze_', m2_ex_daze_, undefined, undefined, false),
  registerBuff(
    'm2_stun_',
    enemyDebuff.common.stun_.add(m2_stun),
    undefined,
    true
  ),
  // Move-scoped buffs below are applied to their damage instances via the
  // overrides above, so they are display-only here (includeOriginalEntry
  // false) and must NOT leak into global stats.
  registerBuff('m4_ult_dmg_', m4_ult_dmg_, undefined, undefined, false),
  registerBuff('m4_ult_daze_', m4_ult_daze_, undefined, undefined, false),
  registerBuff('m6_wind_resIgn_', m6_wind_resIgn_),
  registerBuff(
    'm6_afterecho_daze_',
    m6_afterecho_daze_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_afterecho_mult_display_',
    m6_afterecho_mult_display_,
    undefined,
    undefined,
    false
  )
)
export default sheet
