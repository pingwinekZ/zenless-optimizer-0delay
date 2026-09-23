import {
  cmpEq,
  cmpGE,
  constant,
  type NumNode,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  type TagMapNodeEntries,
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

const key: CharacterKey = 'Claret'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const { crimsonInscription, remnantEdge, perfectDodge } = allBoolConditionals(
  key,
  undefined,
  {
    remnantEdge: 0,
  }
)
const { m2_crimsonInscription } = allBoolConditionals(key, undefined, {
  m2_crimsonInscription: 2,
})
const baseTag = getBaseTag(data_gen)

// Team condition for Additional Ability: Stun or Armorer or same attribute (electric)
// Copied from Velina: sum counts including self, need >=3 (self contributes armorer+electric=2)
const ability_teamCheck = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('stun'),
      team.common.count.withSpecialty('armorer'),
      team.common.count.electric
    ),
    3,
    node
  )

// Core: For every 1% initial CRIT DMG, initial CRIT Rate +0.35%
// dm.core.critPerCritDmg = 0.0035 per 0.01, factor 0.35
const core_critPerCritDmg = ownBuff.initial.crit_.add(
  prod(own.initial.crit_dmg_, constant(dm.core.critPerCritDmg * 100))
)

// Crimson Inscription state: CRIT Rate +15-30% and Gash Buildup (modeled as crit_ only)
const core_crimson_crit_ = ownBuff.combat.crit_.add(
  crimsonInscription.ifOn(subscript(char.core, dm.core.crit_))
)

// Always-on part: while using Chain Attack, Ultimate, Counter Assist, or
// Assist Follow-Up the same CRIT / Gash buffs apply even outside Crimson
// Inscription. Scoped per damage type and gated on Crimson being OFF so they
// don't double-count with the global buffs above when in Crimson state.
const crimsonSkillDmgTypes = [
  'chain',
  'ult',
  'counterAssist',
  'assistFollowUp',
] as const
// Per-damage-type entries (one buff name per type, as meta generation keeps a
// single listing tag per buff name)
const core_crimson_skill_crit = Object.fromEntries(
  crimsonSkillDmgTypes.map((dmgType) => [
    dmgType,
    ownBuff.combat.crit_.addWithDmgType(
      dmgType,
      crimsonInscription.ifOff(subscript(char.core, dm.core.crit_))
    ),
  ])
) as Record<(typeof crimsonSkillDmgTypes)[number], TagMapNodeEntries>
const core_crimson_skill_gashBuildup = Object.fromEntries(
  crimsonSkillDmgTypes.map((dmgType) => [
    dmgType,
    ownBuff.combat.gashBuildup_.addWithDmgType(
      dmgType,
      crimsonInscription.ifOff(subscript(char.core, dm.core.gashBuildup_))
    ),
  ])
) as Record<(typeof crimsonSkillDmgTypes)[number], TagMapNodeEntries>

// Perfect Dodge during Starforging / SubduingAxe: DMG +15% for remainder
// Separate buffs per skill so the UI can display one row per skill instead
// of a generic "DMG" (same pattern as M4 hits).
const core_perfectDodge_starforging_dmg_ = ownBuff.combat.common_dmg_.add(
  perfectDodge.ifOn(percent(dm.core.perfectDodgeDmg_))
)
const core_perfectDodge_subduingAxe_dmg_ = ownBuff.combat.common_dmg_.add(
  perfectDodge.ifOn(percent(dm.core.perfectDodgeDmg_))
)

// Additional Ability: Remnant Edge — Laceration DMG +25% for all Armorers
// Triggered when Claret or squad member triggers Maim; gated by team condition
// Single team buff (applies to all armorers including self) — fixes double application
const ability_remnant_laceration_ = teamBuff.combat.laceration_dmg_.add(
  cmpEq(
    target.char.specialty,
    'armorer',
    ability_teamCheck(remnantEdge.ifOn(percent(dm.ability.lacerationDmg_)))
  )
)

// M1: When Claret triggers Laceration, Gash Buildup +20% and Maim multiplier to 130% — passive (mindscape only)
const m1_gashBuildup_ = ownBuff.combat.gashBuildup_.add(
  cmpGE(char.mindscape, 1, percent(dm.m1.gashBuildup_))
)
const m1_maim_dmg_ = ownBuff.combat.sharp_dmg_.add(
  cmpGE(char.mindscape, 1, percent(0.3))
)
// Display-only buff for M1 Maim multiplier as 130% total (for UI)
const m1_maim_mult_display_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 1, percent(1.3))
)
// Gash buildup from Crimson Inscription
const core_crimson_gashBuildup_ = ownBuff.combat.gashBuildup_.add(
  crimsonInscription.ifOn(subscript(char.core, dm.core.gashBuildup_))
)

// M2: While in Crimson Inscription, attacks ignore 18% Electric RES
// Uses separate conditional m2_crimsonInscription but linked to core crimsonInscription in UI
const m2_electric_resIgn_ = ownBuff.combat.resIgn_.electric.add(
  cmpGE(
    char.mindscape,
    2,
    m2_crimsonInscription.ifOn(percent(dm.m2.electric_resIgn_))
  )
)
// M2 always-on part for Chain / Ultimate / Counter Assist / Assist Follow-Up,
// gated off while in Crimson Inscription to avoid double-counting (see above)
const m2_skill_electric_resIgn = Object.fromEntries(
  crimsonSkillDmgTypes.map((dmgType) => [
    dmgType,
    ownBuff.combat.resIgn_.electric.addWithDmgType(
      dmgType,
      cmpGE(
        char.mindscape,
        2,
        m2_crimsonInscription.ifOff(percent(dm.m2.electric_resIgn_))
      )
    ),
  ])
) as Record<(typeof crimsonSkillDmgTypes)[number], TagMapNodeEntries>

// M4: DMG +20% for 3rd hit of Starforging (hit 2), Chain and Ult — specific overrides
// Create separate buffs so UI can display "Starforging #3 DMG 20%" etc, not generic "Chain DMG"
const m4_starforging_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 4, percent(dm.m4.dmg_))
)
const m4_resonant_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 4, percent(dm.m4.dmg_))
)
const m4_trial_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 4, percent(dm.m4.dmg_))
)
// Perfect Dodge DMG only affects Starforging (all 4 hits) and Subduing Axe.
// Passed as instance-scoped extras so the buff never leaks globally (same
// pattern as M1 Maim / M4 hits). Hit 2 of Starforging also carries the M4
// buff, so they share a single override to avoid layeredAssignment overwrite.
const perfectDodgeStarforgingOverride0 = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathStarforging',
  0,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  core_perfectDodge_starforging_dmg_
)
const perfectDodgeStarforgingOverride1 = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathStarforging',
  1,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  core_perfectDodge_starforging_dmg_
)
const perfectDodgeSubduingAxeOverride = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathSubduingAxe',
  0,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  core_perfectDodge_subduingAxe_dmg_
)
const perfectDodgeStarforgingOverride3 = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathStarforging',
  3,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  core_perfectDodge_starforging_dmg_
)
const m4StarforgingOverride = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathStarforging',
  2,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  m4_starforging_dmg_,
  core_perfectDodge_starforging_dmg_
)
const m4ResonantOverride = dmgDazeAndAnomOverride(
  dm,
  'chain',
  'ChainAttackBloodbloomOathResonantBloodPact',
  0,
  { ...baseTag, damageType1: 'chain' },
  'def',
  undefined,
  m4_resonant_dmg_
)
const m4TrialOverride = dmgDazeAndAnomOverride(
  dm,
  'chain',
  'UltimateBloodbloomOathTrialAfterTrial',
  0,
  { ...baseTag, damageType1: 'chain' },
  'def',
  undefined,
  m4_trial_dmg_
)

// M1 Maim multiplier applies ONLY to the Maim hit (index 2) of
// Special Attack: Bloodbloom Oath - Cleaving Gold and Iron. It is passed as an
// instance-scoped extra (see registerFormula) and registered display-only
// below so it never leaks globally.
const m1MaimOverride = dmgDazeAndAnomOverride(
  dm,
  'special',
  'SpecialAttackBloodbloomOathCleavingGoldAndIron',
  2,
  { ...baseTag, damageType1: 'special' },
  'def',
  undefined,
  m1_maim_dmg_
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas — all scaling on DEF (armorer), Gash instead of Anomaly
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    m1MaimOverride,
    m4StarforgingOverride,
    m4ResonantOverride,
    m4TrialOverride,
    perfectDodgeStarforgingOverride0,
    perfectDodgeStarforgingOverride1,
    perfectDodgeStarforgingOverride3,
    perfectDodgeSubduingAxeOverride
  ),

  // Buffs
  registerBuff('core_critPerCritDmg', core_critPerCritDmg),
  registerBuff('core_crimson_crit_', core_crimson_crit_),
  registerBuff('core_crimson_gashBuildup_', core_crimson_gashBuildup_),
  registerBuff(
    'core_crimson_skill_crit_chain_',
    core_crimson_skill_crit['chain']
  ),
  registerBuff('core_crimson_skill_crit_ult_', core_crimson_skill_crit['ult']),
  registerBuff(
    'core_crimson_skill_crit_counterAssist_',
    core_crimson_skill_crit['counterAssist']
  ),
  registerBuff(
    'core_crimson_skill_crit_assistFollowUp_',
    core_crimson_skill_crit['assistFollowUp']
  ),
  registerBuff(
    'core_crimson_skill_gashBuildup_chain_',
    core_crimson_skill_gashBuildup['chain']
  ),
  registerBuff(
    'core_crimson_skill_gashBuildup_ult_',
    core_crimson_skill_gashBuildup['ult']
  ),
  registerBuff(
    'core_crimson_skill_gashBuildup_counterAssist_',
    core_crimson_skill_gashBuildup['counterAssist']
  ),
  registerBuff(
    'core_crimson_skill_gashBuildup_assistFollowUp_',
    core_crimson_skill_gashBuildup['assistFollowUp']
  ),
  // Listing-only: actual effect is via instance-scoped extras above so it
  // only affects Starforging / Subduing Axe and never leaks globally.
  registerBuff(
    'core_perfectDodge_starforging_dmg_',
    core_perfectDodge_starforging_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'core_perfectDodge_subduingAxe_dmg_',
    core_perfectDodge_subduingAxe_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'ability_remnant_laceration_',
    ability_remnant_laceration_,
    undefined,
    true
  ),
  registerBuff('m1_gashBuildup_', m1_gashBuildup_),
  // Instance-scoped extras (M1 Maim hit, M4 hits): listing-only, so they show
  // in the UI without applying globally on top of the instance extras.
  registerBuff('m1_maim_dmg_', m1_maim_dmg_, undefined, false, false),
  registerBuff(
    'm1_maim_mult_display_',
    m1_maim_mult_display_,
    undefined,
    false,
    false
  ),
  registerBuff('m2_electric_resIgn_', m2_electric_resIgn_),
  registerBuff(
    'm2_skill_electric_resIgn_chain_',
    m2_skill_electric_resIgn['chain']
  ),
  registerBuff(
    'm2_skill_electric_resIgn_ult_',
    m2_skill_electric_resIgn['ult']
  ),
  registerBuff(
    'm2_skill_electric_resIgn_counterAssist_',
    m2_skill_electric_resIgn['counterAssist']
  ),
  registerBuff(
    'm2_skill_electric_resIgn_assistFollowUp_',
    m2_skill_electric_resIgn['assistFollowUp']
  ),
  registerBuff(
    'm4_starforging_dmg_',
    m4_starforging_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff('m4_resonant_dmg_', m4_resonant_dmg_, undefined, false, false),
  registerBuff('m4_trial_dmg_', m4_trial_dmg_, undefined, false, false)
)
export default sheet
