import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Roxy'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackDoStayAWhile:
      data_gen.skillParams['basic']['BasicAttackDoStayAWhile'],
  },
  dodge: {
    DodgeExcuseMe: data_gen.skillParams['dodge']['DodgeExcuseMe'],
    DashAttackForgiveMyRudeness:
      data_gen.skillParams['dodge']['DashAttackForgiveMyRudeness'],
    DodgeCounterReturnedCourtesy:
      data_gen.skillParams['dodge']['DodgeCounterReturnedCourtesy'],
  },
  special: {
    SpecialAttackForgiveMeForNotSeeingYouOff:
      data_gen.skillParams['special'][
        'SpecialAttackForgiveMeForNotSeeingYouOff'
      ],
    SpecialAttackMuchObliged:
      data_gen.skillParams['special']['SpecialAttackMuchObliged'],
    EXSpecialAttackDontCatchAChill:
      data_gen.skillParams['special']['EXSpecialAttackDontCatchAChill'],
    EXSpecialAttackKindlyRestInPeace:
      data_gen.skillParams['special']['EXSpecialAttackKindlyRestInPeace'],
    EyeOfTheStorm: data_gen.skillParams['special']['EyeOfTheStorm'],
  },
  chain: {
    ChainAttackGaleBurialGreatHammer:
      data_gen.skillParams['chain']['ChainAttackGaleBurialGreatHammer'],
    UltimateRequiemForTheNightBurial:
      data_gen.skillParams['chain']['UltimateRequiemForTheNightBurial'],
  },
  assist: {
    AssistMoreOvertime: data_gen.skillParams['assist']['AssistMoreOvertime'],
    QuickAssistAtYourService:
      data_gen.skillParams['assist']['QuickAssistAtYourService'],
    DefensiveAssistAllowMeToAssist:
      data_gen.skillParams['assist']['DefensiveAssistAllowMeToAssist'],
    AssistFollowUpMidnightCode:
      data_gen.skillParams['assist']['AssistFollowUpMidnightCode'],
  },
  core: {
    windEnergyPerThreshold: data_gen.coreParams[0][0],
    energyThreshold: data_gen.coreParams[1][0],
    maxWindEnergy: data_gen.coreParams[2][0],
    erThreshold: data_gen.coreParams[3][0],
    erStep: data_gen.coreParams[4][0],
    atkPerStep: data_gen.coreParams[5][0],
    maxAtk: data_gen.coreParams[6],
    impactPerStep: data_gen.coreParams[7][0],
    maxImpact: data_gen.coreParams[8],
    critStep: data_gen.coreParams[9][0],
    critDmgPerStep: data_gen.coreParams[10][0],
    maxCritDmg: data_gen.coreParams[11],
    lacerationPerStep: data_gen.coreParams[12][0],
    maxLaceration: data_gen.coreParams[13],
    buffDuration: data_gen.coreParams[14][0],
  },
  ability: {
    selfDmgBase: data_gen.abilityParams[0],
    selfDmgPerLevel: data_gen.abilityParams[1],
    selfDmgMax: data_gen.abilityParams[2],
    stun_: data_gen.abilityParams[3],
    stunDuration: data_gen.abilityParams[4],
    windsweptDmg_: data_gen.abilityParams[5],
    energyRestore: data_gen.abilityParams[6],
    investigationCooldown: data_gen.abilityParams[7],
    windsweptExtension: data_gen.abilityParams[8],
    anomBuildup_: data_gen.abilityParams[9],
    anomBuildupDuration: data_gen.abilityParams[10],
  },
  m1: {
    allResRed_: data_gen.mindscapeParams[0][0],
    duration: data_gen.mindscapeParams[0][1],
    crit_dmg_: data_gen.mindscapeParams[0][2],
  },
  m2: {
    exDaze_: data_gen.mindscapeParams[1][0],
    windflowPerDetonation: data_gen.mindscapeParams[1][1],
    maxWindflow: data_gen.mindscapeParams[1][2],
    sustainPerStack: data_gen.mindscapeParams[1][3],
    maxSustain: data_gen.mindscapeParams[1][4],
    stun_: data_gen.mindscapeParams[1][5],
  },
  m4: {
    parryEnergy: data_gen.mindscapeParams[3][0],
    dodgeCounterEnergy: data_gen.mindscapeParams[3][1],
    ult_dmg_: data_gen.mindscapeParams[3][2],
    ult_daze_: data_gen.mindscapeParams[3][3],
  },
  m6: {
    wind_resIgn_: data_gen.mindscapeParams[5][0],
    afterechoInterval: data_gen.mindscapeParams[5][1],
    extraStorms: data_gen.mindscapeParams[5][2],
    giantWindstormMult_: data_gen.mindscapeParams[5][3],
    giantWindstormDaze_: data_gen.mindscapeParams[5][4],
  },
} as const

export default dm
