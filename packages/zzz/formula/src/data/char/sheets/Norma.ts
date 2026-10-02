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
  customDmg,
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
  hitBuff,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Norma'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

// Conditionals
const { enNahBarrage_atk, enNahBarrage_dmg, warheadHit } = allBoolConditionals(
  key,
  undefined,
  {
    warheadHit: 1,
  }
)
const { tech_divide_stacks } = allNumConditionals(
  key,
  true, // int only
  0,
  dm.ability.maxTechDivideStacks
)

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

// Additional Ability: Tech Divide — Stun DMG Multiplier per stack.
// M2 raises the per-stack value (folded into the parent buff, so the field
// shows the base value at M0-1 and grows once M2 is enabled). The +2s Stun
// duration has no optimizer effect.
const ability_stun = abilityOn(
  prod(
    tech_divide_stacks,
    cmpGE(
      char.mindscape,
      2,
      percent(dm.m2.stunDmgMultPerStack_),
      percent(dm.ability.stunDmgMultPerStack_)
    )
  )
)

// M6: Per-warhead buff entries (passed as extras to specific hits)
// Armor-Piercing Warhead → +30% Daze
// High-Explosive Warhead → +30% DMG
const m6_apDaze_ = ownBuff.combat.dazeInc_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 6, percent(dm.m6.daze_))
)
const m6_heDmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
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
      ...m6_apDaze_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      4,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ...m6_apDaze_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackExplosiveExperiment',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ...m6_apDaze_
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
      ...m6_heDmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnNahBarrage',
      5,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ...m6_heDmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackExplosiveExperiment',
      1,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ...m6_heDmg_
    )
  ),

  // M6 missile barrage (considered Ultimate DMG)
  ...customDmg(
    'm6_missile_dmg',
    { ...baseTag, damageType1: 'ult' },
    cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.missileDmg)))
  ),
  registerBuff(
    'm6_missile_dmg',
    ownBuff.combat.dmg_.fire.addWithDmgType(
      'ult',
      cmpGE(char.mindscape, 6, percent(dm.m6.missileDmg))
    ),
    undefined,
    undefined,
    false
  ),

  // Core Buffs
  registerBuff('core_critDmg_', coreCritDmg_),
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
  registerBuff('core_atk', coreAtk),

  // Additional Ability Buffs
  registerBuff(
    'ability_stun_',
    enemyDebuff.common.stun_.add(ability_stun),
    undefined,
    true
  ),
  registerBuff(
    'ability_atk',
    ownBuff.combat.atk.add(
      abilityOn(
        enNahBarrage_atk.ifOn(
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
      abilityOn(enNahBarrage_dmg.ifOn(dm.ability.squadDmg_))
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
  hitBuff('m6_daze_', m6_apDaze_),
  hitBuff('m6_dmg_', m6_heDmg_)
)
export default sheet
