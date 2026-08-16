import type { NumNode } from '@zenless-optimizer/pando/engine'
import { cmpGE, subscript, sum } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
} from '../../util'
import { entriesForChar, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Pyrois'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

// Conditionals
const { sunflare } = allBoolConditionals(key)

// Ability check: party has a Stun or Support character
const ability_check = (a: number | NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('stun'),
      team.common.count.withSpecialty('support')
    ),
    1,
    a
  )

// Core Passive: Lower Branch — Sunflare (Ult: Triumphant Return)
// Energy Generation Rate +15%, DMG dealt +20-40% (core-scaled)
const sunflare_enerRegen_ = ownBuff.initial.enerRegen_.add(
  sunflare.ifOn(dm.core.sunflareEnerRegen)
)
const sunflare_common_dmg_ = ownBuff.combat.common_dmg_.add(
  sunflare.ifOn(percent(subscript(char.core, dm.core.sunflareDmg_)))
)

// Additional Ability: Glorious Legion
// +40% CRIT DMG when Stun or Support in squad
const ability_crit_dmg_ = ownBuff.combat.crit_dmg_.add(
  ability_check(percent(dm.ability.crit_dmg_))
)

// Mindscape 1: +8% CRIT Rate on entering battle
const m1_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 1, percent(dm.m1.crit_))
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  // Buffs
  registerBuff(
    'sunflare_enerRegen_',
    sunflare_enerRegen_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'sunflare_common_dmg_',
    sunflare_common_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff('ability_crit_dmg_', ability_crit_dmg_),
  registerBuff('m1_crit_', m1_crit_)
)
export default sheet
