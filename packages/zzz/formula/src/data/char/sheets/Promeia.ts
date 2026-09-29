import type { NumNode } from '@zenless-optimizer/pando/engine'
import {
  cmpGE,
  max,
  prod,
  subscript,
  sum,
} from '@zenless-optimizer/pando/engine'
import { type CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  allBoolConditionals,
  customAnomalyDmg,
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

const key: CharacterKey = 'Promeia'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]

const { char } = own

// Promeia's total Anomaly Mastery = initial * (1 + combat_%) + combat_flat
// We compute final.anomMas manually instead of reading agg-level `final.anomMas`
// to avoid the sum matching ALL characters' base entries (via mask=0 wildcard).
// initial = base * (1 + initial_%) + flat_disc
const promeiaInitAnomMas = sum(
  prod(
    reader.withTag({ et: 'own', qt: 'base', q: 'anomMas', sheet: key }),
    sum(
      percent(1),
      reader.withTag({
        et: 'own',
        qt: 'initial',
        q: 'anomMas_',
        sheet: 'agg',
        src: key,
      })
    )
  ),
  // Flat anomMas from disc substats (at sheet: 'dyn', scoped to Promeia via src)
  reader.withTag({
    et: 'own',
    qt: 'initial',
    q: 'anomMas',
    sheet: 'dyn',
    src: key,
  })
)
// final = initial * (1 + combat_%) + combat_flat
const promeiaFinalAnomMas = sum(
  prod(
    promeiaInitAnomMas,
    sum(
      percent(1),
      reader.withTag({
        et: 'own',
        qt: 'combat',
        q: 'anomMas_',
        sheet: 'agg',
        src: key,
      })
    )
  ),
  reader.withTag({
    et: 'own',
    qt: 'combat',
    q: 'anomMas',
    sheet: 'agg',
    src: key,
  })
)
const excessAnomMas = max(
  0,
  sum(promeiaFinalAnomMas, -dm.core.anomMasThresh[0])
)

const { presumptionOfGuilt, exSpecialIceBuildup } = allBoolConditionals(key)

// Additional Ability unlock check: at least one Anomaly or Support teammate
// besides Promeia herself (she counts as Anomaly, so >= 2 total).
const ability_check_no_self = (node: NumNode | number) =>
  cmpGE(
    sum(
      team.common.count.withSpecialty('anomaly'),
      team.common.count.withSpecialty('support')
    ),
    2,
    node
  )

// Ability: Ice Anomaly Buildup Rate +30% for 30s after using an EX Special
// Attack. Toggled via the `exSpecialIceBuildup` conditional.
// Independent of the Presumption toggle.
const ability_iceAnomBuildup_ = ownBuff.combat.anomBuildup_.ice.add(
  exSpecialIceBuildup.ifOn(
    ability_check_no_self(percent(dm.ability.selfIceAnomBuildup_))
  )
)

// Ability + M1 (merged): Abloom triggered on enemies with Presumption of
// Guilt ignores 40% DEF; M1 adds another 20%.
// Applied as team buff since any squad member's Abloom benefits
const ability_presumptionDefIgn = teamBuff.combat.defIgn_.addWithDmgType(
  'abloom',
  ability_check_no_self(
    presumptionOfGuilt.ifOn(
      sum(
        percent(dm.ability.presumptionDefIgn),
        cmpGE(char.mindscape, 1, percent(dm.m1.additionalDefIgnore))
      )
    )
  )
)

// Trial by Cold: Abloom DMG triggered by EX Special - Merciless Judgment.
// MV scales with core level (330%–635%); M2 adds +120% to the multiplier.
const trialByColdMV = sum(
  percent(subscript(own.char.core, dm.core.trialConsumeToTrigger)),
  cmpGE(char.mindscape, 2, percent(dm.m2.trialAbloomMult))
)

// M2: Anomaly Prof
const m2_anomProf = ownBuff.combat.anomProf.add(
  cmpGE(char.mindscape, 2, dm.m2.anomProf)
)

// M6: Abloom on a Presumption target triggers an additional special Abloom
// at a fixed 200% multiplier. (Chill restoration and Decibel gain are
// rotational and unmodeled.)
const m6SpecialAbloomBase = prod(
  percent(dm.m6.specialAbloomMult),
  own.final.atk,
  sum(percent(1), own.final.anom_mv_mult_)
)

// Chain Attack: heavy attack on an anomaly-afflicted enemy triggers Abloom
// once at a fixed 100% multiplier. Ultimate: same trigger at 250%.
// Neither consumes Trial by Cold, so M2's bonus does not apply.
const chainAbloomBase = prod(
  percent(1),
  own.final.atk,
  sum(percent(1), own.final.anom_mv_mult_)
)
const ultAbloomBase = prod(
  percent(2.5),
  own.final.atk,
  sum(percent(1), own.final.anom_mv_mult_)
)

// M6: All-Attribute RES ignore for Anomaly and Disorder DMG
const m6_resIgn_anomaly = ownBuff.combat.resIgn_.addWithDmgType(
  'anomaly',
  cmpGE(char.mindscape, 6, percent(dm.m6.resIgnore_))
)
const m6_resIgn_disorder = ownBuff.combat.resIgn_.addWithDmgType(
  'disorder',
  cmpGE(char.mindscape, 6, percent(dm.m6.resIgnore_))
)

const sheet = register(
  key,
  entriesForChar(data_gen),

  ...registerAllDmgDazeAndAnom(key, dm),

  ...customAnomalyDmg(
    'trialByColdAbloomDmg',
    {
      attribute: data_gen.attribute,
      damageType1: 'anomaly',
      damageType2: 'abloom',
    },
    prod(trialByColdMV, own.final.atk, sum(percent(1), own.final.anom_mv_mult_))
  ),
  // Display-only pair for the Trial-by-Cold Abloom instance (the formula
  // above computes the real damage; this entry never applies to stats).
  registerBuff(
    'trialByColdAbloomDmg',
    ownBuff.combat.dmg_.addWithDmgType('abloom', trialByColdMV),
    undefined,
    undefined,
    false
  ),

  ...customAnomalyDmg(
    'm6SpecialAbloomDmg',
    {
      attribute: data_gen.attribute,
      damageType1: 'anomaly',
      damageType2: 'abloom',
    },
    cmpGE(char.mindscape, 6, m6SpecialAbloomBase)
  ),
  // Display-only pair for the M6 special Abloom instance.
  registerBuff(
    'm6SpecialAbloomDmg',
    ownBuff.combat.dmg_.addWithDmgType(
      'abloom',
      cmpGE(char.mindscape, 6, percent(dm.m6.specialAbloomMult))
    ),
    undefined,
    undefined,
    false
  ),

  ...customAnomalyDmg(
    'chainAbloomDmg',
    {
      attribute: data_gen.attribute,
      damageType1: 'anomaly',
      damageType2: 'abloom',
    },
    chainAbloomBase
  ),
  // Display-only pair for the Chain Attack Abloom instance.
  registerBuff(
    'chainAbloomDmg',
    ownBuff.combat.dmg_.addWithDmgType('abloom', percent(1)),
    undefined,
    undefined,
    false
  ),

  ...customAnomalyDmg(
    'ultAbloomDmg',
    {
      attribute: data_gen.attribute,
      damageType1: 'anomaly',
      damageType2: 'abloom',
    },
    ultAbloomBase
  ),
  // Display-only pair for the Ultimate Abloom instance.
  registerBuff(
    'ultAbloomDmg',
    ownBuff.combat.dmg_.addWithDmgType('abloom', percent(2.5)),
    undefined,
    undefined,
    false
  ),

  // Core Passive: Anomaly Prof from excess Anomaly Mastery
  registerBuff(
    'core_anomProf',
    ownBuff.combat.anomProf.add(
      prod(excessAnomMas, dm.core.anomProfPerExcessMas[0])
    )
  ),

  // Core Passive: Squad Abloom DMG from excess Anomaly Mastery
  registerBuff(
    'core_abloomDmg',
    teamBuff.combat.anom_mv_mult_.addWithDmgType(
      'abloom',
      prod(excessAnomMas, percent(dm.core.abloomDmgPerExcessMas[0]))
    ),
    undefined,
    true
  ),

  // Ability: Ice Anomaly Buildup after EX Special (no Presumption requirement)
  registerBuff('ability_iceAnomBuildup_', ability_iceAnomBuildup_),

  // Ability + M1: Presumption of Guilt - DEF ignore for Abloom
  // Applied as team buff since any squad member's Abloom benefits
  registerBuff(
    'ability_presumptionDefIgn',
    ability_presumptionDefIgn,
    undefined,
    true
  ),

  // M2: Anomaly Prof
  registerBuff('m2_anomProf', m2_anomProf),

  // M4: Corrosive Chill restore (handled in formula via conditional)

  // M6: All-Attribute RES ignore for Anomaly and Disorder DMG
  registerBuff('m6_resIgn_anomaly', m6_resIgn_anomaly),
  registerBuff('m6_resIgn_disorder', m6_resIgn_disorder)
)
export default sheet
