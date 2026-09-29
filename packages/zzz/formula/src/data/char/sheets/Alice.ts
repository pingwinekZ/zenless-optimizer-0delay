import { cmpGE, max, prod, sum } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
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
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Alice'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { assault_triggered, physical_anomaly_enemy } = allBoolConditionals(
  key,
  undefined,
  {
    assault_triggered: 1,
    physical_anomaly_enemy: 2,
  }
)

const m4_basic_physical_anomBuildup_ =
  ownBuff.combat.anomBuildup_.physical.addWithDmgType(
    'basic',
    cmpGE(char.mindscape, 4, percent(dm.m4.physical_anomBuildup_))
  )
const m6_crit_ = ownBuff.combat.crit_.add(cmpGE(char.mindscape, 6, percent(1)))

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Only the enhanced 5th hit needs an override (M4 buildup wired in below)
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackCelestialOverture',
      5,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      undefined,
      ...m4_basic_physical_anomBuildup_
    )
  ),

  ...customDmg(
    'm6_dmg',
    { attribute: 'physical', damageType1: 'elemental' },
    cmpGE(char.mindscape, 6, prod(own.final.anomProf, percent(dm.m6.dmg))),
    undefined,
    m6_crit_
  ),

  // Buffs
  registerBuff(
    'ability_anomProf',
    ownBuff.combat.anomProf.add(
      cmpGE(
        sum(
          team.common.count.withSpecialty('anomaly'),
          team.common.count.withSpecialty('support')
        ),
        2,
        prod(
          max(0, sum(own.final.anomMas, -dm.ability.anomMas_threshold)),
          percent(dm.ability.anomProf)
        )
      )
    )
  ),
  registerBuff(
    'm1_defRed_',
    enemyDebuff.common.defRed_.add(
      cmpGE(char.mindscape, 1, assault_triggered.ifOn(percent(dm.m1.defRed_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_assault_dmg_',
    teamBuff.combat.dmg_.physical.addWithDmgType(
      'anomaly',
      cmpGE(char.mindscape, 2, percent(dm.m2.physical_buff_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_disorder_dmg_',
    teamBuff.combat.dmg_.addWithDmgType(
      'disorder',
      cmpGE(
        char.mindscape,
        2,
        physical_anomaly_enemy.ifOn(percent(dm.m2.disorder_buff_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_phys_resIgn_',
    ownBuff.combat.resIgn_.physical.add(
      cmpGE(char.mindscape, 4, percent(dm.m4.physical_resIgn_))
    )
  ),
  registerBuff(
    'm4_basic_physical_anomBuildup_',
    m4_basic_physical_anomBuildup_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_crit_', m6_crit_, undefined, undefined, false),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'elemental',
      cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
    ),
    undefined,
    undefined,
    false
  )
)
export default sheet
