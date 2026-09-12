import type { NumNode } from '@zenless-optimizer/pando/engine'
import { cmpGE, prod, subscript, sum } from '@zenless-optimizer/pando/engine'
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
} from '../../util'
import { entriesForChar, getBaseTag, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Nekomata'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { dodgeCounter_quickAssist_hit, from_behind, one_enemy_onField } =
  allBoolConditionals(key, undefined, { from_behind: 1, one_enemy_onField: 2 })
const { assaults_inflicted } = allNumConditionals(
  key,
  true,
  0,
  dm.ability.stacks
)
const { exSpecials_used } = allNumConditionals(
  key,
  true,
  0,
  dm.m4.stacks,
  undefined,
  { exSpecials_used: 4 }
)
const { chain_ult_used } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.stacks,
  undefined,
  { chain_ult_used: 6 }
)
const { pawpad_ambush } = allBoolConditionals(key)

// Ability check: another teammate is Support, or shares attribute (physical)
// or faction (CunningHares). team.common.count includes self — she
// contributes 2 (1 physical + 1 faction), so threshold >= 3 means
// "self + at least 1 qualifying teammate".
const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('support'),
      team.common.count.physical,
      team.common.count.withFaction('CunningHares')
    ),
    3,
    node
  )

// Assault / Disappearing Tail stacks (0-2): EX Special Attack and Dodge
// Counter both gain the same per-stack DMG.
const ability_stacks_dmg_ = prod(
  assaults_inflicted,
  percent(dm.ability.exSpecial_dmg_)
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  // Super Mean Pawprint (core para 6): additional Physical instance while
  // Pawpad Ambush is active. Paired registerBuff below so the sheet renders.
  ...customDmg(
    'core_pawprint_dmg',
    { ...baseTag },
    pawpad_ambush.ifOn(
      prod(own.final.atk, percent(subscript(char.core, dm.core.pawprint_dmg)))
    )
  ),
  registerBuff(
    'core_pawprint_dmg',
    ownBuff.combat.dmg_.physical.add(
      pawpad_ambush.ifOn(percent(subscript(char.core, dm.core.pawprint_dmg)))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'core_common_dmg_',
    ownBuff.combat.common_dmg_.add(
      dodgeCounter_quickAssist_hit.ifOn(
        percent(subscript(char.core, dm.core.common_dmg_))
      )
    )
  ),
  registerBuff(
    'ability_exSpecial_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'exSpecial',
      abilityCheck(ability_stacks_dmg_)
    )
  ),
  registerBuff(
    'ability_dodgeCounter_dmg_',
    ownBuff.combat.dmg_.addWithDmgType(
      'dodgeCounter',
      abilityCheck(ability_stacks_dmg_)
    )
  ),
  registerBuff(
    'm1_physical_resIgn_',
    ownBuff.combat.resIgn_.physical.add(
      cmpGE(
        char.mindscape,
        1,
        from_behind.ifOn(percent(dm.m1.physical_resIgn_))
      )
    )
  ),
  registerBuff(
    'm2_enerRegen_',
    ownBuff.combat.enerRegen_.add(
      cmpGE(
        char.mindscape,
        2,
        one_enemy_onField.ifOn(percent(dm.m2.enerRegen_))
      )
    )
  ),
  registerBuff(
    'potential_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      pawpad_ambush.ifOn(percent(dm.potential.crit_dmg_[6]))
    )
  ),
  registerBuff(
    'm4_crit_',
    ownBuff.combat.crit_.add(
      cmpGE(char.mindscape, 4, prod(exSpecials_used, percent(dm.m4.crit_)))
    )
  ),
  registerBuff(
    'm6_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      cmpGE(char.mindscape, 6, prod(chain_ult_used, percent(dm.m6.crit_dmg_)))
    )
  )
)
export default sheet
