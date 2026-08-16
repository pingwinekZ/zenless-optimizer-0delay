import { cmpGE, prod, subscript, sum } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customShield,
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
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Caesar'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const {
  stance_switch,
  enemy_shielded,
  core_radiant_aegis,
  m1_radiant_aegis,
  m2_radiant_aegis,
  can_defensive_assist,
  ability_debuff,
  exSpecial_assistFollowup_used,
} = allBoolConditionals(key, undefined, {
  m1_radiant_aegis: 1,
  m2_radiant_aegis: 2,
  exSpecial_assistFollowup_used: 6,
})

const m6_exSpecial_assistFollowup_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 6, percent(1))
)
const m6_dmg_ = ownBuff.combat.common_dmg_.add(
  cmpGE(char.mindscape, 6, dm.m6.dmg_)
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackOverpoweredShieldBash',
      0,
      { damageType1: 'exSpecial' },
      'atk',
      undefined,
      m6_exSpecial_assistFollowup_crit_,
      m6_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'assist',
      'AssistFollowUpAidingBlade',
      0,
      { damageType1: 'assistFollowUp' },
      'atk',
      undefined,
      m6_exSpecial_assistFollowup_crit_,
      m6_dmg_
    )
  ),

  customShield(
    'core_shield',
    sum(
      prod(own.initial.impact, percent(subscript(char.core, dm.core.shield_))),
      subscript(char.core, dm.core.shield)
    )
  ),

  // Buffs
  registerBuff(
    'stance_switch_impact_',
    ownBuff.combat.impact_.add(
      stance_switch.ifOn(sum(percent(0.08), prod(char.special, percent(0.01))))
    )
  ),
  registerBuff(
    'ult_dazeInc_',
    ownBuff.combat.dazeInc_.addWithDmgType(
      'ult',
      enemy_shielded.ifOn(sum(percent(0.4), prod(char.chain, percent(0.05))))
    )
  ),
  registerBuff(
    'core_atk',
    teamBuff.combat.atk.add(
      core_radiant_aegis.ifOn(
        prod(
          subscript(char.core, dm.core.atk),
          cmpGE(
            char.mindscape,
            2,
            m2_radiant_aegis.ifOn(percent(dm.m2.atk_increase_), percent(1)),
            percent(1)
          )
        )
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_dmgInc_',
    enemyDebuff.common.dmgInc_.add(
      cmpGE(
        sum(
          can_defensive_assist.ifOn(1, 0),
          team.common.count.withFaction('SonsOfCalydon')
        ),
        2,
        ability_debuff.ifOn(dm.ability.dmg_)
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_resRed_',
    enemyDebuff.common.resRed_.add(
      cmpGE(char.mindscape, 1, m1_radiant_aegis.ifOn(dm.m1.attrRes_))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_enerRegen_',
    ownBuff.combat.enerRegen_.add(m2_radiant_aegis.ifOn(dm.m2.enerRegen_))
  ),
  registerBuff(
    'm6_exSpecial_assistFollowup_crit_',
    m6_exSpecial_assistFollowup_crit_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_dmg_', m6_dmg_, undefined, undefined, false),
  registerBuff(
    'm6_crit_',
    ownBuff.combat.crit_.add(
      cmpGE(char.mindscape, 6, exSpecial_assistFollowup_used.ifOn(dm.m6.crit_))
    )
  ),
  registerBuff(
    'm6_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(
        char.mindscape,
        6,
        exSpecial_assistFollowup_used.ifOn(dm.m6.crit_dmg_)
      )
    )
  )
)
export default sheet
