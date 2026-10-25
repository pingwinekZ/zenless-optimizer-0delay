import {
  cmpGE,
  min,
  type NumNode,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  customDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  team,
} from '../../util'
import { entriesForChar, getBaseTag, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Severian'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const baseTag = getBaseTag(data_gen)

const { char } = own

// Core Passive: Endless Breeze — Flow / Shadowflash are skill-availability
// resources (they gate Azure Wind's Shadowhunt and the auto-dodges), not
// stat buffs, so only paragraph 0's stat lines are modeled. M6's decibel /
// Windrise lines are rotational and unmodeled; the final-hit multiplier is
// modeled below.
//
// Additional Ability: Optimal Setup — "another character in your squad is a
// Support or Stun character, or shares the same faction".
// team.common.count includes self; Severian (Attack) contributes 0 to the
// specialty counts but 1 to the faction count, so >= 2 means "at least one
// qualifying teammate" (Qingyi/Jane squad-check pattern).
const ability_check = (node: number | NumNode) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('support'),
      team.common.count.withSpecialty('stun'),
      team.common.count.withFaction('CriminalInvestigationSpecialResponseTeam')
    ),
    2,
    node
  )

// M2: PEN Ratio on Perfect Dodge / Azure Wind's Shadowhunt use (25s).
// M4: ATK on entering combat / switching on-field (30s). The companion
// Decibel Generation Rate line is unmodeled (repo-wide: Sigrid/Lucia/Promeia
// treat decibel gain as rotational).
const { m2_pen, m4_atk } = allBoolConditionals(key)

// Additional Ability: "For every 1% CRIT Rate Severian has, his ATK
// increases by 8.5, capped at 100% CRIT Rate." — min(crit, 1) / 1% * 8.5,
// with the step division folded into the build-time constant.
const ability_atk = ownBuff.combat.atk.add(
  ability_check(
    prod(
      min(own.final.crit_, dm.ability.max_crit_rate),
      dm.ability.atk_per_crit_rate / dm.ability.crit_rate_step
    )
  )
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  // M6: the additional DMG Multiplier of Azure Wind's Shadowhunt's final hit
  // is increased by a fixed 350% — a separate gated instance (Phoenix M4 /
  // Promeia M6 pattern) with a display-only paired registerBuff so the field
  // survives the sheet's buff-listing filter.
  ...customDmg(
    'm6_shadowhunt_final_dmg',
    { ...baseTag, damageType1: 'basic', skillType1: 'basicSkill' },
    cmpGE(
      char.mindscape,
      6,
      prod(own.final.atk, percent(dm.m6.shadowhunt_final_dmg))
    )
  ),

  // Core Passive: Endless Breeze (paragraph 0 — always active)
  registerBuff(
    'core_crit_dmg_',
    ownBuff.combat.crit_dmg_.add(
      percent(subscript(char.core, dm.core.crit_dmg_))
    )
  ),
  registerBuff(
    'core_dmg_',
    ownBuff.combat.common_dmg_.add(percent(subscript(char.core, dm.core.dmg_)))
  ),
  registerBuff(
    'core_wind_ally_dmg_',
    ownBuff.combat.common_dmg_.add(
      cmpGE(
        team.common.count.wind,
        2,
        percent(subscript(char.core, dm.core.wind_ally_dmg_))
      )
    )
  ),

  // Additional Ability: Optimal Setup — crit rate converts to flat ATK
  registerBuff('ability_atk', ability_atk),

  // M1: attacks ignore 15% of the target's Wind RES
  registerBuff(
    'm1_wind_resIgn_',
    ownBuff.combat.resIgn_.wind.add(
      cmpGE(char.mindscape, 1, percent(dm.m1.wind_resIgn_))
    )
  ),

  // M2: PEN Ratio for 25s after Perfect Dodge / Shadowhunt
  registerBuff(
    'm2_pen_',
    ownBuff.combat.pen_.add(
      cmpGE(char.mindscape, 2, m2_pen.ifOn(percent(dm.m2.pen_)))
    )
  ),

  // M4: ATK for 30s on entering combat / switching on-field
  registerBuff(
    'm4_atk_',
    ownBuff.combat.atk_.add(
      cmpGE(char.mindscape, 4, m4_atk.ifOn(percent(dm.m4.atk_)))
    )
  ),

  // M6 display-only pair for the shadowhunt final-hit instance above
  // ('elemental' type matches no hit and includeOriginalEntry: false keeps
  // it from ever applying — Phoenix core_sear_dmg pattern).
  registerBuff(
    'm6_shadowhunt_final_dmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'elemental',
      percent(dm.m6.shadowhunt_final_dmg)
    ),
    undefined,
    undefined,
    false
  )
)
export default sheet
