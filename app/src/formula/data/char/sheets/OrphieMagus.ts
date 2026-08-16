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

const key: CharacterKey = 'OrphieMagus'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { zeroedIn, zeroedIn_ability, zeroedIn_m1_dmg, ultUsed } =
  allBoolConditionals(key, undefined, {
    zeroedIn: 0,
    zeroedIn_ability: 0,
    zeroedIn_m1_dmg: 1,
    ultUsed: 2,
  })

const m1_resIgnValue = cmpGE(char.mindscape, 1, percent(dm.m1.fire_resIgn_))
const m1_corrosiveFlash_resIgn_ =
  ownBuff.combat.resIgn_.fire.add(m1_resIgnValue)
const m1_crimsonVortex_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue)
const m1_heatCharge_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue)
const m1_fieryEruption_resIgn_ = ownBuff.combat.resIgn_.fire.add(m1_resIgnValue)

const m4_dmgValue = cmpGE(char.mindscape, 4, percent(dm.m4.dmg_))
const m4_heatCharge_dmg_ = ownBuff.combat.common_dmg_.add(m4_dmgValue)
const m4_ultimate_dmg_ = ownBuff.combat.common_dmg_.add(m4_dmgValue)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Basic hits 1-2 are physical
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackHighPressureFlamethrower',
      0,
      { damageType1: 'basic' },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackHighPressureFlamethrower',
      1,
      { damageType1: 'basic' },
      'atk'
    ),
    // Basic hit 6 is aftershock
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackHighPressureFlamethrower',
      5,
      { ...baseTag, damageType1: 'basic', damageType2: 'aftershock' },
      'atk'
    ),
    // Dash attack is physical
    dmgDazeAndAnomOverride(
      dm,
      'dodge',
      'DashAttackRushCommand',
      0,
      { damageType1: 'dash' },
      'atk'
    ),
    // SpecialAttackCorrosiveFlash is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'SpecialAttackCorrosiveFlash',
      0,
      { ...baseTag, damageType1: 'special', damageType2: 'aftershock' },
      'atk',
      undefined,
      m1_corrosiveFlash_resIgn_
    ),
    // EXSpecialAttackWatchYourStep is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackWatchYourStep',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
        damageType2: 'aftershock',
      },
      'atk'
    ),
    // EXSpecialAttackCrimsonVortex is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackCrimsonVortex',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
        damageType2: 'aftershock',
      },
      'atk',
      undefined,
      m1_crimsonVortex_resIgn_
    ),
    // EXSpecialAttackHeatCharge is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackHeatCharge',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
        damageType2: 'aftershock',
      },
      'atk',
      undefined,
      m1_heatCharge_resIgn_,
      m4_heatCharge_dmg_
    ),
    // EXSpecialAttackFieryEruption is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackFieryEruption',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
        damageType2: 'aftershock',
      },
      'atk',
      undefined,
      m1_fieryEruption_resIgn_
    ),
    // ChainAttackOverheatedBarrel is an aftershock
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackOverheatedBarrel',
      0,
      {
        ...baseTag,
        damageType1: 'chain',
        damageType2: 'aftershock',
      },
      'atk'
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateDanceWithFire',
      0,
      {
        ...baseTag,
        damageType1: 'chain',
        damageType2: 'aftershock',
      },
      'atk',
      undefined,
      m4_ultimate_dmg_
    )
  ),

  ...customDmg(
    'm6_dmg',
    {
      ...baseTag,
      damageType1: 'exSpecial',
      damageType2: 'aftershock',
    },
    cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.dmg)))
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'aftershock',
      cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'core_crit_',
    ownBuff.combat.crit_.add(percent(subscript(char.core, dm.core.crit_)))
  ),
  registerBuff(
    'core_aftershock_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'aftershock',
      percent(subscript(char.core, dm.core.aftershock_dmg_))
    )
  ),
  registerBuff(
    'core_atk',
    teamBuff.combat.atk.add(
      zeroedIn.ifOn(
        min(
          subscript(char.core, dm.core.max_atk),
          sum(
            subscript(char.core, dm.core.atk),
            prod(
              max(sum(own.initial.enerRegen, -dm.core.enerRegen_threshold), 0),
              constant(10),
              dm.core.add_atk
            )
          )
        )
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_aftershock_defIgn_',
    teamBuff.combat.defIgn_.addWithDmgType(
      'aftershock',
      cmpGE(
        sum(
          team.common.count.withSpecialty('stun'),
          team.common.count.withSpecialty('support')
        ),
        1,
        zeroedIn_ability.ifOn(percent(dm.ability.aftershock_defIgn_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_corrosiveFlash_resIgn_',
    m1_corrosiveFlash_resIgn_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_crimsonVortex_resIgn_',
    m1_crimsonVortex_resIgn_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_heatCharge_resIgn_',
    m1_heatCharge_resIgn_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_fieryEruption_resIgn_',
    m1_fieryEruption_resIgn_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_common_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 1, zeroedIn_m1_dmg.ifOn(percent(dm.m1.dmg_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_atk_',
    ownBuff.combat.atk_.add(
      cmpGE(char.mindscape, 2, ultUsed.ifOn(percent(dm.m2.atk_)))
    )
  ),
  registerBuff(
    'm4_heatCharge_dmg_',
    m4_heatCharge_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff('m4_ultimate_dmg_', m4_ultimate_dmg_, undefined, false, false)
)
export default sheet
