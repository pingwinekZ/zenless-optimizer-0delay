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
  customDmg,
  enemyDebuff,
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

const key: CharacterKey = 'JuFufu'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

// Tiger's Roar state is split into 4 bool conditionals (ATK→CD+M2 CD, DMG,
// Impact, plus M4 CD) so each buff group can be toggled independently in the
// UI. They are linked in the UI sheet, so toggling any one of them flips all
// four together. M2/M4 CD only apply while in Tiger's Roar (per their game
// text); M2 is folded into the ATK→CD conditional since both grant team CD.
const {
  tigers_roar_atkToCd,
  tigers_roar_dmg,
  tigers_roar_impact,
  tigers_roar_m4_cd,
  m1_chain_stun,
} = allBoolConditionals(key, undefined, {
  tigers_roar_m4_cd: 4,
  m1_chain_stun: 1,
})

const core_crit_dmg_ = teamBuff.combat.crit_dmg_.add(
  tigers_roar_atkToCd.ifOn(
    sum(
      percent(subscript(char.core, dm.core.crit_dmg_)),
      min(
        percent(dm.core.max_crit_dmg_),
        prod(
          max(0, sum(own.final.atk, -dm.core.atk_threshold)),
          percent(dm.core.additional_crit_dmg_),
          percent(1 / dm.core.atk_step)
        )
      ),
      // M2: additional team CRIT DMG while in Tiger's Roar — folded into the
      // parent buff (§3.10), so the field shows the base value at M0-1 and
      // grows once M2 is enabled.
      cmpGE(char.mindscape, 2, percent(dm.m2.crit_dmg_))
    )
  )
)
const core_chain_dmg_ = teamBuff.combat.dmg_.addWithDmgType(
  'chain',
  tigers_roar_dmg.ifOn(percent(subscript(char.core, dm.core.chain_dmg_)))
)
const core_ult_dmg_ = teamBuff.combat.dmg_.addWithDmgType(
  'ult',
  tigers_roar_dmg.ifOn(percent(subscript(char.core, dm.core.ult_dmg_)))
)
const core_impact = ownBuff.combat.impact.add(
  tigers_roar_impact.ifOn(percent(subscript(char.core, dm.core.impact)))
)
const m1_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 1, percent(dm.m1.crit_))
)
// M1: Stun DMG Multiplier while the target is stunned (Roxy/Trigger
// pattern). Only stun_ is registered (no unstun_); the Might gain and stun
// duration have no optimizer effect.
const m1_stun = cmpGE(
  char.mindscape,
  1,
  m1_chain_stun.ifOn(percent(dm.m1.stun_))
)
const m4_crit_dmg_ = ownBuff.combat.crit_dmg_.add(
  tigers_roar_m4_cd.ifOn(cmpGE(char.mindscape, 4, percent(dm.m4.crit_dmg_)))
)
const m6_chain_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'chain',
  cmpGE(char.mindscape, 6, percent(dm.m6.chain_dmg_))
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic Attack 1-2 hits are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackTigerSevenFormsFlamingClaw',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackTigerSevenFormsFlamingClaw',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Dash attack Tiger Seven Forms Tiger Charge is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackTigerSevenFormsTigerCharge',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Dash Attack Tiger Seven Forms Mountain King's Game is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackTigerSevenFormsMountainKingsGame',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // Chain Attack Suppressing Tiger Cauldron is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackSuppressingTigerCauldron',
      0,
      { ...baseTag, damageType1: 'chain', damageType2: 'aftershock' },
      'atk'
    )
  ),

  // M6: 3 popcorns, each dealing 160% of ATK as Fire DMG treated as Chain
  // Attack DMG.
  // Registers the actual damage formula + a display buff (like Dialyn's
  // m6_dmg) so it shows as an "Additional DMG" passive in the M6 sheet.
  ...customDmg(
    'm6_dmg',
    { attribute: 'fire', damageType1: 'chain' },
    cmpGE(
      char.mindscape,
      6,
      prod(own.final.atk, percent(dm.m6.dmg), dm.m6.popcorn)
    )
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'chain',
      cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff('core_crit_dmg_', core_crit_dmg_, undefined, true),
  registerBuff('core_chain_dmg_', core_chain_dmg_, undefined, true),
  registerBuff('core_ult_dmg_', core_ult_dmg_, undefined, true),
  registerBuff('core_impact', core_impact),
  registerBuff('m1_crit_', m1_crit_),
  registerBuff(
    'm1_stun_',
    enemyDebuff.common.stun_.add(m1_stun),
    undefined,
    true
  ),
  registerBuff('m4_crit_dmg_', m4_crit_dmg_),
  registerBuff('m6_chain_dmg_', m6_chain_dmg_)
)
export default sheet
