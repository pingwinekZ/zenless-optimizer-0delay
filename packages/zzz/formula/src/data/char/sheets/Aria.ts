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
import { isStunned } from '../../common/enemy'
import {
  allBoolConditionals,
  customAnomalyDmg,
  own,
  ownBuff,
  percent,
  register,
  registerBuff,
  teamBuff,
} from '../../util'
import {
  anomalyMultipliers,
  dmgDazeAndAnomOverride,
  entriesForChar,
  getBaseTag,
  registerAllDmgDazeAndAnom,
} from '../util'

const key: CharacterKey = 'Aria'
const data_gen = allStats.char[key]
const dm = mappedStats.char[key]
const baseTag = getBaseTag(data_gen)

const { char } = own

const { m2Delusion, m6Delusion, etherVeil } = allBoolConditionals(
  key,
  undefined,
  { m2Delusion: 2, m6Delusion: 6 }
)

const m6_perfectPitch_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'basic',
  cmpGE(char.mindscape, 6, m6Delusion.ifOn(percent(dm.m6.enhancedDmg)))
)
const m6_ult_dmg_ = ownBuff.combat.dmg_.addWithDmgType(
  'ult',
  cmpGE(char.mindscape, 6, m6Delusion.ifOn(percent(dm.m6.enhancedDmg)))
)

// Abloom deals an additional instance of DMG equal to the core's Abloom ratio
// (X% per 10 initial Anomaly Mastery of the original Anomaly's DMG, ×1.5 when
// the target is Stunned). That ratio is a multiplier on the original anomaly
// DMG, so it folds into the base anomaly MV instead of being added to the
// generic anomaly MV multiplier (which would compute `original × (1 + ratio)`
// instead of `original × ratio`).
const abloomRatio = (dmgPerAp: number[]) =>
  prod(
    percent(subscript(char.core, dmgPerAp)),
    percent(1 / dm.core.perAnomMastery),
    own.initial.anomMas,
    sum(percent(1), isStunned.ifOn(percent(dm.core.stunnedDmgBonus)))
  )
const abloomRatioByAttr: Record<AttributeAnomalyKey, NumNode> = {
  ether: abloomRatio(dm.core.abloomEther),
  electric: abloomRatio(dm.core.abloomElectric),
  fire: abloomRatio(dm.core.abloomFire),
  physical: abloomRatio(dm.core.abloomPhysical),
  ice: abloomRatio(dm.core.abloomIce),
  wind: abloomRatio(dm.core.abloomWind),
}

// M1: Aria's own Basic / Special / EX Special hits ignore 10% of the
// target's Ether Anomaly Buildup RES. This is own-side (attacker-scoped) and
// damageType-scoped on purpose: an enemy-namespace debuff entry is shared
// across the whole team and would also match same-attribute teammates' hits
// (e.g. NangongYu). The reduction feeds `enemyAnomBuildupRes_mult_` in
// `data/common/anomalyBuildup.ts`.
const m1_ether_anomBuildupResRed_ = (
  ['basic', 'special', 'exSpecial'] as const
).flatMap((dmgType) =>
  ownBuff.combat.anomBuildupResRed_.ether.addWithDmgType(
    dmgType,
    cmpGE(char.mindscape, 1, percent(dm.m1.etherAnomBuildupResIgn))
  )
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
      'BasicAttackPerfectPitch',
      4,
      { ...baseTag, attribute: 'ether', damageType1: 'basic' },
      'atk',
      undefined,
      ...m6_perfectPitch_dmg_
    ),
    dmgDazeAndAnomOverride(
      dm,
      'chain',
      'Ultimate100Energy',
      0,
      { ...baseTag, attribute: 'ether', damageType1: 'ult' },
      'atk',
      undefined,
      ...m6_ult_dmg_
    )
  ),
  // Abloom DMG instances — an additional hit equal to the Abloom ratio of the
  // original anomaly's DMG, registered for every anomaly attribute. The bare
  // `abloomDmgInst` from `entriesForChar` stays hidden (no abloom MV-mult
  // source), so ether is registered here too with the correct ratio.
  // Named `abloomDmgInst_<attr>` (Vivian convention) so opt-target labels render
  // as "<Attr> Anomaly Abloom" via the shared formula label maps.
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
  registerBuff(
    'core_ether_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.ether.addWithDmgType(
      'abloom',
      abloomRatioByAttr.ether
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_electric_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.electric.addWithDmgType(
      'abloom',
      abloomRatioByAttr.electric
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_fire_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.fire.addWithDmgType(
      'abloom',
      abloomRatioByAttr.fire
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_physical_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.physical.addWithDmgType(
      'abloom',
      abloomRatioByAttr.physical
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_ice_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.ice.addWithDmgType(
      'abloom',
      abloomRatioByAttr.ice
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_wind_anom_mv_mult_',
    ownBuff.combat.anom_mv_mult_.wind.addWithDmgType(
      'abloom',
      abloomRatioByAttr.wind
    ),
    undefined,
    undefined,
    false
  ),
  registerBuff(
    'core_anomProf',
    ownBuff.combat.anomProf.add(subscript(char.core, dm.core.anomProf))
  ),
  registerBuff('m1_ether_anomBuildupResRed_', m1_ether_anomBuildupResRed_),
  registerBuff(
    'm1_abloom',
    ownBuff.combat.anom_crit_.add(
      cmpGE(
        char.mindscape,
        1,
        sum(
          constant(dm.m1.abloomCrit),
          max(
            0,
            prod(
              max(0, sum(own.initial.anomMas, -dm.m1.anomMasteryThreshold)),
              percent(dm.m1.critPerExcessMastery)
            )
          )
        )
      )
    )
  ),
  registerBuff(
    'm1_abloom_crit_dmg',
    ownBuff.combat.anom_crit_dmg_.add(
      cmpGE(char.mindscape, 1, constant(dm.m1.abloomCritDmg))
    )
  ),
  registerBuff(
    'm2_defIgn_base',
    ownBuff.combat.defIgn_.add(cmpGE(char.mindscape, 2, constant(dm.m2.defIgn)))
  ),
  registerBuff(
    'm2_defIgn_delusion',
    ownBuff.combat.defIgn_.add(
      cmpGE(char.mindscape, 2, m2Delusion.ifOn(constant(dm.m2.delusionDefIgn)))
    )
  ),
  registerBuff(
    'm6_perfectPitch_dmg_',
    m6_perfectPitch_dmg_,
    undefined,
    undefined,
    false
  ),
  registerBuff('m6_ult_dmg_', m6_ult_dmg_, undefined, undefined, false),
  registerBuff(
    'ultimate_atk',
    teamBuff.combat.atk.add(etherVeil.ifOn(constant(50))),
    undefined,
    true
  )
)

export default sheet
