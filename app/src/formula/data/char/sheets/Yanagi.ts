import {
  cmpEq,
  cmpGE,
  constant,
  max,
  min,
  type NumNode,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import { anomTimePassed } from '../../common/anomaly'
import {
  allBoolConditionals,
  allNumConditionals,
  customAnomalyDmg,
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
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Yanagi'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const {
  exSpecial_used,
  jougen,
  kagen,
  clarity,
  exposed,
  shinrabanshou,
  ability_active,
  polarityDisorder,
} = allBoolConditionals(key, undefined, {
  clarity: 1,
  exposed: 4,
  shinrabanshou: 6,
})
const { perSkill_thrusts } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.max_stacks,
  undefined,
  { perSkill_thrusts: 0 }
)

// Ability condition: another squad member is Anomaly or shares Electric attribute.
// Yanagi is anomaly+electric, so sum(anomaly, electric) >= 3 means ≥1 other qualifies.
const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(team.common.count.withSpecialty('anomaly'), team.common.count.electric),
    3,
    node
  )

// Disorder time decay multiplier for electric
const disorderTimeDecay = prod(
  max(0, sum(constant(10), prod(constant(-1), anomTimePassed))),
  percent(1.25)
)

// Polarity Disorder base: (4.5% + addl_disorder_ + time_decay) * ATK
const polarityBase = prod(
  sum(percent(4.5), own.final.addl_disorder_, disorderTimeDecay),
  own.final.atk
)

// Extra thrust stacks: 0 without M2, m2.max_stacks (2) at M2, m6.max_stacks (4) at M6
const maxExtraThrusts = cmpGE(
  char.mindscape,
  2,
  cmpGE(char.mindscape, 6, dm.m6.max_stacks, dm.m2.max_stacks),
  0
)

// Polarity Disorder MV: base 100% + polarity MV% + thrust scaling
// The original code: sum(percent(1), percent(dm.m2.polarity_disorder_mv_), ...)
// which gives 1.0 + 0.20 = 1.20 at M2 base, 1.85 at max thrusts.
const polarityMV = cmpEq(
  polarityDisorder.ifOn(1),
  0,
  0,
  sum(
    percent(1),
    percent(dm.m2.polarity_disorder_mv_),
    prod(
      min(maxExtraThrusts, perSkill_thrusts),
      percent(dm.m2.add_polarity_disorder_mv_)
    )
  )
)

// Flat AP component: (5% + chain*2.25%) * anomProf
const polarityFlatAP = prod(
  sum(percent(5), prod(char.chain, percent(2.25))),
  own.final.anomProf
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic Jougen 1-2 hits are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'StanceJougen',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'StanceJougen',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Basic Kagen 1-2 hits are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'StanceKagen',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'StanceKagen',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dash attack is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackFleetingFlight',
      0,
      { damageType1: 'basic' },
      'atk'
    )
  ),

  // Polarity Disorder formulas
  // Chain version: base disorder * fixed 85% MV (no thrust scaling)
  ...customAnomalyDmg(
    'polarity_dmg_chain',
    { attribute: 'electric', damageType1: 'disorder' },
    prod(polarityBase, percent(0.85))
  ),
  registerBuff(
    'polarity_dmg_chain',
    ownBuff.combat.anom_base_.addWithDmgType(
      'disorder',
      polarityDisorder.ifOn(percent(1))
    ),
    undefined,
    undefined,
    false
  ),
  // Special version: base disorder * thrusts-scaled MV
  // MV = 1.0 + polarityMV (so 120% at base, 185% at max thrusts)
  ...customAnomalyDmg(
    'polarity_dmg',
    { attribute: 'electric', damageType1: 'disorder' },
    prod(polarityBase, polarityMV)
  ),
  registerBuff(
    'polarity_dmg',
    ownBuff.combat.anom_base_.addWithDmgType(
      'disorder',
      polarityDisorder.ifOn(percent(1))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'basic_electric_dmg_',
    ownBuff.combat.dmg_.electric.add(jougen.ifOn(percent(0.1)))
  ),
  registerBuff('basic_pen_', ownBuff.combat.pen_.add(kagen.ifOn(percent(0.1)))),
  registerBuff(
    'polarity_anom_flat_dmg',
    ownBuff.combat.anom_flat_dmg.addWithDmgType(
      'disorder',
      polarityDisorder.ifOn(polarityFlatAP)
    ),
    undefined,
    false
  ),
  registerBuff(
    'core_addl_disorder_',
    teamBuff.combat.addl_disorder_.add(
      exSpecial_used.ifOn(percent(subscript(char.core, dm.core.addl_disorder_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'core_electric_dmg_',
    ownBuff.combat.dmg_.electric.add(
      exSpecial_used.ifOn(percent(subscript(char.core, dm.core.electric_dmg_)))
    )
  ),
  registerBuff(
    'm1_anomProf',
    ownBuff.combat.anomProf.add(
      cmpGE(char.mindscape, 1, clarity.ifOn(percent(dm.m1.anomProf)))
    )
  ),
  registerBuff(
    'm4_pen_',
    teamBuff.combat.pen_.add(
      cmpGE(char.mindscape, 4, exposed.ifOn(percent(dm.m4.pen_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm6_exSpecial_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'exSpecial',
      cmpGE(
        char.mindscape,
        6,
        shinrabanshou.ifOn(percent(dm.m6.exSpecial_dmg_))
      )
    )
  ),
  registerBuff(
    'ability_electric_anomBuildup_',
    ownBuff.combat.anomBuildup_.electric.add(
      abilityCheck(
        ability_active.ifOn(percent(dm.ability.electric_anomBuildup_))
      )
    )
  )
)
export default sheet
