import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpEq,
  cmpGE,
  constant,
  min,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  allListConditionals,
  allNumConditionals,
  customDmg,
  customTeammateDmg,
  enemy,
  enemyDebuff,
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

const key: CharacterKey = 'Sunna'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

const {
  abilityStun,
  angelic_chordination,
  etherVeil,
  etherVeilReprise,
  focusedCreation,
  focusedCreationDmg,
  ult_used,
} = allBoolConditionals(key, undefined, {
  etherVeil: 2,
  ult_used: 4,
  focusedCreation: 6,
  focusedCreationDmg: 6,
})
const { m1DefReductionStacks } = allNumConditionals(
  key,
  true,
  0,
  3,
  undefined,
  { m1DefReductionStacks: 1 }
)
// Triggering-teammate selector for Cat's Gaze (Dialyn pattern)
const { teammateSlot } = allListConditionals(key, ['None', 'Slot 1', 'Slot 2'])

// Additional Ability trigger: another squad member is an Attack character or
// shares the faction (Lighter pattern). ANDed with the manual toggle below.
const abilityCheck = (node: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('attack'),
      team.common.count.withFaction('AngelsOfDelusion')
    ),
    2,
    node
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
const s1_crit_ = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate1_crit_',
}).sum as unknown as NumNode
const s2_crit_ = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate2_crit_',
}).sum as unknown as NumNode
const s1_crit_dmg_ = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate1_crit_dmg_',
}).sum as unknown as NumNode
const s2_crit_dmg_ = reader.withTag({
  et: 'own',
  dst: null,
  qt: 'common',
  q: 'teammate2_crit_dmg_',
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

// Per-slot specialty checks
const s1_is_attack = cmpEq(s1_spec, 'attack', 1, 0)
const s1_is_anomaly = cmpEq(s1_spec, 'anomaly', 1, 0)
const s2_is_attack = cmpEq(s2_spec, 'attack', 1, 0)
const s2_is_anomaly = cmpEq(s2_spec, 'anomaly', 1, 0)

// Slot selection
const slot1_selected = cmpEq(teammateSlot.value, 1, 1, 0)
const slot2_selected = cmpEq(teammateSlot.value, 2, 1, 0)

// Cat's Gaze trigger multipliers, scaled by core level with the M2
// augmentation folded in (Trigger §3.10 pattern).
const catsgaze_attack_mult = sum(
  percent(subscript(char.core, dm.core.catsGazeAttackDmg)),
  cmpGE(char.mindscape, 2, percent(dm.m2.catsGazeAttackDmg))
)
const catsgaze_anomaly_mult = sum(
  percent(subscript(char.core, dm.core.catsGazeAnomalyDmg)),
  cmpGE(char.mindscape, 2, percent(dm.m2.catsGazeAnomalyDmg))
)
// M6: DMG dealt when any squad member triggers Cat's Gaze increases by 50%
// while Focused Creation is active. Gated on its own toggle (separate from
// the FC crit buffs) so each part can be modeled independently. The bonus is
// also registered as a display-only buff for the conditional readout.
const m6_catsgaze_dmg_ = cmpGE(
  char.mindscape,
  6,
  focusedCreationDmg.ifOn(percent(dm.m6.catsGazeDmg_))
)
const m6_catsgaze_mult = sum(percent(1), m6_catsgaze_dmg_)

// Cat's Gaze is treated as DMG dealt by the triggering Agent: it deals the
// trigger's attribute DMG, so each attribute gets its own formula instance,
// gated on the selected slot's bridged attribute (tags can't be conditional,
// so only the matching instance is nonzero). The base bakes in the
// triggerer's expected crit — normal crit rules on the Attack branch,
// guaranteed crit (+ core bonus CD) on the Anomaly branch — and the enemy RES
// of that same attribute (Remielle pattern). The `teammateDmg` pipeline then
// applies only the remaining enemy-side multipliers (DEF, DMG-taken, stun) —
// never Sunna's own crit/dmg%/flat bonuses — in particular, her Focused
// Creation guaranteed-crit/CD buffs touch only her own hits (including the
// self trigger below), while the M6 +50% applies to every trigger. Residual approximations: DEF
// uses the attacker's level slot (same-team same-level in practice) plus
// Sunna's DEF-ignore/PEN (zero on a support build), and RES-ignore reads
// Sunna's (near-always team-shared when present).
const s1_attack_crit = sum(percent(1), prod(min(s1_crit_, 1), s1_crit_dmg_))
const s2_attack_crit = sum(percent(1), prod(min(s2_crit_, 1), s2_crit_dmg_))
const s1_anomaly_crit = sum(
  percent(1),
  sum(s1_crit_dmg_, percent(subscript(char.core, dm.core.catsGazeCritDmg)))
)
const s2_anomaly_crit = sum(
  percent(1),
  sum(s2_crit_dmg_, percent(subscript(char.core, dm.core.catsGazeCritDmg)))
)

// RES multiplier for one trigger attribute, mirroring the shared pipeline's
// RES multiplier (1 - RES + RES-reduction + RES-ignore).
const resMult = (attr: string) =>
  sum(
    percent(1),
    prod(-1, (enemy.common.res_ as any)[attr]),
    (enemyDebuff.common.resRed_ as any)[attr],
    (own.final.resIgn_ as any)[attr]
  )
const triggerAttrs = ['fire', 'electric', 'ice', 'physical', 'ether', 'wind']

// Per-slot branch damage (triggerer's ATK × mult × baked triggerer crit).
const s1_branch = sum(
  prod(s1_is_attack, s1_atk, catsgaze_attack_mult, s1_attack_crit),
  prod(s1_is_anomaly, s1_atk, catsgaze_anomaly_mult, s1_anomaly_crit)
)
const s2_branch = sum(
  prod(s2_is_attack, s2_atk, catsgaze_attack_mult, s2_attack_crit),
  prod(s2_is_anomaly, s2_atk, catsgaze_anomaly_mult, s2_anomaly_crit)
)

// Base for one trigger attribute: the selected slot contributes only when
// its bridged attribute matches. The M6 +50% applies to every trigger while
// Focused Creation is active.
const attrBase = (attr: string) =>
  prod(
    sum(
      prod(
        slot1_selected,
        cmpEq(s1_attribute, attr, 1, 0),
        s1_branch,
        resMult(attr)
      ),
      prod(
        slot2_selected,
        cmpEq(s2_attribute, attr, 1, 0),
        s2_branch,
        resMult(attr)
      )
    ),
    m6_catsgaze_mult
  )

// M6 self trigger: Sunna triggers Cat's Gaze herself under Attack Agent
// rules. No crit is baked in — the owner is Sunna, so the displayed formula
// applies her own crit (guaranteed via m6_crit_ while active) correctly in
// avg/crit modes (Dialyn m6 pattern).
const m6_self_base = cmpGE(
  char.mindscape,
  6,
  focusedCreation.ifOn(
    prod(own.final.atk, catsgaze_attack_mult, m6_catsgaze_mult)
  )
)

const m6_crit_ = ownBuff.combat.crit_.add(
  cmpGE(char.mindscape, 6, focusedCreation.ifOn(percent(1)))
)
const m6_crit_dmg_ = ownBuff.combat.crit_dmg_.add(
  cmpGE(
    char.mindscape,
    6,
    focusedCreation.ifOn(
      min(
        percent(dm.m6.maxCritEx),
        prod(own.initial.atk, percent(dm.m6.critexPerAtk))
      )
    )
  )
)

const sheet = register(
  key,
  entriesForChar(data_gen),
  ...registerAllDmgDazeAndAnom(key, dm),

  // Cat's Gaze teammate triggers — one `teammateDmg` instance per trigger
  // attribute. The pipeline applies only enemy-side multipliers; the
  // triggerer's ATK/crit and attribute RES are already baked into each base.
  // The elemental tag matches no Sunna hit, and the display-only pairs below
  // keep the instances out of all hits.
  ...triggerAttrs.flatMap((attr) => {
    const base = attrBase(attr)
    return [
      ...customTeammateDmg(
        `catsgaze_dmg_${attr}`,
        { damageType1: 'elemental', attribute: attr as any },
        base
      ),
      registerBuff(
        `catsgaze_dmg_${attr}`,
        ownBuff.combat.flat_dmg.addWithDmgType('elemental', base),
        undefined,
        undefined,
        false
      ),
    ]
  }),

  // M6 self trigger — standalone instance like Dialyn's m6_dmg.
  ...customDmg(
    'm6_catsgaze_dmg',
    { damageType1: 'elemental', attribute: 'physical' },
    m6_self_base
  ),
  registerBuff(
    'm6_catsgaze_dmg',
    ownBuff.combat.flat_dmg.addWithDmgType('elemental', m6_self_base),
    undefined,
    undefined,
    false
  ),

  // Buffs
  registerBuff(
    'core_atk',
    teamBuff.combat.atk.add(
      angelic_chordination.ifOn(
        min(
          subscript(char.core, dm.core.maxAtkBonus),
          prod(own.initial.atk, percent(dm.core.atk_))
        )
      )
    ),
    undefined,
    true
  ),
  // EX Special effect (not the Additional Ability — hence no `ability_`
  // prefix, which is reserved for Additional Ability buffs dimmed via
  // AbilityBodyText). The 50 ATK is a flat kit value, not a datamine param.
  registerBuff(
    'reprise_atk',
    teamBuff.combat.atk.add(etherVeilReprise.ifOn(constant(50))),
    undefined,
    true
  ),
  registerBuff(
    'ability_stun_',
    enemyDebuff.common.stun_.add(
      abilityStun.ifOn(abilityCheck(percent(dm.ability.stunDmg_)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm1_defRed_',
    enemyDebuff.common.defRed_.add(
      cmpGE(
        char.mindscape,
        1,
        prod(m1DefReductionStacks, percent(dm.m1.defReduction))
      )
    ),
    undefined,
    true
  ),
  registerBuff(
    'm2_etherVeil_atk',
    teamBuff.combat.atk_.add(
      cmpGE(char.mindscape, 2, etherVeil.ifOn(percent(dm.m2.etherVeilAtk)))
    ),
    undefined,
    true
  ),
  registerBuff(
    'm4_dmg_',
    teamBuff.combat.common_dmg_.add(
      cmpGE(char.mindscape, 4, ult_used.ifOn(percent(dm.m4.squadDmg_)))
    ),
    undefined,
    true
  ),
  registerBuff('m6_crit_', m6_crit_),
  registerBuff('m6_crit_dmg_', m6_crit_dmg_),
  // Display-only readout for the trigger-DMG bonus (no stat effect).
  // Registered non-team so it stays out of the teammate view.
  registerBuff(
    'm6_catsgaze_dmg_',
    ownBuff.combat.common_dmg_.add(m6_catsgaze_dmg_),
    undefined,
    undefined,
    false
  )
)
export default sheet
