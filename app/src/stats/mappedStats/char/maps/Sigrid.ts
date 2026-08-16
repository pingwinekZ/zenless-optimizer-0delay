import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Sigrid'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackFrostTippedSpear:
      data_gen.skillParams['basic']['BasicAttackFrostTippedSpear'],
    BasicAttackConvergingSpear:
      data_gen.skillParams['basic']['BasicAttackConvergingSpear'],
    BasicAttackConvergingSpear1stStage:
      data_gen.skillParams['basic']['BasicAttackConvergingSpear1stStage'],
    BasicAttackConvergingSpear2ndStage:
      data_gen.skillParams['basic']['BasicAttackConvergingSpear2ndStage'],
    BasicAttackConvergingSpear3rdStage:
      data_gen.skillParams['basic']['BasicAttackConvergingSpear3rdStage'],
  },
  dodge: {
    DodgeCloudstep: data_gen.skillParams['dodge']['DodgeCloudstep'],
    DashAttackWindchase: data_gen.skillParams['dodge']['DashAttackWindchase'],
    DodgeCounterCounterthrust:
      data_gen.skillParams['dodge']['DodgeCounterCounterthrust'],
  },
  special: {
    SpecialAttackFrostflower:
      data_gen.skillParams['special']['SpecialAttackFrostflower'],
    EXSpecialAttackScatteredJade:
      data_gen.skillParams['special']['EXSpecialAttackScatteredJade'],
    EXSpecialAttackShatteredJade:
      data_gen.skillParams['special']['EXSpecialAttackShatteredJade'],
  },
  chain: {
    ChainAttackEncroachingIce:
      data_gen.skillParams['chain']['ChainAttackEncroachingIce'],
    UltimateFrozenHeavens:
      data_gen.skillParams['chain']['UltimateFrozenHeavens'],
  },
  assist: {
    QuickAssistIronSentinel:
      data_gen.skillParams['assist']['QuickAssistIronSentinel'],
    DefensiveAssistDauntlessCold:
      data_gen.skillParams['assist']['DefensiveAssistDauntlessCold'],
    AssistFollowUpDevouringFrost:
      data_gen.skillParams['assist']['AssistFollowUpDevouringFrost'],
  },
  core: {
    // Converging Spear uses gained per activation (constant 1)
    convergeSpearGain: data_gen.coreParams[0][0],
    // Max Converging Spear stored (constant 1)
    maxConvergeSpearStored: data_gen.coreParams[1][0],
    // Converging Spear stage increment per trigger (constant 1)
    convergeSpearStageStep: data_gen.coreParams[2][0],
    // Stages advanced to go from stage 1 to max stage (constant 2)
    convergeSpearStagesToMax: data_gen.coreParams[3][0],
    // Max Converging Spear stage (constant 3)
    maxConvergeSpearStage: data_gen.coreParams[4][0],
    // Aerial Patrol Spear duration at stage 1/2/3 (constant 8/7/6s)
    patrolStage1Duration: data_gen.coreParams[5][0],
    patrolStage2Duration: data_gen.coreParams[6][0],
    patrolStage3Duration: data_gen.coreParams[7][0],
    // Stage reduction when Aerial Patrol ends (constant 1)
    stageEndReduction: data_gen.coreParams[8][0],
    // CRIT Rate buff on Aerial Patrol (varies 33%→66% by core level)
    patrolCrit_: data_gen.coreParams[9],
    // CRIT Rate buff duration (constant 8s)
    patrolCritDuration: data_gen.coreParams[10][0],
    // CRIT Rate extend duration per refresh (constant 8s)
    patrolCritExtend: data_gen.coreParams[11][0],
    // CRIT Rate max duration (constant 40s)
    patrolCritMaxDuration: data_gen.coreParams[12][0],
    // Stun DMG Multiplier increase vs stunned enemies (constant 20%)
    stunnedDmg_: data_gen.coreParams[13][0],
  },
  ability: {
    baseAtk: data_gen.abilityParams[0],
    atkPerLevel: data_gen.abilityParams[1],
    maxAtk: data_gen.abilityParams[2],
    contaminationDmg_: data_gen.abilityParams[3],
  },
  m1: {
    convergeSpearExtraGain: data_gen.mindscapeParams[0][0],
    // Extra Ice DMG (100% of ATK) on next Converging Spear final hit when activations exceed the stored limit
    overCapConvergeSpearDmg: data_gen.mindscapeParams[0][1],
    atk_: data_gen.mindscapeParams[0][2],
  },
  m2: {
    pen_: data_gen.mindscapeParams[1][0],
    patrolDurationExt: data_gen.mindscapeParams[1][1],
    decibelGen_: data_gen.mindscapeParams[1][2],
  },
  m4: {
    patrolDmg_: data_gen.mindscapeParams[3][0],
    patrolDmgDuration: data_gen.mindscapeParams[3][1],
    patrolDmgExtend: data_gen.mindscapeParams[3][2],
    patrolDmgMaxDuration: data_gen.mindscapeParams[3][3],
  },
  m6: {
    convergeSpear1ExtraDmg: data_gen.mindscapeParams[5][0],
    convergeSpear2ExtraDmg: data_gen.mindscapeParams[5][1],
    convergeSpear3ExtraDmg: data_gen.mindscapeParams[5][2],
  },
} as const

export default dm
