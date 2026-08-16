import { cmpGE, prod, subscript, sum } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  allNumConditionals,
  customSheerDmg,
  enemyDebuff,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Banyue'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { tremor, coreExSpecialFollowUpUsed, m2ExSpecialFollowUpUsed } =
  allBoolConditionals(key, undefined, {
    tremor: 1,
    coreExSpecialFollowUpUsed: 0,
    m2ExSpecialFollowUpUsed: 2,
  })
const { abilityVidyaraja, m6Vidyaraja } = allNumConditionals(
  key,
  true,
  0,
  dm.ability.maxStacks,
  undefined,
  { abilityVidyaraja: 0, m6Vidyaraja: 6 }
)

const m1_sheerDmg = cmpGE(
  char.mindscape,
  1,
  tremor.ifOn(percent(dm.m1.sheer_dmg_))
)

const m1_exSpecial_sheer_dmg_ = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'exSpecial',
  m1_sheerDmg
)
const m1_basic_sheer_dmg_ = ownBuff.combat.sheer_dmg_.addWithDmgType(
  'basic',
  m1_sheerDmg
)
const m4_dmg = cmpGE(char.mindscape, 4, percent(dm.m4.dmg_))
const m4_topplingMountain_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  m4_dmg
)
const m4_crushingPeaks_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  m4_dmg
)
const m4_lionsRoarWrath_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  m4_dmg
)
const m4_mountainTremorWrath_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  m4_dmg
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackTopplingMountain',
      0,
      {
        ...baseTag,
        damageType1: 'basic',
      },
      'sheerForce',
      undefined,
      ...m1_basic_sheer_dmg_,
      ...m4_topplingMountain_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackCrushingPeaks',
      0,
      {
        ...baseTag,
        damageType1: 'basic',
      },
      'sheerForce',
      undefined,
      ...m1_basic_sheer_dmg_,
      ...m4_crushingPeaks_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackLionsRoar',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
      },
      'sheerForce',
      undefined,
      ...m1_exSpecial_sheer_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackLionsRoarWrath',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
      },
      'sheerForce',
      undefined,
      ...m1_exSpecial_sheer_dmg_,
      ...m4_lionsRoarWrath_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackMountainTremor',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
      },
      'sheerForce',
      undefined,
      ...m1_exSpecial_sheer_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackMountainTremorWrath',
      0,
      {
        ...baseTag,
        damageType1: 'exSpecial',
      },
      'sheerForce',
      undefined,
      ...m1_exSpecial_sheer_dmg_,
      ...m4_mountainTremorWrath_dmg_
    )
  ),

  ...customSheerDmg(
    'm6_dmg',
    { ...baseTag, damageType1: 'elemental' },
    cmpGE(char.mindscape, 6, prod(own.final.sheerForce, percent(dm.m6.dmg)))
  ),

  // Buffs
  registerBuff(
    'core_hpSheerForce',
    ownBuff.initial.sheerForce.add(
      prod(own.final.hp, dm.core.sheerForcePerStep)
    )
  ),
  registerBuff(
    'core_sheerForce',
    ownBuff.combat.sheerForce.add(
      coreExSpecialFollowUpUsed.ifOn(subscript(char.core, dm.core.sheerForce))
    )
  ),
  registerBuff(
    'core_fire_dmg_',
    ownBuff.combat.dmg_.fire.add(
      coreExSpecialFollowUpUsed.ifOn(
        percent(subscript(char.core, dm.core.fire_dmg_))
      )
    )
  ),
  registerBuff(
    'core_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      coreExSpecialFollowUpUsed.ifOn(
        percent(subscript(char.core, dm.core.crit_dmg_))
      )
    )
  ),
  registerBuff(
    'ability_fire_dmg_',
    ownBuff.combat.dmg_.fire.add(
      cmpGE(
        sum(
          team.common.count.withSpecialty('support'),
          team.common.count.withSpecialty('stun'),
          cmpGE(char.mindscape, 6, 1)
        ),
        1,
        prod(abilityVidyaraja, percent(dm.ability.fire_dmg_))
      )
    )
  ),
  registerBuff(
    'm6_fire_dmg_',
    ownBuff.combat.dmg_.fire.add(
      cmpGE(char.mindscape, 6, prod(m6Vidyaraja, percent(dm.m6.fire_dmg_)))
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm1_fire_resRed_',
    enemyDebuff.common.resRed_.fire.add(
      cmpGE(char.mindscape, 1, tremor.ifOn(percent(dm.m1.fire_resRed_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_topplingMountain_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('basic', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_crushingPeaks_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('basic', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_lionsRoar_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('exSpecial', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_lionsRoarWrath_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('exSpecial', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_mountainTremor_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('exSpecial', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm1_mountainTremorWrath_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.addWithDmgType('exSpecial', m1_sheerDmg),
    undefined,
    false,
    false
  ),
  registerBuff(
    'm2_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(
        char.mindscape,
        2,
        m2ExSpecialFollowUpUsed.ifOn(percent(dm.m2.crit_dmg_))
      )
    )
  ),
  registerBuff(
    'm2_fire_dmg_',
    ownBuff.combat.dmg_.fire.add(
      cmpGE(
        char.mindscape,
        2,
        m2ExSpecialFollowUpUsed.ifOn(percent(dm.m2.fire_dmg_))
      )
    )
  ),
  registerBuff(
    'm4_topplingMountain_dmg_',
    m4_topplingMountain_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm4_crushingPeaks_dmg_',
    m4_crushingPeaks_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm4_lionsRoarWrath_dmg_',
    m4_lionsRoarWrath_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm4_mountainTremorWrath_dmg_',
    m4_mountainTremorWrath_dmg_,
    undefined,
    false,
    false
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.sheer_dmg_.add(
      cmpGE(char.mindscape, 6, prod(own.final.sheerForce, percent(dm.m6.dmg)))
    ),
    undefined,
    undefined,
    false
  )
)
export default sheet
