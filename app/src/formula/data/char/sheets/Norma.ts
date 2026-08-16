import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
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
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Norma'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

// Conditionals
const { enNahBarrage, warheadHit } = allBoolConditionals(key, undefined, {
  warheadHit: 1,
})

// Ability check: >= 1 teammate is Attack, Rupture, or same Faction
// team.common.count includes self — she contributes 1 (faction),
// so threshold >= 2 means "self + at least 1 teammate"
const abilityOn = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('attack'),
      team.common.count.withSpecialty('rupture'),
      team.common.count.withFaction('Roscaelifer')
    ),
    2,
    node
  )

// Core: CRIT Rate → CRIT DMG (always active)
const coreCritDmg_ = ownBuff.combat.crit_dmg_.add(
  min(
    percent(subscript(char.core, dm.core.maxCritDmg_)),
    prod(
      max(0, sum(own.common.cappedCrit_, -dm.core.critRateThreshold)),
      percent(1 / dm.core.critRateStep),
      percent(subscript(char.core, dm.core.critDmgPerStep))
    )
  )
)

// Core: CRIT Rate → Daze (shared across EX Special, Special, Ultimate)
const coreDazeInc = min(
  percent(subscript(char.core, dm.core.maxDaze_)),
  prod(
    max(0, sum(own.common.cappedCrit_, -dm.core.dazeCritRateThreshold)),
    percent(1 / dm.core.dazeCritRateStep),
    percent(subscript(char.core, dm.core.dazePerStep))
  )
)

// Core: Sheer Force → ATK
const coreAtk = ownBuff.combat.atk.add(
  min(
    dm.core.maxSheerForceAtk,
    prod(own.final.sheerForce, dm.core.atkPerSheerForce)
  )
)

// M6: Per-warhead buff entries (passed as extras to specific hits)
// Armor-Piercing Warhead → +30% Daze
// High-Explosive Warhead → +30% DMG
const m6_apDaze = ownBuff.combat.dazeInc_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.daze_))
)
const m6_heDmg = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 6, percent(dm.m6.dmg_))
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Armor-Piercing Warhead hits: +30% Daze
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      1,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_apDaze
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      4,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_apDaze
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackExplosiveExperiment',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_apDaze
    ),
    // High-Explosive Warhead hits: +30% DMG
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      2,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_heDmg
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      5,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_heDmg
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackExplosiveExperiment',
      1,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      m6_heDmg
    )
  ),

  // Core Buffs
  registerBuff('core_critDmg_', coreCritDmg_, undefined, undefined, false),
  registerBuff(
    'core_exSpecial_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType('exSpecial', coreDazeInc)
  ),
  registerBuff(
    'core_special_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType('special', coreDazeInc)
  ),
  registerBuff(
    'core_ult_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType('ult', coreDazeInc)
  ),
  registerBuff('core_atk', coreAtk, undefined, undefined, false),

  // Additional Ability Buffs
  registerBuff(
    'ability_atk',
    ownBuff.combat.atk.add(
      abilityOn(
        enNahBarrage.ifOn(
          min(
            dm.ability.maxAtk,
            sum(dm.ability.atkBase, prod(char.lvl, dm.ability.atkPerLevel))
          )
        )
      )
    )
  ),
  registerBuff(
    'ability_squadDmg_',
    teamBuff.combat.common_dmg_.add(
      abilityOn(enNahBarrage.ifOn(dm.ability.squadDmg_))
    ),
    undefined,
    true
  ),

  // M1: All-attribute RES reduction
  registerBuff(
    'm1_allResRed_',
    enemyDebuff.common.resRed_.add(
      cmpGE(char.mindscape, 1, warheadHit.ifOn(dm.m1.allResRed_))
    ),
    undefined,
    true
  ),

  // M6 (listed for UI, applied via per-hit overrides above)
  registerBuff('m6_daze_', m6_apDaze, undefined, undefined, false),
  registerBuff('m6_dmg_', m6_heDmg, undefined, undefined, false)
)
export default sheet
