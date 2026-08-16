import {
  cmpGE,
  constant,
  min,
  prod,
  subscript,
} from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  enemyDebuff,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  teamBuff,
} from '../../util'
import { entriesForChar, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Sunna'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const {
  boolConditional,
  etherVeil,
  etherVeilReprise,
  focusedCreation,
  ult_used,
} = allBoolConditionals(key, undefined, {
  etherVeil: 2,
  ult_used: 4,
  focusedCreation: 6,
})
const { m1DefReductionStacks } = allNumConditionals(
  key,
  true,
  0,
  3,
  undefined,
  { m1DefReductionStacks: 1 }
)

const m6_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 6, focusedCreation.ifOn(1))
)
const m6_crit_dmg_ = ownBuff.combat.crit_dmg_.add(
  cmpGE(
    char.mindscape,
    6,
    focusedCreation.ifOn(
      min(
        percent(dm.m6.maxCritEx),
        prod(own.initial.atk, percent(dm.m6.critexPerAtk))
      )
    )
  )
)

const sheet = register(
  key,
  entriesForChar(data_gen),
  ...registerAllDmgDazeAndAnom(key, dm),

  // Buffs
  registerBuff(
    'core_atk',
    teamBuff.combat.atk.add(
      boolConditional.ifOn(
        min(
          subscript(char.core, dm.core.maxAtkBonus),
          prod(own.initial.atk, percent(dm.core.atk_))
        )
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_atk_flat',
    teamBuff.combat.atk.add(etherVeilReprise.ifOn(constant(50))),
    undefined,
    true
  ),
  registerBuff(
    'm1_defRed_',
    enemyDebuff.common.defRed_.add(
      cmpGE(char.mindscape, 1, prod(m1DefReductionStacks, constant(0.07)))
    )
  ),
  registerBuff(
    'm2_etherVeil_atk',
    teamBuff.combat.atk_.add(
      cmpGE(char.mindscape, 2, etherVeil.ifOn(percent(0.1)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 4, ult_used.ifOn(percent(dm.m4.squadDmg_)))
    ),
    undefined,
    true
  ),
  registerBuff('m6_crit_', m6_crit_),
  registerBuff('m6_crit_dmg_', m6_crit_dmg_)
)
export default sheet
