import {
  cmpGE,
  max,
  min,
  type NumNode,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import {
  type AttributeAnomalyKey,
  allAttributeAnomalyKeys,
  type CharacterKey,
} from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
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
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Phoenix'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const baseTag = getBaseTag(data_gen)

const { char } = own

// Core Passive: Nirvana — enemy state enabling the Sear anomaly-crit effects.
// `sear_ability` / `sear_m2` are the ability and M2 docs' own toggles; the
// UI links all three so toggling any one toggles the whole Sear state
// (guide §3.3, symmetric linked arrays).
const { sear, sear_ability, sear_m2 } = allBoolConditionals(key, undefined, {
  sear_m2: 2,
})

// Additional Ability: Krampus Ace — "another character in your squad is an
// Anomaly character or shares the same faction". team.common.count includes
// self; Phoenix contributes 2 (1 anomaly + 1 faction), so >= 3 means "at
// least one other member qualifies" (Jane/Yuzuha squad-check pattern).
const abilityCheck = (node: number | NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('anomaly'),
      team.common.count.withFaction('KrampusComplianceAuthority')
    ),
    3,
    node
  )

// Sear anomaly crit rate: base 30% + 0.7% per initial Anomaly Mastery over
// 155, capped at 255 initial AM ("reaching its maximum value when Phoenix's
// initial Anomaly Mastery reaches 255").
const core_sear_anom_crit_ = teamBuff.combat.anom_crit_.add(
  sear.ifOn(
    sum(
      percent(dm.core.sear_crit_rate),
      prod(
        percent(dm.core.crit_rate_per_anomMas),
        max(
          0,
          sum(
            min(own.initial.anomMas, dm.core.max_anomMas),
            -dm.core.anomMas_threshold
          )
        )
      )
    )
  )
)

// Sear DoT: enemies take Fire DMG equal to X% (core-scaled) of Phoenix's ATK
// every 8s, considered EX Special Attack DMG. Passive core effect — shown as
// a plain value field (no conditional); the 8s cadence is descriptive.
const core_sear_dmg = prod(
  own.final.atk,
  percent(subscript(char.core, dm.core.sear_dmg_))
)

// Abloom ratios — a fraction of the original Anomaly DMG (Vivian/Burnice
// ratio style). Hardcoded from calcedParams:
//   Purifying Flame:   {CAL:225+20*(basicLevel-1),1,2}%
//   Soul-Searching Blaze: {CAL:300+27*(chainLevel-1),1,2}%
const purifyingFlameRatio = percent(
  sum(2.25, prod(sum(own.char.basic, -1), 0.2))
)
const blazeRatio = percent(sum(3, prod(sum(own.char.chain, -1), 0.27)))

// Abloom instance base: ratio x the original anomaly DMG of the matching
// attribute (anomaly MV x ATK x (1 + anomaly MV mult), Burnice/Aria shape).
const abloomBase = (ratio: NumNode) => (attr: AttributeAnomalyKey) =>
  prod(
    percent(anomalyMultipliers[attr]),
    ratio,
    own.final.atk,
    sum(percent(1), own.final.anom_mv_mult_)
  )

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  // Core Passive: Sear DoT — Fire DMG every 8s while the enemy is Sear'd
  ...customDmg(
    'core_sear_dmg',
    { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
    core_sear_dmg
  ),

  // Abloom instances — Purifying Flame (basic-scaled ratio), per attribute.
  // Named per skill (like the Soul-Searching Blaze family below) and mapped
  // to localized opt-target titles in CharBase ("Purifying Flame Abloom") —
  // the shared `abloomDmgInst_<attr>` name stays for the generic core Abloom.
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `purifyingFlameAbloomDmgInst_${attr}`,
      { attribute: attr, damageType1: 'anomaly', damageType2: 'abloom' },
      abloomBase(purifyingFlameRatio)(attr)
    )
  ),
  // Abloom instances — Soul-Searching Blaze (chain-scaled ratio)
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `soulSearchingBlazeAbloomDmgInst_${attr}`,
      { attribute: attr, damageType1: 'anomaly', damageType2: 'abloom' },
      abloomBase(blazeRatio)(attr)
    )
  ),
  // Abloom instances — M4: one additional instance at a fixed 600% multiplier
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `m4_abloomDmgInst_${attr}`,
      { attribute: attr, damageType1: 'anomaly', damageType2: 'abloom' },
      cmpGE(
        char.mindscape,
        4,
        abloomBase(percent(dm.m4.abloom_multiplier))(attr)
      )
    )
  ),

  // Buffs
  registerBuff(
    'core_anomProf',
    ownBuff.combat.anomProf.add(subscript(char.core, dm.core.anomProf))
  ),
  registerBuff('core_sear_anom_crit_', core_sear_anom_crit_, undefined, true),
  registerBuff(
    'core_sear_anom_crit_dmg_',
    teamBuff.combat.anom_crit_dmg_.add(
      sear.ifOn(
        sum(
          percent(subscript(char.core, dm.core.sear_crit_dmg_)),
          // M1: +25% CRIT DMG for Anomaly DMG against Sear enemies
          cmpGE(char.mindscape, 1, percent(dm.m1.sear_crit_dmg_))
        )
      )
    ),
    undefined,
    true
  ),
  // Abloom instances that land a crit deal +40% CRIT DMG
  registerBuff(
    'core_abloom_crit_dmg_',
    ownBuff.combat.anom_crit_dmg_.addWithDmgType('abloom', percent(0.4))
  ),
  registerBuff(
    'ability_sear_crit_dmg_',
    teamBuff.combat.anom_crit_dmg_.add(
      sear_ability.ifOn(abilityCheck(percent(dm.ability.sear_crit_dmg_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_sear_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 2, sear_m2.ifOn(percent(dm.m2.sear_dmg_)))
    )
  ),
  // Display-only pair for the Sear DoT instance above: the sheet display
  // filter drops fields whose name is missing from the buffs listing, so
  // the instance needs a matching registerBuff (Seed §1.6 pattern, Yixuan/
  // Banyue precedent). The 'elemental' type matches no hit and
  // includeOriginalEntry: false keeps it from ever applying.
  registerBuff(
    'core_sear_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'elemental',
      percent(subscript(char.core, dm.core.sear_dmg_))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_all_resIgn_',
    ownBuff.combat.resIgn_.add(
      cmpGE(char.mindscape, 6, percent(dm.m6.all_resIgn_))
    )
  ),
  registerBuff(
    'm6_abloom_defIgn_',
    ownBuff.combat.defIgn_.addWithDmgType(
      'abloom',
      cmpGE(char.mindscape, 6, percent(dm.m6.abloom_defIgn_))
    )
  )
)
export default sheet
