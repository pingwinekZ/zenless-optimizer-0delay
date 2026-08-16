import { cmpGE, prod, subscript } from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  customDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
} from '../../util'
import {
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'YeShunguang'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const m2_exSpecial_defIgn_ = ownBuff.combat.defIgn_.addWithDmgType(
  'exSpecial',
  cmpGE(char.mindscape, 2, percent(dm.m2.defIgn_))
)
const m2_ult_defIgn_ = ownBuff.combat.defIgn_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 2, percent(dm.m2.defIgn_))
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
      'BasicAttackEnlightenedMindSplittingCurrents',
      0,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSplittingCurrents',
      1,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSplittingCurrents',
      2,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSkywardAscent',
      0,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSunderlightMaximum',
      0,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSunderlight',
      0,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSunderlight',
      1,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSunderlightAnnihilation',
      0,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackEnlightenedMindSunderlightAnnihilation',
      1,
      { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
      'atk',
      undefined
    ),

    dmgDazeAndAnomOverride(
      dm,
      'assist',
      'QuickAssistEnlightenedMindTacticalSupport',
      0,
      { ...baseTag, damageType1: 'quickAssist', skillType1: 'assistSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'assist',
      'AssistFollowUpEnlightenedMindUnification',
      0,
      { ...baseTag, damageType1: 'assistFollowUp', skillType1: 'assistSkill' },
      'atk',
      undefined
    ),

    dmgDazeAndAnomOverride(
      dm,
      'special',
      'SpecialAttackEnlightenedMindCleanExit',
      0,
      { ...baseTag, damageType1: 'special', skillType1: 'specialSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnlightenedMindSoaringLight',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined,
      ...m2_exSpecial_defIgn_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackEnlightenedMindReturnToDust',
      0,
      { ...baseTag, damageType1: 'exSpecial', skillType1: 'specialSkill' },
      'atk',
      undefined
    ),

    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateChasingStorms',
      0,
      { ...baseTag, damageType1: 'ult', skillType1: 'chainSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'ChainAttackEnlightenedMindLureThunder',
      0,
      { ...baseTag, damageType1: 'chain', skillType1: 'chainSkill' },
      'atk',
      undefined
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'UltimateCleavingHeavens',
      0,
      { ...baseTag, damageType1: 'ult', skillType1: 'chainSkill' },
      'atk',
      undefined,
      ...m2_ult_defIgn_
    )
  ),

  customDmg(
    'm6_dmg',
    { ...baseTag, damageType1: 'elemental' },
    cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.dmg)))
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.physical.addWithDmgType(
      'elemental',
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
    'core_common_dmg_',
    ownBuff.combat.common_dmg_.add(
      percent(subscript(char.core, dm.core.common_dmg_))
    )
  ),
  registerBuff(
    'm1_common_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 1, percent(dm.m1.common_dmg_))
    )
  ),
  registerBuff(
    'm1_defIgn_',
    ownBuff.combat.defIgn_.add(cmpGE(char.mindscape, 1, percent(dm.m1.defIgn_)))
  ),
  registerBuff(
    'm2_exSpecial_defIgn_',
    m2_exSpecial_defIgn_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m2_ult_defIgn_', m2_ult_defIgn_, undefined, undefined, false)
)
export default sheet
