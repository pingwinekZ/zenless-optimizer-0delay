import {
  cmpGE,
  constant,
  type NumNode,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customMaimDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
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
// team count includes self, so electric count >=2 means another electric teammate
const ability_teamCheck = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('stun'),
      team.common.count.withSpecialty('armorer'),
      cmpGE(team.common.count.electric, 2, 1)
    ),
    1,
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

// Perfect Dodge during Starforging / SubduingAxe: DMG +15% for remainder
const core_perfectDodge_dmg_ = ownBuff.combat.common_dmg_.add(
  perfectDodge.ifOn(percent(dm.core.perfectDodgeDmg_))
)

// Additional Ability: Remnant Edge — Laceration DMG +25% for all Armorers
// Triggered when Claret or squad member triggers Maim; gated by team condition
const ability_remnant_laceration_ = ownBuff.combat.laceration_dmg_.add(
  ability_teamCheck(remnantEdge.ifOn(percent(dm.ability.lacerationDmg_)))
)
// Also as teamBuff for other Armorers in squad
const team_ability_remnant_laceration_ = teamBuff.combat.laceration_dmg_.add(
  ability_teamCheck(remnantEdge.ifOn(percent(dm.ability.lacerationDmg_)))
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
const m4StarforgingOverride = dmgDazeAndAnomOverride(
  dm,
  'basic',
  'BasicAttackBloodbloomOathStarforging',
  2,
  { ...baseTag, damageType1: 'basic' },
  'def',
  undefined,
  m4_starforging_dmg_
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
const m1BloodBurialOverride = dmgDazeAndAnomOverride(
  dm,
  'special',
  'SpecialAttackBloodbloomOathBloodBurialAssault',
  0,
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
    m1BloodBurialOverride,
    m4StarforgingOverride,
    m4ResonantOverride,
    m4TrialOverride
  ),

  // M6: Chain and Ult heavy hits directly trigger Maim without consuming Gash
  ...customMaimDmg(
    'm6_maim',
    { attribute: data_gen.attribute, damageType1: 'chain' },
    cmpGE(char.mindscape, 6, prod(own.final.def, percent(1.5)))
  ),

  // Buffs
  registerBuff('core_critPerCritDmg', core_critPerCritDmg),
  registerBuff('core_crimson_crit_', core_crimson_crit_),
  registerBuff('core_crimson_gashBuildup_', core_crimson_gashBuildup_),
  registerBuff('core_perfectDodge_dmg_', core_perfectDodge_dmg_),
  registerBuff('ability_remnant_laceration_', ability_remnant_laceration_),
  registerBuff(
    'team_ability_remnant_laceration_',
    team_ability_remnant_laceration_,
    undefined,
    true
  ),
  registerBuff('m1_gashBuildup_', m1_gashBuildup_),
  registerBuff('m1_maim_dmg_', m1_maim_dmg_),
  registerBuff('m1_maim_mult_display_', m1_maim_mult_display_),
  registerBuff('m2_electric_resIgn_', m2_electric_resIgn_),
  registerBuff('m4_starforging_dmg_', m4_starforging_dmg_),
  registerBuff('m4_resonant_dmg_', m4_resonant_dmg_),
  registerBuff('m4_trial_dmg_', m4_trial_dmg_)
)
export default sheet
