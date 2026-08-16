import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Promeia'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackSweepingEdge:
      data_gen.skillParams['basic']['BasicAttackSweepingEdge'],
    BasicAttackWhirlingBlade:
      data_gen.skillParams['basic']['BasicAttackWhirlingBlade'],
    BoundAbsolution: data_gen.skillParams['basic']['BoundAbsolution'],
  },
  dodge: {
    DodgeVeiledStep: data_gen.skillParams['dodge']['DodgeVeiledStep'],
    DashAttackGrimReap: data_gen.skillParams['dodge']['DashAttackGrimReap'],
    DodgeCounterSoaringBat:
      data_gen.skillParams['dodge']['DodgeCounterSoaringBat'],
  },
  special: {
    SpecialAttackExecutionColdFlash:
      data_gen.skillParams['special']['SpecialAttackExecutionColdFlash'],
    EXSpecialAttackExecutionGlacialDeath:
      data_gen.skillParams['special']['EXSpecialAttackExecutionGlacialDeath'],
    EXSpecialAttackExecutionShroudedInShadow:
      data_gen.skillParams['special'][
        'EXSpecialAttackExecutionShroudedInShadow'
      ],
    SpecialAttackExecutionDescendingFrost:
      data_gen.skillParams['special']['SpecialAttackExecutionDescendingFrost'],
    SpecialAttackExecutionLayeredFrost:
      data_gen.skillParams['special']['SpecialAttackExecutionLayeredFrost'],
    EXSpecialAttackExecutionMercilessJudgment:
      data_gen.skillParams['special'][
        'EXSpecialAttackExecutionMercilessJudgment'
      ],
  },
  chain: {
    ChainAttackHangingJudgment:
      data_gen.skillParams['chain']['ChainAttackHangingJudgment'],
    UltimateGlaciatingImpalement:
      data_gen.skillParams['chain']['UltimateGlaciatingImpalement'],
  },
  assist: {
    QuickAssistAmbushingStrike:
      data_gen.skillParams['assist']['QuickAssistAmbushingStrike'],
    DefensiveAssistInjunction:
      data_gen.skillParams['assist']['DefensiveAssistInjunction'],
    AssistFollowUpInterceptingStrike:
      data_gen.skillParams['assist']['AssistFollowUpInterceptingStrike'],
  },
  core: {
    anomMasThresh: data_gen.coreParams[0],
    anomProfPerExcessMas: data_gen.coreParams[1],
    abloomDmgPerExcessMas: data_gen.coreParams[2],
    corrosiveChillGainFreeze: data_gen.coreParams[3],
    corrosiveChillGainDisorder: data_gen.coreParams[4],
    corrosiveChillGainVortex: data_gen.coreParams[5],
    corrosiveChillGainExSpecial: data_gen.coreParams[6],
    maxCorrosiveChill: data_gen.coreParams[7],
    corrosiveChillGainAbloom: data_gen.coreParams[8],
    chillConsumeThresh: data_gen.coreParams[9],
    chillToTrial: data_gen.coreParams[10],
    trialFrom50Chill: data_gen.coreParams[11],
    maxTrialByCold: data_gen.coreParams[12],
    initTrial: data_gen.coreParams[13],
    trialConsumeToTrigger: data_gen.coreParams[14],
    abloomDmgPerLevel: data_gen.coreParams[15],
    decibelGain: data_gen.coreParams[16],
    decibelCd: data_gen.coreParams[17],
    frostOathMax: data_gen.coreParams[18],
  },
  ability: {
    selfIceAnomBuildup_: data_gen.abilityParams[0],
  },
  m1: {
    trialGain: data_gen.mindscapeParams[0][0],
    additionalDefIgnore: data_gen.mindscapeParams[0][1],
  },
  m2: {
    anomProf: data_gen.mindscapeParams[1][0],
    trialAbloomMult: data_gen.mindscapeParams[1][1],
  },
  m4: {
    corrosiveChillRestore: data_gen.mindscapeParams[3][0],
    restoreCd: data_gen.mindscapeParams[3][1],
  },
  m6: {
    specialAbloomMult: data_gen.mindscapeParams[5][0],
    specialAbloomChill: data_gen.mindscapeParams[5][1],
    specialAbloomDecibel: data_gen.mindscapeParams[5][2],
    specialAbloomCd: data_gen.mindscapeParams[5][3],
    resIgnore_: data_gen.mindscapeParams[5][4],
  },
} as const

export default dm
