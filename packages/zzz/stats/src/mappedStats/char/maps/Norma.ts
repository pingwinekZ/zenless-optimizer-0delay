import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Norma'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackEngineeringInsurance:
      data_gen.skillParams['basic']['BasicAttackEngineeringInsurance'],
    BasicAttackHatTrick: data_gen.skillParams['basic']['BasicAttackHatTrick'],
  },
  dodge: {
    DodgeDevelopmentProtocols:
      data_gen.skillParams['dodge']['DodgeDevelopmentProtocols'],
    DashAttackDeadlineRush:
      data_gen.skillParams['dodge']['DashAttackDeadlineRush'],
    DodgeCounterComplianceTesting:
      data_gen.skillParams['dodge']['DodgeCounterComplianceTesting'],
  },
  special: {
    SpecialAttackThermalShutdown:
      data_gen.skillParams['special']['SpecialAttackThermalShutdown'],
    EXSpecialAttackEnNahBarrage:
      data_gen.skillParams['special']['EXSpecialAttackEnNahBarrage'],
    SpecialAttackTargetPractice:
      data_gen.skillParams['special']['SpecialAttackTargetPractice'],
    EXSpecialAttackExplosiveExperiment:
      data_gen.skillParams['special']['EXSpecialAttackExplosiveExperiment'],
  },
  chain: {
    ChainAttackImpactDrill:
      data_gen.skillParams['chain']['ChainAttackImpactDrill'],
    UltimateDoctrineOfSuperiorFirepower:
      data_gen.skillParams['chain']['UltimateDoctrineOfSuperiorFirepower'],
  },
  assist: {
    QuickAssistRoaringBackup:
      data_gen.skillParams['assist']['QuickAssistRoaringBackup'],
    DefensiveAssistTechnologicalBastion:
      data_gen.skillParams['assist']['DefensiveAssistTechnologicalBastion'],
    AssistFollowUpTechnologicalSuppression:
      data_gen.skillParams['assist']['AssistFollowUpTechnologicalSuppression'],
  },
  core: {
    // CRIT Rate → CRIT DMG scaling
    critRateThreshold: data_gen.coreParams[0][0],
    critRateStep: data_gen.coreParams[1][0],
    critDmgPerStep: data_gen.coreParams[2],
    maxCritDmg_: data_gen.coreParams[3],
    // CRIT Rate → Daze scaling
    dazeCritRateThreshold: data_gen.coreParams[4][0],
    dazeCritRateStep: data_gen.coreParams[5][0],
    dazePerStep: data_gen.coreParams[6],
    maxDaze_: data_gen.coreParams[7],
    // Sheer Force ATK
    sheerForceUnit: data_gen.coreParams[8][0],
    atkPerSheerForce: data_gen.coreParams[9][0],
    maxSheerForceAtk: data_gen.coreParams[10][0],
    // Preheated Chamber
    initialPreheatedChamber: data_gen.coreParams[11][0],
    preheatedCooldown: data_gen.coreParams[12][0],
    preheatedThreshold: data_gen.coreParams[13][0],
    preheatedConsumed: data_gen.coreParams[14][0],
  },
  ability: {
    techDivideStacks: data_gen.abilityParams[0],
    stunDmgMultPerStack_: data_gen.abilityParams[1],
    maxTechDivideStacks: data_gen.abilityParams[2],
    techDivideInterval: data_gen.abilityParams[3],
    stunDurationInc: data_gen.abilityParams[4],
    atkBase: data_gen.abilityParams[5],
    atkPerLevel: data_gen.abilityParams[6],
    maxAtk: data_gen.abilityParams[7],
    squadDmg_: data_gen.abilityParams[8],
  },
  m1: {
    missileDuration: data_gen.mindscapeParams[0][0],
    allResRed_: data_gen.mindscapeParams[0][1],
    allResRedDuration: data_gen.mindscapeParams[0][2],
  },
  m2: {
    stunDmgMultPerStack_: data_gen.mindscapeParams[1][0],
    energy: data_gen.mindscapeParams[1][1],
    energyCooldown: data_gen.mindscapeParams[1][2],
  },
  m4: {
    decibel: data_gen.mindscapeParams[3][0],
  },
  m6: {
    barrageDuration: data_gen.mindscapeParams[5][0],
    missileInterval: data_gen.mindscapeParams[5][1],
    missileDmg: data_gen.mindscapeParams[5][2],
    barrageCooldown: data_gen.mindscapeParams[5][3],
    daze_: data_gen.mindscapeParams[5][4],
    dmg_: data_gen.mindscapeParams[5][5],
  },
} as const

export default dm
