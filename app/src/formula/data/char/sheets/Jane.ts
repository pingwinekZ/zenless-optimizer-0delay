import {
  cmpGE,
  constant,
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
  customDmg,
  notOwnBuff,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  teamBuff,
} from '../../util'
import { entriesForChar, getBaseTag, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Jane'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const {
  passion,
  m1_passion,
  m6_passion,
  core_gnawed,
  m2_gnawed,
  assault_or_disorder_triggered,
} = allBoolConditionals(key, undefined, {
  m1_passion: 1,
  m6_passion: 6,
  m2_gnawed: 2,
  assault_or_disorder_triggered: 4,
})
const { potential_assault_triggered } = allBoolConditionals(key)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  ...customDmg(
    'm6_additional_dmg',
    { ...baseTag, damageType1: 'elemental' },
    cmpGE(char.mindscape, 6, prod(own.final.anomProf, percent(dm.m6.dmg)))
  ),

  // Buffs
  registerBuff(
    'passion_atk',
    ownBuff.combat.atk.add(
      passion.ifOn(
        min(
          prod(max(0, sum(own.final.anomProf, constant(-120))), constant(2)),
          constant(600)
        )
      ) // No data in dm
    )
  ),
  registerBuff(
    'core_assault_crit_',
    teamBuff.combat.anom_crit_.physical.add(
      core_gnawed.ifOn(
        sum(
          percent(subscript(char.core, dm.core.assault_crit_)),
          prod(
            own.final.anomProf,
            percent(subscript(char.core, dm.core.assault_crit_step))
          )
        )
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'core_assault_crit_dmg_',
    teamBuff.combat.anom_crit_dmg_.physical.add(
      core_gnawed.ifOn(subscript(char.core, dm.core.assault_crit_dmg_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_common_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpGE(
        char.mindscape,
        1,
        m1_passion.ifOn(
          min(
            percent(dm.m1.max_dmg_),
            prod(own.final.anomProf, percent(dm.m1.anomProf_step))
          )
        )
      )
    )
  ),
  registerBuff(
    'm2_defIgn_',
    ownBuff.combat.defIgn_.add(
      cmpGE(char.mindscape, 2, m2_gnawed.ifOn(dm.m2.defIgn_))
    )
  ),
  registerBuff(
    'm2_assault_defIgn_',
    notOwnBuff.combat.defIgn_.physical.addWithDmgType(
      'anomaly',
      cmpGE(char.mindscape, 2, m2_gnawed.ifOn(dm.m2.defIgn_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_assault_crit_dmg_',
    teamBuff.combat.anom_crit_dmg_.physical.add(
      cmpGE(char.mindscape, 2, m2_gnawed.ifOn(dm.m2.assault_crit_dmg_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_anomaly_dmg_',
    teamBuff.combat.buff_.addWithDmgType(
      'anomaly',
      cmpGE(
        char.mindscape,
        4,
        assault_or_disorder_triggered.ifOn(dm.m4.anomaly_dmg_)
      )
    )
  ),
  registerBuff(
    'm6_crit_',
    ownBuff.combat.crit_.add(
      cmpGE(char.mindscape, 6, m6_passion.ifOn(dm.m6.crit_))
    )
  ),
  registerBuff(
    'm6_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(char.mindscape, 6, m6_passion.ifOn(dm.m6.crit_dmg_))
    )
  ),
  registerBuff(
    'potential_assault_crit_dmg_',
    teamBuff.combat.anom_crit_dmg_.physical.add(
      potential_assault_triggered.ifOn(dm.potential.assault_crit_dmg_[6])
    ),
    undefined,
    true
  )
)
export default sheet
