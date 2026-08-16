import {
  cmpGE,
  constant,
  max,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customAnomalyDmg,
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

const key: CharacterKey = 'Aria'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { m2Delusion, m6Delusion, etherVeil } = allBoolConditionals(
  key,
  undefined,
  { m2Delusion: 2, m6Delusion: 6 }
)

const m6_perfectPitch_dmg_ = ownBuff.combat.dmg_.ether.add(
  cmpGE(char.mindscape, 6, m6Delusion.ifOn(percent(dm.m6.enhancedDmg)))
)
const m6_ult_dmg_ = ownBuff.combat.dmg_.ether.add(
  cmpGE(char.mindscape, 6, m6Delusion.ifOn(percent(dm.m6.enhancedDmg)))
)

const sheet = register(
  key,
  entriesForChar(data_gen),
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackPerfectPitch',
      4,
      { ...baseTag, attribute: 'ether', damageType1: 'basic' },
      'atk',
      undefined,
      m6_perfectPitch_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'Ultimate100Energy',
      0,
      { ...baseTag, attribute: 'ether', damageType1: 'ult' },
      'atk',
      undefined,
      m6_ult_dmg_
    )
  ),
  ...customAnomalyDmg(
    'perfectPitchAbloomDmgInst',
    {
      attribute: data_gen.attribute,
      damageType1: 'anomaly',
      damageType2: 'abloom',
    },
    prod(
      percent(subscript(char.core, dm.core.abloomEther)),
      percent(0.1),
      own.initial.anomMas,
      constant(0.625),
      own.final.atk,
      sum(percent(1), own.final.anom_mv_mult_)
    )
  ),
  registerBuff(
    'core_anomProf',
    ownBuff.combat.anomProf.add(subscript(char.core, dm.core.anomProf))
  ),
  registerBuff(
    'm1_abloom',
    ownBuff.combat.anom_crit_.add(
      cmpGE(
        char.mindscape,
        1,
        sum(
          constant(dm.m1.abloomCrit),
          max(
            0,
            prod(
              max(0, sum(own.initial.anomMas, -dm.m1.anomMasteryThreshold)),
              percent(dm.m1.critPerExcessMastery)
            )
          )
        )
      )
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm1_abloom_crit_dmg',
    ownBuff.combat.anom_crit_dmg_.add(
      cmpGE(char.mindscape, 1, constant(dm.m1.abloomCritDmg))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm2_defIgn_base',
    ownBuff.combat.defIgn_.add(cmpGE(char.mindscape, 2, constant(dm.m2.defIgn)))
  ),
  registerBuff(
    'm2_defIgn_delusion',
    ownBuff.combat.defIgn_.add(
      cmpGE(char.mindscape, 2, m2Delusion.ifOn(constant(dm.m2.delusionDefIgn)))
    )
  ),
  registerBuff(
    'm6_perfectPitch_dmg_',
    m6_perfectPitch_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_ult_dmg_', m6_ult_dmg_, undefined, undefined, false),
  registerBuff(
    'ultimate_atk',
    teamBuff.combat.atk.add(etherVeil.ifOn(constant(50))),
    undefined,
    true
  )
)

export default sheet
