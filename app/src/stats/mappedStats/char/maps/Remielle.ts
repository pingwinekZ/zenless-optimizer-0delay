import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Remielle'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackLeap: data_gen.skillParams['basic']['BasicAttackLeap'],
    BasicAttackSoloDance: data_gen.skillParams['basic']['BasicAttackSoloDance'],
    BasicAttackRainbowsEnd:
      data_gen.skillParams['basic']['BasicAttackRainbowsEnd'],
    BasicAttackFleetingGrace:
      data_gen.skillParams['basic']['BasicAttackFleetingGrace'],
  },
  dodge: {
    DodgeRetreatingLight: data_gen.skillParams['dodge']['DodgeRetreatingLight'],
    DashAttackKeenLight: data_gen.skillParams['dodge']['DashAttackKeenLight'],
    DodgeCounterMirroredShadow:
      data_gen.skillParams['dodge']['DodgeCounterMirroredShadow'],
  },
  special: {
    SpecialAttackSliverOfLight:
      data_gen.skillParams['special']['SpecialAttackSliverOfLight'],
    EXSpecialAttackOdeToDawn:
      data_gen.skillParams['special']['EXSpecialAttackOdeToDawn'],
    SpecialAttackOdeToDawnRadiantTurn:
      data_gen.skillParams['special']['SpecialAttackOdeToDawnRadiantTurn'],
  },
  chain: {
    ChainAttackInterwovenDanceSteps:
      data_gen.skillParams['chain']['ChainAttackInterwovenDanceSteps'],
    UltimateDazzlingCurtainCall:
      data_gen.skillParams['chain']['UltimateDazzlingCurtainCall'],
  },
  assist: {
    QuickAssistFeatherglowRebirth:
      data_gen.skillParams['assist']['QuickAssistFeatherglowRebirth'],
    DefensiveAssistFleetingLight:
      data_gen.skillParams['assist']['DefensiveAssistFleetingLight'],
    AssistFollowUpAwakeningGlimmer:
      data_gen.skillParams['assist']['AssistFollowUpAwakeningGlimmer'],
    AssistFlowerFeatherDance:
      data_gen.skillParams['assist']['AssistFlowerFeatherDance'],
  },
  core: {
    // Refringe Coefficient = 0.02% of AP (constant)
    refringeCoeff: data_gen.coreParams[0][0],
    // Max Voidflare storage (constant 3)
    maxVoidflare: data_gen.coreParams[1][0],
    // Base Luminize AP multiplier (constant 0.1%)
    luminizeBaseApMultiplier: data_gen.coreParams[2][0],
    // Anomaly count threshold (constant 3)
    anomalyCountThreshold: data_gen.coreParams[3][0],
    // Luminize AP scaling multiplier (varies 0.1%→0.2% by core level)
    luminizeApMultiplier: data_gen.coreParams[4],
  },
  ability: {
    anomalyCount1: data_gen.abilityParams[0],
    anomalyCount2: data_gen.abilityParams[1],
    anomalyCount3: data_gen.abilityParams[2],
    atk_1Anom: data_gen.abilityParams[3],
    atk_2Anom: data_gen.abilityParams[4],
    atk_3Anom: data_gen.abilityParams[5],
    maxAtkCap: data_gen.abilityParams[6],
    daze_1Anom: data_gen.abilityParams[7],
    daze_2Anom: data_gen.abilityParams[8],
    daze_3Anom: data_gen.abilityParams[9],
    anomBuildup_: data_gen.abilityParams[10],
    duration: data_gen.abilityParams[11],
  },
  m1: {
    specialVoidflareGain: data_gen.mindscapeParams[0][0],
    specialVoidflareCooldown: data_gen.mindscapeParams[0][1],
    allResIgn_: data_gen.mindscapeParams[0][2],
    decibelGain: data_gen.mindscapeParams[0][3],
    decibelCooldown: data_gen.mindscapeParams[0][4],
    squadAnomDmg_: data_gen.mindscapeParams[0][5],
  },
  m2: {
    refringeCoeff_: data_gen.mindscapeParams[1][0],
    defIgn_: data_gen.mindscapeParams[1][1],
    prismaticPersistDuration: data_gen.mindscapeParams[1][2],
  },
  m4: {
    luminizeDmg_: data_gen.mindscapeParams[3][0],
    specialVoidflareRegain: data_gen.mindscapeParams[3][1],
  },
  m6: {
    luminizeTriggerCount: data_gen.mindscapeParams[5][0],
    specialVoidflareGain: data_gen.mindscapeParams[5][1],
    specialVoidflareDmg_: data_gen.mindscapeParams[5][2],
  },
} as const

export default dm
