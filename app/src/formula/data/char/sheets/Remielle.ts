import {
  cmpEq,
  cmpGE,
  min,
  type NumNode,
  prod,
  subscript,
  sum,
  sumfrac,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '../../../../consts'
import { allStats, mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  customAnomalyDmg,
  enemy,
  enemyDebuff,
  notOwnBuff,
  own,
  ownBuff,
  percent,
  reader,
  register,
  registerBuff,
  team,
  teamBuff,
} from '../../util'
import { entriesForChar, registerAllDmgDazeAndAnom } from '../util'

const key: CharacterKey = 'Remielle'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const { char } = own

// Conditionals
const { phaseFlow, phaseFlow_daze, phaseFlow_m1, prismatic } =
  allBoolConditionals(key, undefined, { prismatic: 2, phaseFlow_m1: 1 })

// Ability check: another Anomaly character OR same faction (CovenantOfDayat)
const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('anomaly'),
      team.common.count.withFaction('CovenantOfDayat')
    ),
    3,
    node
  )

// ATK % tier based on Anomaly characters in squad (1/2/3+ → 6%/12%/40%)
const atkTier = cmpGE(
  team.common.count.withSpecialty('anomaly'),
  3,
  percent(dm.ability.atk_3Anom),
  cmpGE(
    team.common.count.withSpecialty('anomaly'),
    2,
    percent(dm.ability.atk_2Anom),
    cmpGE(
      team.common.count.withSpecialty('anomaly'),
      1,
      percent(dm.ability.atk_1Anom),
      0
    )
  )
)

// Daze % tier based on Anomaly characters in squad (1/2/3+ → 6%/12%/35%)
const dazeTier = cmpGE(
  team.common.count.withSpecialty('anomaly'),
  3,
  percent(dm.ability.daze_3Anom),
  cmpGE(
    team.common.count.withSpecialty('anomaly'),
    2,
    percent(dm.ability.daze_2Anom),
    cmpGE(
      team.common.count.withSpecialty('anomaly'),
      1,
      percent(dm.ability.daze_1Anom),
      0
    )
  )
)

// Special Attack: Ode to Dawn - Radiant Turn — team DMG buff during Phase Flow
// Formula: 0 + specialLevel × 1.5% (18% at special level 12)
// Not gated by the Additional Ability check — only Phase Flow · Daze is.
const specialTeamDmg_ = teamBuff.combat.common_dmg_.add(
  phaseFlow.ifOn(prod(percent(0.015), own.char.special))
)

// Additional Ability: Invitation to Bloom — squad ATK buff
// Applies to all squad members including Remielle herself.
// Uses `combat.atk` instead of `base.atk` to avoid circular dependency:
// `own.initial.atk` depends on `base.atk`, so writing to `base.atk` would
// create an infinite loop (base → initial → base).
// Value = min(Remielle's initial ATK × 6/12/40%, 1600)
const abilityAtkBuff = abilityCheck(
  min(prod(own.initial.atk, atkTier), dm.ability.maxAtkCap)
)

// Additional Ability: Daze increase while in Phase Flow
const abilityDazeInc_ = ownBuff.combat.dazeInc_.add(
  phaseFlow_daze.ifOn(abilityCheck(dazeTier))
)

// Core Passive: Refringe Coefficient = 0.02% of AP + (10% if 3 Anomaly chars)
// M2: Remielle's Refringe Coefficient increases by 20% — scales the full
// coefficient (0.02% of AP + 10% with 3+ Anomaly chars).
const refringeCoeffNode = prod(
  sum(
    prod(dm.core.refringeCoeff, own.final.anomProf),
    cmpGE(team.common.count.withSpecialty('anomaly'), 3, 0.1, 0)
  ),
  sum(percent(1), cmpGE(char.mindscape, 2, percent(dm.m2.refringeCoeff_)))
)
const coreRefringeCoeff_ = ownBuff.combat.refringeCoeff_.add(refringeCoeffNode)

// Core Passive: Luminize AP% scaling (visual display only)
// Shows 0.1%–0.2% of AP in the buff list.
// ×0.01 so _-suffixed display (×100) shows the correct literal percentage:
// 0.2% × 266 AP = 0.532 → ×0.01 = 0.00532 → displayed as "0.53%"
// Does not affect any damage calculation (lumiflux anomaly multiplier is 0).
const coreLuminizeAnomMvMult_ = ownBuff.combat.anom_mv_mult_.add(
  prod(
    percent(subscript(own.char.core, dm.core.luminizeApMultiplier)),
    own.final.anomProf,
    0.01
  )
)

// ---------------------------------------------------------------------------
// Mindscapes
// ---------------------------------------------------------------------------

// M1: When Remielle triggers Luminize to deal DMG, she ignores 50% of the
// target's All-Attribute RES. Scoped to `attribute: 'lumiflux'` +
// `damageType2: 'luminize'` so it only affects the Luminize instances. The
// same term is added to `wantX` (and subtracted from `delta`) in
// `inheritedResFactor` below — the shared pipeline picks up the RES Ignore
// in the lumiflux context, and the factor keeps `wantX + delta = sharedRes`,
// so the net RES multiplier becomes `wantX + M1`.
const m1_luminizeResIgn_ = ownBuff.combat.resIgn_.lumiflux.addWithDmgType(
  'luminize',
  cmpGE(char.mindscape, 1, percent(dm.m1.allResIgn_))
)

// M1: While Remielle is in the Phase Flow state, other squad members'
// Attribute Anomaly DMG increases by 10% (`notOwnBuff` excludes Remielle's own
// Luminize). Toggled via the `phaseFlow_m1` conditional, which is linked to
// the Phase Flow DMG and Phase Flow Daze conditionals in the UI.
const m1_teamAnomDmg_ = notOwnBuff.combat.buff_.addWithDmgType(
  'anomaly',
  phaseFlow_m1.ifOn(cmpGE(char.mindscape, 1, percent(dm.m1.squadAnomDmg_)))
)

// M2: When an Anomaly character in the squad deals Anomaly DMG to an enemy
// affected by Prismatic, the attack ignores 15% of the target's DEF.
const m2_teamAnomDefIgn_ = teamBuff.combat.defIgn_.addWithDmgType(
  'anomaly',
  prismatic.ifOn(cmpGE(char.mindscape, 2, percent(dm.m2.defIgn_)))
)

// M4: When Remielle triggers Luminize, the DMG multiplier is increased by an
// additional 12% — feeds the existing `(1 + anom_mv_mult_)` term.
const m4_luminizeDmg_ = ownBuff.combat.anom_mv_mult_.lumiflux.addWithDmgType(
  'luminize',
  cmpGE(char.mindscape, 4, percent(dm.m4.luminizeDmg_))
)

// M6: Basic Attack: Rainbow's End / Fleeting Grace trigger Luminize 2 times.
const m6_basicLuminizeTriggerMult = cmpGE(
  char.mindscape,
  6,
  dm.m6.luminizeTriggerCount,
  1
)

// ---------------------------------------------------------------------------
// Inherited element (Voidflare fluxed attribute) RES targeting
//
// Luminize is considered its own Attribute Anomaly type, but still remembers
// the Attribute of the previous Anomaly stored in the Voidflare: Luminize
// dealt from a Physical Voidflare targets the enemy's Physical DMG RES. The
// optimizer can't know which anomalies are actually stored, so we proxy the
// inherited element with the first non-lumiflux teammate's attribute.
//
// The Luminize instances stay tagged `attribute: 'lumiflux'`, so they keep
// ignoring attribute-scoped anomaly buffs (e.g. Jane's Assault CRIT DMG,
// Assault DMG Bonus) and only benefit from Luminize-specific or universal
// Anomaly DMG Bonus (Remielle's W-Engine, 4-Piece Feathered Fate, Yuzuha's
// Additional Ability). Only the RES multiplier needs to resolve against the
// inherited attribute, done here as a correction factor:
//
//   factorX = wantX / sharedRes
//
// `sharedRes` is the RES multiplier the shared pipeline applies in the
// lumiflux context (untagged + lumiflux-tagged enemy RES entries), and
// `wantX` is the RES multiplier for the inherited attribute X (untagged +
// X-tagged entries). The untagged parts cancel, so only the attribute-tagged
// differences remain. `sumfrac(wantX, delta)` = `wantX / (wantX + delta)`
// expresses the ratio with `delta = sharedRes - wantX`.
// ---------------------------------------------------------------------------

// Teammate slot attributes (bridged at assembly layer; empty/self slots fall
// back to Remielle's own `lumiflux` attribute, which means no inheritance).
const s1_attribute = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'char',
  q: 'teammate1_attribute',
}) as any
const s2_attribute = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'char',
  q: 'teammate2_attribute',
}) as any

// Attributes that can be stored as Voidflares and inherited by Luminize.
const inheritedAttrs = ['fire', 'electric', 'ice', 'physical', 'ether', 'wind']
const res_ = (attr: string) => (enemy.common.res_ as any)[attr]
const resRed_ = (attr: string) => (enemyDebuff.common.resRed_ as any)[attr]
const resIgn_ = (attr: string) => (own.final.resIgn_ as any)[attr]

// RES multiplier ratio for the inherited attribute X. In the lumiflux
// formula context, the plain reads below resolve the same untagged +
// lumiflux-tagged entries as the shared pipeline's RES multiplier, so
// `wantX + delta` = `sharedRes` and the factor equals `wantX / sharedRes`.
const inheritedResFactor = (attr: string): NumNode => {
  const m1ResIgn = cmpGE(char.mindscape, 1, percent(dm.m1.allResIgn_), 0)
  const wantX = sum(
    percent(1),
    prod(-1, res_(attr)),
    resRed_(attr),
    resIgn_(attr),
    m1ResIgn
  )
  const delta = sum(
    res_(attr),
    prod(-1, enemy.common.res_),
    enemyDebuff.common.resRed_,
    prod(-1, resRed_(attr)),
    own.final.resIgn_,
    prod(-1, resIgn_(attr)),
    prod(-1, m1ResIgn)
  )
  return sumfrac(wantX, delta)
}

// First non-lumiflux teammate determines the inherited element: slot 1 takes
// precedence over slot 2; no match → no correction (factor 1).
let luminizeResFactor: NumNode | number = 1
for (let i = inheritedAttrs.length - 1; i >= 0; i--) {
  const attr = inheritedAttrs[i]
  luminizeResFactor = cmpEq(
    s2_attribute,
    attr,
    inheritedResFactor(attr),
    luminizeResFactor
  )
}
for (let i = inheritedAttrs.length - 1; i >= 0; i--) {
  const attr = inheritedAttrs[i]
  luminizeResFactor = cmpEq(
    s1_attribute,
    attr,
    inheritedResFactor(attr),
    luminizeResFactor
  )
}

// ---------------------------------------------------------------------------
// Per-skill Luminize formulas
// Luminize: "Deals Attribute Anomaly DMG using the skill's DMG Multiplier."
// Formula: skillMultiplier × (1 + anom_mv_mult_)
// The anomaly pipeline handles AP scaling, crit, DEF, RES, and level multipliers.
//
// Skill multipliers from calcedParams (converted to decimal):
//   Rainbow's End:   (100 + basic  × 5)%   → 1 + basicLevel × 0.05
//   Fleeting Grace:  (200 + basic  × 10)%  → 2 + basicLevel × 0.1
//   Ultimate:        (210 + chain  × 10.5)%→ 2.1 + chainLevel × 0.105
//   Flower&Feather:  (200 + assist × 10)%  → 2 + assistLevel × 0.1
// ---------------------------------------------------------------------------

// Luminize base formula shared across all triggering skills.
// Refringe Coefficient multiplies the total DMG ("enhances AP, increasing total DMG").
// Uses the full Refringe Coefficient: 0.02% of AP + 10% if 3+ anomaly chars.
// `luminizeResFactor` retargets the shared RES multiplier from the lumiflux
// context to the Voidflare-inherited attribute (first non-lumiflux teammate).
// Team count entries now have src:null in entriesForChar and proper src tags
// via withMember in calculator providers, so the count resolves correctly.
const luminizeBase = (skillMultiplier: NumNode) =>
  prod(
    percent(skillMultiplier),
    own.final.atk,
    sum(percent(1), own.final.anom_mv_mult_),
    sum(percent(1), refringeCoeffNode),
    luminizeResFactor
  )

// Rainbow's End Luminize: multiplier = 1 + basicLevel × 0.05
// M6: triggers Luminize 2 times.
const luminizeRainbowsEnd = customAnomalyDmg(
  'luminizeRainbowsEndDmgInst',
  {
    attribute: 'lumiflux',
    damageType1: 'anomaly',
    damageType2: 'luminize',
  },
  prod(
    luminizeBase(sum(1, prod(own.char.basic, 0.05))),
    m6_basicLuminizeTriggerMult
  )
)

// Fleeting Grace Luminize: multiplier = 2 + basicLevel × 0.1
// M6: triggers Luminize 2 times.
const luminizeFleetingGrace = customAnomalyDmg(
  'luminizeFleetingGraceDmgInst',
  {
    attribute: 'lumiflux',
    damageType1: 'anomaly',
    damageType2: 'luminize',
  },
  prod(
    luminizeBase(sum(2, prod(own.char.basic, 0.1))),
    m6_basicLuminizeTriggerMult
  )
)

// Ultimate Luminize: multiplier = 2.1 + chainLevel × 0.105
const luminizeUltimate = customAnomalyDmg(
  'luminizeUltimateDmgInst',
  {
    attribute: 'lumiflux',
    damageType1: 'anomaly',
    damageType2: 'luminize',
  },
  luminizeBase(sum(2.1, prod(own.char.chain, 0.105)))
)

// Assist Flower & Feather Dance Luminize: multiplier = 2 + assistLevel × 0.1
const luminizeFlowerFeather = customAnomalyDmg(
  'luminizeFlowerFeatherDmgInst',
  {
    attribute: 'lumiflux',
    damageType1: 'anomaly',
    damageType2: 'luminize',
  },
  luminizeBase(sum(2, prod(own.char.assist, 0.1)))
)

const sheet = register(
  key,
  // Handles base stats, core stats, and Mindscapes 3 + 5
  entriesForChar(data_gen),

  // Skill damage/daze/anom formulas
  ...registerAllDmgDazeAndAnom(key, dm),

  // Per-skill Luminize formulas
  ...luminizeRainbowsEnd,
  ...luminizeFleetingGrace,
  ...luminizeUltimate,
  ...luminizeFlowerFeather, // Self-buffs

  // Buffs
  registerBuff('special_teamDmg_', specialTeamDmg_, undefined, true),
  registerBuff(
    'ability_atkBuff',
    teamBuff.combat.atk.add(abilityAtkBuff),
    undefined,
    true
  ),
  registerBuff('ability_dazeInc_', abilityDazeInc_),
  registerBuff('core_refringeCoeff_', coreRefringeCoeff_),
  registerBuff('core_luminize_anom_mv_mult_', coreLuminizeAnomMvMult_),

  // Mindscape buffs
  registerBuff('m1_allResIgn_', m1_luminizeResIgn_),
  registerBuff('m1_teamAnomDmg_', m1_teamAnomDmg_, undefined, true),
  registerBuff('m2_teamAnomDefIgn_', m2_teamAnomDefIgn_, undefined, true),
  registerBuff('m4_luminizeDmg_', m4_luminizeDmg_)
)
export default sheet
