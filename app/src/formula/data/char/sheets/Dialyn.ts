import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpEq,
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
  allListConditionals,
  customDmg,
  own,
  ownBuff,
  percent,
  reader,
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

const key: CharacterKey = 'Dialyn'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const {
  malicious_complaint,
  overwhelmingly_positive_common,
  overwhelmingly_positive_resIgn,
  overwhelmingly_positive_atk,
} = allBoolConditionals(key, undefined, {
  overwhelmingly_positive_resIgn: 1,
  overwhelmingly_positive_atk: 4,
  malicious_complaint: 2,
})

const { teammateSlot } = allListConditionals(key, ['None', 'Slot 1', 'Slot 2'])

const ability_check = (a: NumNode | number, b?: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('attack'),
      team.common.count.withSpecialty('rupture')
    ),
    1,
    a,
    b
  )

// Teammate bridged stats (registered at assembly layer)
const s1_atk = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate1_atk',
}).sum as unknown as NumNode
const s2_atk = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate2_atk',
}).sum as unknown as NumNode
const s1_sf = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate1_sheerForce',
}).sum as unknown as NumNode
const s2_sf = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate2_sheerForce',
}).sum as unknown as NumNode
const s1_spec = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'char',
  q: 'teammate1_specialty',
}) as any
const s2_spec = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'char',
  q: 'teammate2_specialty',
}) as any

// Per-slot specialty checks
const s1_is_attack = cmpEq(s1_spec, 'attack', 1, 0)
const s1_is_rupture = cmpEq(s1_spec, 'rupture', 1, 0)
const s2_is_attack = cmpEq(s2_spec, 'attack', 1, 0)
const s2_is_rupture = cmpEq(s2_spec, 'rupture', 1, 0)

// Slot selection
const slot1_selected = cmpEq(teammateSlot.value, 1, 1, 0)
const slot2_selected = cmpEq(teammateSlot.value, 2, 1, 0)

// Each slot: if selected, contribute ATK for Attack or Sheer Force for Rupture
const s1_contrib = prod(
  slot1_selected,
  sum(
    prod(s1_is_attack, s1_atk, percent(dm.ability.attack_dmg)),
    prod(s1_is_rupture, s1_sf, percent(dm.ability.rupture_dmg))
  )
)
const s2_contrib = prod(
  slot2_selected,
  sum(
    prod(s2_is_attack, s2_atk, percent(dm.ability.attack_dmg)),
    prod(s2_is_rupture, s2_sf, percent(dm.ability.rupture_dmg))
  )
)

// Combined flat damage buff for EX Special attacks
const ability_flat_dmg = ownBuff.combat.flat_dmg.addWithDmgType(
  'exSpecial',
  ability_check(sum(s1_contrib, s2_contrib))
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
      'special',
      'EXSpecialAttackRock',
      0,
      { damageType1: 'exSpecial' },
      'atk',
      undefined,
      ...ability_flat_dmg
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackScissors',
      0,
      { damageType1: 'exSpecial' },
      'atk',
      undefined,
      ...ability_flat_dmg
    ),
    dmgDazeAndAnomOverride(
      dm,
      'special',
      'EXSpecialAttackPaper',
      0,
      { damageType1: 'exSpecial' },
      'atk',
      undefined,
      ...ability_flat_dmg
    )
  ),

  ...customDmg(
    'm6_dmg',
    { attribute: 'physical', damageType1: 'exSpecial' },
    cmpGE(char.mindscape, 6, prod(own.final.atk, percent(dm.m6.dmg)))
  ),
  registerBuff(
    'm6_dmg',
    ownBuff.combat.dmg_.physical.add(
      cmpGE(char.mindscape, 6, percent(dm.m6.dmg))
    ),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'core_impact',
    ownBuff.combat.impact.add(
      min(
        dm.core.max_impact,
        prod(
          max(
            0,
            sum(own.final.crit_, prod(-1, percent(dm.core.crit_threshold)))
          ),
          subscript(char.core, dm.core.impact),
          constant(100)
        )
      )
    )
  ),
  registerBuff(
    'ability_exSpecial_crit_dmg_',
    ownBuff.combat.crit_dmg_.addWithDmgType(
      'exSpecial',
      ability_check(percent(dm.ability.exSpecial_crit_dmg_))
    )
  ),
  registerBuff(
    'ability_common_dmg_',
    teamBuff.combat.common_dmg_.add(
      ability_check(
        overwhelmingly_positive_common.ifOn(percent(dm.ability.common_dmg_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_flat_dmg',
    ability_flat_dmg,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm1_resIgn_',
    teamBuff.combat.resIgn_.add(
      cmpGE(
        char.mindscape,
        1,
        overwhelmingly_positive_resIgn.ifOn(percent(dm.m1.resIgn_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_common_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpGE(
        char.mindscape,
        2,
        malicious_complaint.ifOn(percent(dm.m2.common_dmg_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_atk',
    ownBuff.combat.atk.add(
      cmpGE(
        char.mindscape,
        4,
        overwhelmingly_positive_atk.ifOn(percent(dm.m4.atk))
      )
    )
  )
)
export default sheet
