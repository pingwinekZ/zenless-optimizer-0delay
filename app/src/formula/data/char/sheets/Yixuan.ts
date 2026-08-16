import type { NumNode } from '@zenless-optimizer/pando/engine'
import { cmpGE, prod, subscript, sum } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import { isStunned } from '../../common/enemy'
import {
  allBoolConditionals,
  allNumConditionals,
  customSheerDmg,
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

const key: CharacterKey = 'Yixuan'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { meditation, m6_meditation } = allBoolConditionals(key, undefined, {
  meditation: 6,
  m6_meditation: 6,
})
const { tranquility } = allNumConditionals(
  key,
  true,
  0,
  dm.m4.max_stacks,
  undefined,
  { tranquility: 4 }
)

const core_auricArray_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  subscript(char.core, dm.core.dmg_)
)
const core_qingmingEruption_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  subscript(char.core, dm.core.dmg_)
)
const ability_check = (node: NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('stun'),
      team.common.count.withSpecialty('support'),
      team.common.count.withSpecialty('defense')
    ),
    1,
    node
  )
const ability_cloudShaper_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  ability_check(isStunned.ifOn(dm.ability.dmg_))
)
const ability_ashenInk_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  ability_check(isStunned.ifOn(dm.ability.dmg_))
)
const m4_cloudShaper_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 4, prod(tranquility, percent(dm.m4.dmg_)))
)
const m4_ashenInk_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 4, prod(tranquility, percent(dm.m4.dmg_)))
)

const sheet = register(
  key,
  // Handles base stats, StatBoosts and Eidolon 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    // Per-hit buffs
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackAuricArray',
      0,
      {
        ...baseTag,
        damageType1: 'basic',
      },
      'sheerForce',
      undefined,
      ...core_auricArray_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackQingmingEruption',
      0,
      { ...baseTag, damageType1: 'basic' },
      'sheerForce',
      undefined,
      ...core_qingmingEruption_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackCloudShaper',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ...ability_cloudShaper_dmg_,
      ...m4_cloudShaper_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackAshenInkBecomesShadows',
      0,
      { ...baseTag, damageType1: 'exSpecial' },
      'sheerForce',
      undefined,
      ...ability_ashenInk_dmg_,
      ...m4_ashenInk_dmg_
    )
  ),

  ...customSheerDmg(
    'ability_dmg',
    { ...baseTag, damageType1: 'elemental' },
    ability_check(prod(own.final.sheerForce, percent(dm.ability.dmg)))
  ),
  ...customSheerDmg(
    'm1_dmg',
    { ...baseTag, damageType1: 'elemental' },
    cmpGE(char.mindscape, 1, prod(own.final.sheerForce, percent(dm.m1.dmg)))
  ),
  ...customSheerDmg(
    'm2_dmg',
    { ...baseTag, damageType1: 'exSpecial' },
    cmpGE(char.mindscape, 2, prod(own.final.sheerForce, percent(dm.m2.dmg)))
  ),

  // Buffs
  registerBuff(
    'core_hpSheerForce',
    ownBuff.initial.sheerForce.add(
      prod(own.final.hp, percent(dm.core.sheerForce))
    )
  ),
  registerBuff(
    'core_exSpecial_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'exSpecial',
      subscript(char.core, dm.core.dmg_)
    )
  ),
  registerBuff(
    'core_assistFollowUp_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'assistFollowUp',
      subscript(char.core, dm.core.dmg_)
    )
  ),
  registerBuff(
    'core_chain_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'chain',
      subscript(char.core, dm.core.dmg_)
    )
  ),
  registerBuff(
    'core_ult_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'ult',
      subscript(char.core, dm.core.dmg_)
    )
  ),
  registerBuff('core_auricArray_dmg_', core_auricArray_dmg_),
  registerBuff('core_qingmingEruption_dmg_', core_qingmingEruption_dmg_),
  registerBuff('ability_cloudShaper_dmg_', ability_cloudShaper_dmg_),
  registerBuff('ability_ashenInk_dmg_', ability_ashenInk_dmg_),
  registerBuff(
    'ability_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      ability_check(meditation.ifOn(dm.ability.crit_dmg_))
    )
  ),
  registerBuff(
    'm1_crit_',
    ownBuff.combat.crit_.add(cmpGE(char.mindscape, 1, dm.m1.crit_))
  ),
  registerBuff(
    'm2_ult_ether_resIgn_',
    ownBuff.combat.resIgn_.ether.addWithDmgType(
      'ult',
      cmpGE(char.mindscape, 2, dm.m2.ether_resIgn_)
    )
  ),
  registerBuff(
    'm2_exSpecial_ether_resIgn_',
    ownBuff.combat.resIgn_.ether.addWithDmgType(
      'exSpecial',
      cmpGE(char.mindscape, 2, dm.m2.ether_resIgn_)
    )
  ),
  registerBuff('m4_cloudShaper_dmg_', m4_cloudShaper_dmg_),
  registerBuff('m4_ashenInk_dmg_', m4_ashenInk_dmg_),
  registerBuff(
    'm6_sheer_dmg_',
    ownBuff.combat.sheer_dmg_.add(
      cmpGE(char.mindscape, 6, m6_meditation.ifOn(dm.m6.sheer_dmg_))
    )
  )
)
export default sheet
