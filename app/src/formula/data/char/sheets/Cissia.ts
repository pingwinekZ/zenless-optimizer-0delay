import {
  cmpGE,
  cmpGT,
  cmpLT,
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
  allNumConditionals,
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

const key: CharacterKey = 'Cissia'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { venomDefIgn, venomCritDmg, etherVeil } = allBoolConditionals(key)
const { corrodeBone_crit_stacks } = allNumConditionals(key, true, 0, 3)

const venomActive = (node: any) =>
  cmpGE(sum(venomDefIgn.ifOn(1), venomCritDmg.ifOn(1)), 1, node)

const energyAboveThreshold = max(
  0,
  sum(own.initial.enerRegen, -dm.core.enerThresh)
)
const additionalDefIgnore = percent(
  prod(energyAboveThreshold, dm.core.defIgnorePerStep)
)

const coreDefIgnore = sum(
  subscript(char.core, dm.core.defIgnore),
  additionalDefIgnore
)

const corrodeBoneDmg = percent(subscript(char.core, dm.core.corrodeBoneDmg))

const electricInSquad = team.common.count.electric

const corrodeBoneDaze = sum(
  prod(
    cmpGE(electricInSquad, 1, constant(1)),
    cmpLT(electricInSquad, 2, constant(1)),
    subscript(char.core, dm.core.corrodeBoneDaze1Elec)
  ),
  prod(
    cmpGT(electricInSquad, 1, constant(1)),
    subscript(char.core, dm.core.corrodeBoneDaze2Elec)
  )
)

const m1_defIgnoreMult = cmpGE(char.mindscape, 1, dm.m1.defIgnoreMult, 1)

const m2_serpentsKiss_dmg_ = ownBuff.combat.dmg_.electric.add(
  cmpGE(char.mindscape, 2, percent(dm.m2.basicSerpentsKissDmg_))
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
      'CorrodeBone',
      0,
      { ...baseTag, damageType1: 'special' },
      'atk',
      undefined,
      ownBuff.combat.dazeInc_.add(corrodeBoneDaze),
      ownBuff.combat.common_dmg_.add(corrodeBoneDmg),
      ownBuff.combat.resIgn_.electric.add(
        cmpGE(char.mindscape, 1, percent(dm.m1.corrodeBoneResIgnore))
      )
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackSerpentsKiss',
      0,
      { ...baseTag, attribute: 'electric' },
      'atk',
      undefined,
      m2_serpentsKiss_dmg_
    )
  ),

  ...customDmg(
    'core_corrodeBone_dmg_',
    { ...baseTag, attribute: 'electric' },
    prod(own.final.atk, corrodeBoneDmg)
  ),

  registerBuff(
    'ability_squad_crit_dmg_',
    teamBuff.combat.crit_dmg_.add(
      venomActive(
        cmpGE(
          sum(
            team.common.count.withSpecialty('stun'),
            team.common.count.electric
          ),
          2,
          percent(dm.ability.squadCritDmg_)
        )
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_self_crit_dmg_',
    teamBuff.combat.crit_dmg_.add(
      venomActive(
        cmpGE(
          sum(
            team.common.count.withSpecialty('stun'),
            team.common.count.electric
          ),
          2,
          percent(dm.ability.selfCritDmg_)
        )
      )
    )
  ),

  registerBuff(
    'core_defIgn_',
    ownBuff.combat.defIgn_.electric.add(
      venomActive(prod(coreDefIgnore, m1_defIgnoreMult))
    ),
    undefined,
    true
  ),

  registerBuff(
    'core_corrodeBone_dmg_',
    ownBuff.combat.dmg_.electric.add(corrodeBoneDmg),
    undefined,
    undefined,
    false
  ),

  registerBuff(
    'core_corrodeBone_daze_',
    ownBuff.combat.dazeInc_.electric.add(corrodeBoneDaze),
    undefined,
    undefined,
    false
  ),

  registerBuff(
    'm1_corrodeBone_resIgn_',
    ownBuff.combat.resIgn_.electric.add(
      cmpGE(char.mindscape, 1, percent(dm.m1.corrodeBoneResIgnore))
    ),
    undefined,
    undefined,
    false
  ),

  registerBuff(
    'core_corrodeBone_crit_',
    ownBuff.combat.crit_.add(prod(corrodeBone_crit_stacks, percent(0.06))),
    undefined,
    false
  ),

  registerBuff(
    'core_etherVeil_crit_dmg_',
    teamBuff.combat.crit_dmg_.add(etherVeil.ifOn(percent(0.05))),
    undefined,
    true
  ),

  registerBuff(
    'm1_electric_resIgn_',
    teamBuff.combat.resIgn_.electric.add(
      cmpGE(char.mindscape, 1, percent(dm.m1.electricResIgnore))
    ),
    undefined,
    true
  ),

  registerBuff(
    'm2_serpentsKiss_dmg_',
    m2_serpentsKiss_dmg_,
    undefined,
    undefined,
    false
  )
)
export default sheet
