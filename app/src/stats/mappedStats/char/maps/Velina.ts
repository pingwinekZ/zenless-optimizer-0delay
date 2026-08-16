import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Velina'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackDancingFans:
      data_gen.skillParams['basic']['BasicAttackDancingFans'],
  },
  dodge: {
    DodgeWindwardSweep: data_gen.skillParams['dodge']['DodgeWindwardSweep'],
    DashAttackGaleStep: data_gen.skillParams['dodge']['DashAttackGaleStep'],
    DodgeCounterCloudrend:
      data_gen.skillParams['dodge']['DodgeCounterCloudrend'],
  },
  special: {
    SpecialAttackWindShearPurgingSurge:
      data_gen.skillParams['special']['SpecialAttackWindShearPurgingSurge'],
    EXSpecialAttackWindShearPurifyingRise:
      data_gen.skillParams['special']['EXSpecialAttackWindShearPurifyingRise'],
    EXSpecialAttackWindShearTripleDeathblow:
      data_gen.skillParams['special'][
        'EXSpecialAttackWindShearTripleDeathblow'
      ],
    EXSpecialAttackWindShearEyeOfTheStorm:
      data_gen.skillParams['special']['EXSpecialAttackWindShearEyeOfTheStorm'],
    SweepingCyclone: data_gen.skillParams['special']['SweepingCyclone'],
    CondensedCyclone: data_gen.skillParams['special']['CondensedCyclone'],
  },
  chain: {
    ChainAttackThousandfoldSpiral:
      data_gen.skillParams['chain']['ChainAttackThousandfoldSpiral'],
    UltimateHeedTheTempest:
      data_gen.skillParams['chain']['UltimateHeedTheTempest'],
  },
  assist: {
    QuickAssistEmergencyProtocol:
      data_gen.skillParams['assist']['QuickAssistEmergencyProtocol'],
    DefensiveAssistJudiciousIntervention:
      data_gen.skillParams['assist']['DefensiveAssistJudiciousIntervention'],
    AssistFollowUpNegotiationTechniques:
      data_gen.skillParams['assist']['AssistFollowUpNegotiationTechniques'],
  },
  core: {
    // ER → DMG & Anomaly Mastery scaling
    erThreshold: data_gen.coreParams[0][0],
    erStep: data_gen.coreParams[1][0],
    dmgPerStep: data_gen.coreParams[2][0],
    maxDmg: data_gen.coreParams[3][0],
    anomMasPerStep: data_gen.coreParams[4][0],
    maxAnomMas: data_gen.coreParams[5][0],
    // Windbloom resource
    initialWindbloom: data_gen.coreParams[6][0],
    initialCooldown: data_gen.coreParams[7][0],
    exWindbloom: data_gen.coreParams[8][0],
    maxWindbloom: data_gen.coreParams[9][0],
    // Windbite & Vortex
    windbitePerVortex: data_gen.coreParams[10][0],
    windbiteCooldown: data_gen.coreParams[11][0],
    windbiteConsumed: data_gen.coreParams[12][0],
    maxWindbite: data_gen.coreParams[13][0],
    condensedCycloneVortexDmg: data_gen.coreParams[14],
    // Sweeping Cyclone Anomaly Buildup RES reduction
    windAnomResRed_: data_gen.coreParams[15][0],
    windAnomResRedDuration: data_gen.coreParams[16][0],
    chromaticAnomResRed_: data_gen.coreParams[17][0],
    chromaticResRedDuration: data_gen.coreParams[18][0],
    // Cyclone extension on defeat
    cycloneExtension: data_gen.coreParams[19][0],
    // Abloom DMG multipliers
    condensedCycloneAbloom: data_gen.coreParams[20],
    sweepingCycloneAbloom: data_gen.coreParams[21],
  },
  ability: {
    windsweptVortexDmg_: data_gen.abilityParams[0],
    ultAbloomDmg: data_gen.abilityParams[1],
    anomResRed_: data_gen.abilityParams[2],
    daze_: data_gen.abilityParams[3],
    anomBuildup_: data_gen.abilityParams[4],
  },
  m1: {
    sweepingCycloneDaze: data_gen.mindscapeParams[0][0],
    allResIgn_: data_gen.mindscapeParams[0][1],
    windResIgn_: data_gen.mindscapeParams[0][2],
  },
  m2: {
    windbiteGain: data_gen.mindscapeParams[1][0],
    windbiteCooldown: data_gen.mindscapeParams[1][1],
    windsweptVortexDmg_: data_gen.mindscapeParams[1][2],
  },
  m4: {
    atk_: data_gen.mindscapeParams[3][0],
    duration: data_gen.mindscapeParams[3][1],
  },
  m6: {
    windbiteConsumed: data_gen.mindscapeParams[5][0],
    windbiteGain: data_gen.mindscapeParams[5][1],
    windbiteCooldown: data_gen.mindscapeParams[5][2],
    windAnomBuildup_: data_gen.mindscapeParams[5][3],
    windsweptDmgPerRemainingSec: data_gen.mindscapeParams[5][4],
    maxWindsweptDmg_: data_gen.mindscapeParams[5][5],
  },
} as const

export default dm
