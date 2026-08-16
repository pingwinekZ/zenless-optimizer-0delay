import {
  cmpGE,
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

const key: CharacterKey = 'Yanagi'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const {
  exSpecial_used,
  jougen,
  kagen,
  clarity,
  exposed,
  shinrabanshou,
  polarityDisorder,
} = allBoolConditionals(key, undefined, { clarity: 1, exposed: 4 })
const { perSkill_thrusts } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.max_stacks,
  undefined,
  { perSkill_thrusts: 0 }
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
    ),
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackGekkaRuten',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'atk'
    )
  ),

  // Buffs
  registerBuff(
    'basic_electric_dmg_',
    ownBuff.combat.dmg_.electric.add(jougen.ifOn(percent(0.1)))
  ),
  registerBuff('basic_pen_', ownBuff.combat.pen_.add(kagen.ifOn(percent(0.1)))),
  registerBuff(
    'polarity_anom_base_',
    ownBuff.combat.anom_base_.addWithDmgType(
      'disorder',
      polarityDisorder.ifOn(
        cmpGE(
          char.mindscape,
          2,
          sum(
            sum(percent(1), percent(dm.m2.polarity_disorder_mv_)),
            prod(
              min(
                cmpGE(char.mindscape, 6, dm.m6.max_stacks, dm.m2.max_stacks),
                perSkill_thrusts
              ),
              percent(dm.m2.add_polarity_disorder_mv_)
            )
          ),
          percent(0.85)
        )
      )
    ),
    undefined,
    false
  ),
  registerBuff(
    'polarity_anom_flat_dmg',
    ownBuff.combat.anom_flat_dmg.addWithDmgType(
      'disorder',
      polarityDisorder.ifOn(
        prod(
          sum(percent(5), prod(char.chain, percent(2.25))),
          own.final.anomProf
        )
      )
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
      shinrabanshou.ifOn(percent(dm.m6.exSpecial_dmg_))
    )
  )
)
export default sheet
