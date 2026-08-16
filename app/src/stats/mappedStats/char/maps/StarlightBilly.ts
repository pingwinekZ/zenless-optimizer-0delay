import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'StarlightBilly'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackKnightsTechnique:
      data_gen.skillParams['basic']['BasicAttackKnightsTechnique'],
    BasicAttackFullThrottleStarlight:
      data_gen.skillParams['basic']['BasicAttackFullThrottleStarlight'],
  },
  dodge: {
    DodgeCloseCall: data_gen.skillParams['dodge']['DodgeCloseCall'],
    DodgeThroughTheGalaxy:
      data_gen.skillParams['dodge']['DodgeThroughTheGalaxy'],
    DashAttackStarlightRetribution:
      data_gen.skillParams['dodge']['DashAttackStarlightRetribution'],
    DodgeCounterDuelKing: data_gen.skillParams['dodge']['DodgeCounterDuelKing'],
    DodgeCounterAfterfireSpin:
      data_gen.skillParams['dodge']['DodgeCounterAfterfireSpin'],
  },
  special: {
    SpecialAttackDriveSuppression:
      data_gen.skillParams['special']['SpecialAttackDriveSuppression'],
    SpecialAttackRunWild:
      data_gen.skillParams['special']['SpecialAttackRunWild'],
    EXSpecialAttackCoolWheelie:
      data_gen.skillParams['special']['EXSpecialAttackCoolWheelie'],
    EXSpecialAttackHighTractionWheels:
      data_gen.skillParams['special']['EXSpecialAttackHighTractionWheels'],
    EXSpecialAttackRockingFootwork:
      data_gen.skillParams['special']['EXSpecialAttackRockingFootwork'],
  },
  chain: {
    ChainAttackKnightsSwagger:
      data_gen.skillParams['chain']['ChainAttackKnightsSwagger'],
    UltimateStarlightKnightFlyingKick:
      data_gen.skillParams['chain']['UltimateStarlightKnightFlyingKick'],
  },
  assist: {
    QuickAssistStarlightPowerOfBonds:
      data_gen.skillParams['assist']['QuickAssistStarlightPowerOfBonds'],
    DefensiveAssistHerosEntrance:
      data_gen.skillParams['assist']['DefensiveAssistHerosEntrance'],
    AssistFollowUpVillainsExit:
      data_gen.skillParams['assist']['AssistFollowUpVillainsExit'],
  },
  core: {
    sheerForcePerHp: data_gen.coreParams[1],
    adrenalineRestore: data_gen.coreParams[2][0],
    investigationCooldown: data_gen.coreParams[3][0],
    hpThresholdSpecial: data_gen.coreParams[4][0],
    critDmgPerUse: data_gen.coreParams[5],
    critDmgDuration: data_gen.coreParams[6][0],
    hpThresholdDmgReduction: data_gen.coreParams[7][0],
    dmgReduction: data_gen.coreParams[8][0],
    determinationCap: data_gen.coreParams[9][0],
    determinationPerfectDodge: data_gen.coreParams[10][0],
    determinationRequired: data_gen.coreParams[11][0],
    determinationCost: data_gen.coreParams[12][0],
  },
  ability: {
    starlightStacksPerUse: data_gen.abilityParams[0],
    starlightDuration: data_gen.abilityParams[1],
    starlightMaxStacks: data_gen.abilityParams[2],
    starlightDmgPerStack: data_gen.abilityParams[3],
  },
  m1: {
    additionalAdrenaline: data_gen.mindscapeParams[0][0],
    physResIgn: data_gen.mindscapeParams[0][1],
    physResIgnDuration: data_gen.mindscapeParams[0][2],
  },
  m2: {
    dmg_: data_gen.mindscapeParams[1][0],
    turboCritDmg: data_gen.mindscapeParams[1][1],
    turboMaxStacks: data_gen.mindscapeParams[1][2],
  },
  m4: {
    critDmgPerUse: data_gen.mindscapeParams[3][0],
    maxStacks: data_gen.mindscapeParams[3][1],
    duration: data_gen.mindscapeParams[3][2],
    hpThreshold: data_gen.mindscapeParams[3][3],
    hpRestoreRate: data_gen.mindscapeParams[3][4],
  },
  m6: {
    sheerDmg_: data_gen.mindscapeParams[5][0],
    stacksPerSkill: data_gen.mindscapeParams[5][1],
    maxBrilliantStacks: data_gen.mindscapeParams[5][2],
    stacksPerUse: data_gen.mindscapeParams[5][3],
    maxStacksConsumed: data_gen.mindscapeParams[5][4],
    sheerPerStack: data_gen.mindscapeParams[5][5],
  },
} as const

export default dm
