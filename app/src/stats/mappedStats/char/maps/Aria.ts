import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Aria'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackSweetMelody:
      data_gen.skillParams['basic']['BasicAttackSweetMelody'],
    BasicAttackPerfectPitch:
      data_gen.skillParams['basic']['BasicAttackPerfectPitch'],
  },
  dodge: {
    DodgeOnBeatPrecision: data_gen.skillParams['dodge']['DodgeOnBeatPrecision'],
    DashAttackSilkySmoothCombo:
      data_gen.skillParams['dodge']['DashAttackSilkySmoothCombo'],
    DodgeCounterSlideShiftVariation:
      data_gen.skillParams['dodge']['DodgeCounterSlideShiftVariation'],
  },
  special: {
    SpecialAttackFullSugarElectronica:
      data_gen.skillParams['special']['SpecialAttackFullSugarElectronica'],
    SpecialAttackFullSugarElectronicaNoIce:
      data_gen.skillParams['special']['SpecialAttackFullSugarElectronicaNoIce'],
    EXSpecialAttackFallIntoDelusion:
      data_gen.skillParams['special']['EXSpecialAttackFallIntoDelusion'],
    EXSpecialAttackInstantlyHooked:
      data_gen.skillParams['special']['EXSpecialAttackInstantlyHooked'],
  },
  chain: {
    ChainAttackDreamCollab:
      data_gen.skillParams['chain']['ChainAttackDreamCollab'],
    Ultimate100Energy: data_gen.skillParams['chain']['Ultimate100Energy'],
  },
  assist: {
    QuickAssistShatterFantasy:
      data_gen.skillParams['assist']['QuickAssistShatterFantasy'],
    DefensiveAssistClutchSave:
      data_gen.skillParams['assist']['DefensiveAssistClutchSave'],
    AssistFollowUpEncoreSong:
      data_gen.skillParams['assist']['AssistFollowUpEncoreSong'],
  },
  core: {
    anomProf: data_gen.coreParams[0],
    abloomEther: data_gen.coreParams[1],
    abloomElectric: data_gen.coreParams[2],
    abloomFire: data_gen.coreParams[3],
    abloomPhysical: data_gen.coreParams[4],
    abloomIce: data_gen.coreParams[5],
    abloomWind: data_gen.coreParams[6],
    perAnomMastery: data_gen.coreParams[7],
    stunnedDmgBonus: data_gen.coreParams[8],
  },
  ability: {
    fandomPower: data_gen.abilityParams[0],
    veilCooldown: data_gen.abilityParams[1],
    corruptionDuration: data_gen.abilityParams[2],
  },
  m1: {
    etherAnomBuildupResIgn: data_gen.mindscapeParams[0][0],
    abloomCrit: data_gen.mindscapeParams[0][1],
    abloomCritDmg: data_gen.mindscapeParams[0][2],
    anomMasteryThreshold: data_gen.mindscapeParams[0][3],
    critPerExcessMastery: data_gen.mindscapeParams[0][4],
  },
  m2: {
    defIgn: data_gen.mindscapeParams[1][0],
    delusionDefIgn: data_gen.mindscapeParams[1][1],
  },
  m4: {
    energy: data_gen.mindscapeParams[3][0],
    decibels: data_gen.mindscapeParams[3][1],
    cooldown: data_gen.mindscapeParams[3][2],
  },
  m6: {
    initialDecibels: data_gen.mindscapeParams[5][0],
    investigationCooldown: data_gen.mindscapeParams[5][1],
    enhancedDmg: data_gen.mindscapeParams[5][2],
    stacksPerAnomaly: data_gen.mindscapeParams[5][3],
    stackCooldown: data_gen.mindscapeParams[5][4],
    maxStacks: data_gen.mindscapeParams[5][5],
    excessConversion: data_gen.mindscapeParams[5][6],
  },
} as const

export default dm
