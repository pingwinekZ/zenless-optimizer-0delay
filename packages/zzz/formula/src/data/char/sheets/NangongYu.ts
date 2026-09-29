import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
  constant,
  max,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import {
  type AttributeAnomalyKey,
  allAttributeAnomalyKeys,
  type CharacterKey,
} from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import { anomTimePassed } from '../../common/anomaly'
import {
  allBoolConditionals,
  allNumConditionals,
  customAnomalyDmg,
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
  anomalyMultipliers,
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'NangongYu'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const {
  dazeSquadBuff,
  etherVeil,
  stunned_buildup,
  misstep_hit,
  m1ResIgn,
  // Add interactions with other characters or unusual conditions here
} = allBoolConditionals(key, undefined, { m1ResIgn: 1 })

// Vibrato / Vibrato: Modified stacks (0 = effect off). Max assumed by default.
const { vibrato_stacks } = allNumConditionals(
  key,
  true,
  0,
  dm.core.maxVibrato[6]
)
const { modified_stacks } = allNumConditionals(
  key,
  true,
  0,
  dm.m6.maxVibratoModified,
  undefined,
  { modified_stacks: 6 }
)

// Additional Ability trigger: another squad member is an Anomaly
// character or shares the faction (Sunna/Lighter pattern).
const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('anomaly'),
      team.common.count.withFaction('AngelsOfDelusion')
    ),
    2,
    node
  )

// Ability Misstep stun multiplier with the M2 increase folded in
// (Trigger §3.10 pattern). The Stun duration increase has no optimizer
// effect (JuFufu M1 pattern).
const misstep_stun = sum(
  percent(dm.ability.misstepStunDmg_),
  cmpGE(char.mindscape, 2, percent(dm.m2.stunDmg))
)

// M4: Anomaly Buildup of Basic Attack: Adorable Explosive Impact
// (Alice M4 pattern: skill-scoped, display-only, wired via extras).
const m4_basic_anomBuildup_ = ownBuff.combat.anomBuildup_.addWithDmgType(
  'basic',
  cmpGE(
    char.mindscape,
    4,
    percent(dm.m4.basicAdorableExplosiveImpactAnomalyBuildup)
  )
)

// Core Vibrato Abloom ratio per attribute: base ratio x (1 + stacks x
// per-stack bonus). M2 raises the per-stack bonus by an additional 10%
// (Trigger §3.10 folding; shown dimmed in the UI).
const vibratoStackBonus = sum(
  percent(subscript(char.core, dm.core.vibratoStackDmg)),
  cmpGE(char.mindscape, 2, percent(dm.m2.vibratoStackDmg))
)
const abloomRatioByAttr: Record<AttributeAnomalyKey, NumNode> = {
  ether: prod(
    percent(subscript(char.core, dm.core.etherAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
  electric: prod(
    percent(subscript(char.core, dm.core.electricAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
  fire: prod(
    percent(subscript(char.core, dm.core.fireAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
  physical: prod(
    percent(subscript(char.core, dm.core.physicalAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
  ice: prod(
    percent(subscript(char.core, dm.core.iceAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
  wind: prod(
    percent(subscript(char.core, dm.core.windAbloom)),
    sum(percent(1), prod(vibrato_stacks, vibratoStackBonus))
  ),
}

// M6 Vibrato: Modified Abloom ratio per attribute (unstunned-state counterpart
// of Vibrato; the two never stack, modeled as independent stack sliders).
const m6AbloomRatioByAttr: Record<AttributeAnomalyKey, NumNode> = {
  ether: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.etherAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
  electric: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.electricAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
  fire: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.fireAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
  physical: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.physicalAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
  ice: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.iceAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
  wind: cmpGE(
    char.mindscape,
    6,
    prod(
      percent(dm.m6.windAbloom),
      sum(
        percent(1),
        prod(modified_stacks, percent(dm.m6.vibratoModifiedStackDmg))
      )
    ),
    0
  ),
}

// M2 Polarity Disorder base: own Ether Disorder base (Yanagi pattern), of
// which Polarity Disorder deals 25%. Assumes NangongYu's own Disorder is the
// one overwritten; the once-per-stun limit is unmodelable.
const disorderBase = prod(
  sum(
    percent(4.5),
    own.final.addl_disorder_,
    prod(
      max(0, sum(constant(10), prod(constant(-1), anomTimePassed))),
      percent(1.25)
    )
  ),
  own.final.atk
)

const sheet = register(
  key,
  // Handles base stats, core stats and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Formulas
  // All hits are Ether on ATK, so only the Basic Attack: Adorable
  // Explosive Impact hits need overrides (for the M4 buildup buff).
  ...registerAllDmgDazeAndAnom(
    key,
    dm,
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackAdorableExplosiveImpact',
      0,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      {},
      ...m4_basic_anomBuildup_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackAdorableExplosiveImpact',
      1,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      {},
      ...m4_basic_anomBuildup_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackAdorableExplosiveImpact',
      2,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      {},
      ...m4_basic_anomBuildup_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'basic',
      'BasicAttackAdorableExplosiveImpact',
      3,
      { ...baseTag, damageType1: 'basic' },
      'atk',
      {},
      ...m4_basic_anomBuildup_
    )
  ),

  // Abloom DMG instances — an additional hit equal to the Vibrato ratio of
  // the original anomaly's DMG, registered for every anomaly attribute
  // (Vivian/Aria convention: `abloomDmgInst_<attr>` labels render as
  // "<Attr> Anomaly Abloom" via the shared formula label maps).
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `abloomDmgInst_${attr}`,
      {
        attribute: attr,
        damageType1: 'anomaly',
        damageType2: 'abloom',
      },
      prod(
        percent(anomalyMultipliers[attr]),
        abloomRatioByAttr[attr],
        own.final.atk,
        sum(percent(1), own.final.anom_mv_mult_)
      )
    )
  ),
  // M6 Vibrato: Modified instances (unstunned-state counterpart).
  ...allAttributeAnomalyKeys.map((attr) =>
    customAnomalyDmg(
      `m6_abloomDmgInst_${attr}`,
      {
        attribute: attr,
        damageType1: 'anomaly',
        damageType2: 'abloom',
      },
      prod(
        percent(anomalyMultipliers[attr]),
        m6AbloomRatioByAttr[attr],
        own.final.atk,
        sum(percent(1), own.final.anom_mv_mult_)
      )
    )
  ),
  // M2 Polarity Disorder: Chain Attack heavy attack vs a Stunned,
  // anomaly-afflicted enemy deals 25% of Disorder DMG (Yanagi pattern).
  // NB: no `cond` here — a node cond corrupts the formula listing entry
  // (null meta.tag). This is a passive buff gated by M2 only; the M2 fields
  // doc in the UI sheet shows it without a toggle.
  ...customAnomalyDmg(
    'm2_polarity_disorder_dmg',
    { attribute: 'ether', damageType1: 'disorder' },
    prod(disorderBase, percent(dm.m2.polarityDisorderDmg))
  ),

  // Buffs
  // Core Vibrato Abloom ratios, shown per attribute (Vivian pattern:
  // abloom-scoped anom MV mult, display-only).
  ...allAttributeAnomalyKeys.map((attr) =>
    registerBuff(
      `core_${attr}_anom_mv_mult_`,
      ownBuff.combat.anom_mv_mult_[attr].addWithDmgType(
        'abloom',
        abloomRatioByAttr[attr]
      ),
      undefined,
      undefined,
      false
    )
  ),
  // M6 Vibrato: Modified ratios, shown per attribute.
  ...allAttributeAnomalyKeys.map((attr) =>
    registerBuff(
      `m6_${attr}_anom_mv_mult_`,
      ownBuff.combat.anom_mv_mult_[attr].addWithDmgType(
        'abloom',
        m6AbloomRatioByAttr[attr]
      ),
      undefined,
      undefined,
      false
    )
  ),
  registerBuff(
    'm2_polarity_disorder_dmg',
    ownBuff.combat.anom_base_.addWithDmgType(
      'disorder',
      cmpGE(char.mindscape, 2, percent(1))
    ),
    undefined,
    undefined,
    false
  ),
  // Core hit buffs (one toggle: Adorable Explosive Impact or EX Special
  // hits). Global registration covers every hit, so no extras wiring.
  registerBuff(
    'core_anomBuildup_',
    ownBuff.combat.anomBuildup_.add(
      dazeSquadBuff.ifOn(percent(subscript(char.core, dm.core.anomalyBuildup)))
    )
  ),
  registerBuff(
    'core_daze_',
    ownBuff.combat.dazeInc_.add(
      dazeSquadBuff.ifOn(percent(subscript(char.core, dm.core.daze)))
    )
  ),
  registerBuff(
    'core_squad_dmg_',
    teamBuff.combat.common_dmg_.add(
      dazeSquadBuff.ifOn(percent(subscript(char.core, dm.core.squadDmg)))
    ),
    undefined,
    true
  ),
  // Core Ether Veil: fixed 50 ATK to the squad for 30s after Ultimate.
  registerBuff(
    'core_etherVeil_atk',
    teamBuff.combat.atk.add(etherVeil.ifOn(50)),
    undefined,
    true
  ),
  registerBuff(
    'core_anomProf',
    ownBuff.combat.anomProf.add(subscript(char.core, dm.core.anomalyProf))
  ),
  // Core paragraph 1: each point of initial Anomaly Mastery above 110
  // grants 1 Impact (Aria initial-mastery-threshold pattern).
  registerBuff(
    'core_impact',
    ownBuff.combat.impact.add(
      prod(
        max(0, sum(own.initial.anomMas, -dm.core.masteryThresh)),
        dm.core.impactPerMastery
      )
    )
  ),
  // Ability squad Anomaly Buildup vs Stunned enemies, plus the extra
  // Chain Attack buildup (dmgType-scoped, applies to all Chain hits).
  registerBuff(
    'ability_squad_anomBuildup_',
    teamBuff.combat.anomBuildup_.add(
      abilityCheck(
        stunned_buildup.ifOn(percent(dm.ability.squadAnomalyBuildup_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_chain_anomBuildup_',
    teamBuff.combat.anomBuildup_.addWithDmgType(
      'chain',
      abilityCheck(
        stunned_buildup.ifOn(percent(dm.ability.chainAnomalyBuildup_))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'ability_misstep_stun_',
    enemyDebuff.common.stun_.add(abilityCheck(misstep_hit.ifOn(misstep_stun))),
    undefined,
    true
  ),
  // M1: enemy All-Attribute RES decrease (Yuzuha M1 pattern).
  registerBuff(
    'm1_resRed_',
    enemyDebuff.common.resRed_.add(
      cmpGE(char.mindscape, 1, m1ResIgn.ifOn(percent(dm.m1.resDecrease)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_anomProf',
    ownBuff.combat.anomProf.add(cmpGE(char.mindscape, 4, dm.m4.anomalyProf))
  ),
  registerBuff(
    'm4_basic_anomBuildup_',
    m4_basic_anomBuildup_,
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'm6_daze_',
    ownBuff.combat.dazeInc_.add(cmpGE(char.mindscape, 6, percent(dm.m6.daze)))
  )
)
export default sheet
