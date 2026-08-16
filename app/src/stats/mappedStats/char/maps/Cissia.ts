import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Cissia'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackTongueFlick:
      data_gen.skillParams['basic']['BasicAttackTongueFlick'],
    BasicAttackSerpentsKiss:
      data_gen.skillParams['basic']['BasicAttackSerpentsKiss'],
    CorrodeBone: data_gen.skillParams['basic']['CorrodeBone'],
  },
  dodge: {
    DodgeSlither: data_gen.skillParams['dodge']['DodgeSlither'],
    DashAttackBiteMark: data_gen.skillParams['dodge']['DashAttackBiteMark'],
    DodgeCounterBiteBack: data_gen.skillParams['dodge']['DodgeCounterBiteBack'],
  },
  special: {
    SpecialAttackBaredFangs:
      data_gen.skillParams['special']['SpecialAttackBaredFangs'],
    EXSpecialAttackVenomousBite:
      data_gen.skillParams['special']['EXSpecialAttackVenomousBite'],
  },
  chain: {
    ChainAttackGangOperation:
      data_gen.skillParams['chain']['ChainAttackGangOperation'],
    UltimateOphidiophobia:
      data_gen.skillParams['chain']['UltimateOphidiophobia'],
  },
  assist: {
    QuickAssistAlarmSystem:
      data_gen.skillParams['assist']['QuickAssistAlarmSystem'],
    DefensiveAssistExtraPrisonRations:
      data_gen.skillParams['assist']['DefensiveAssistExtraPrisonRations'],
    AssistFollowUpPartnersInCrime:
      data_gen.skillParams['assist']['AssistFollowUpPartnersInCrime'],
  },
  core: {
    baseVenom: data_gen.coreParams[0], // 3 - Venom gained on enter
    venomCd: data_gen.coreParams[1], // 180s - Investigation zone cooldown
    venomConsumeInterval: data_gen.coreParams[2] ?? 1, // Consume every 1 (x5s = 5s)
    venomConsume: data_gen.coreParams[3] ?? 5, // 5 - Venom consumed per trigger
    defIgnore: data_gen.coreParams[4], // 0.03-0.06 - Base DEF ignore
    enerThresh: data_gen.coreParams[5][0], // 1.4 - Energy regen threshold
    enerStep: data_gen.coreParams[6] ?? 0.12, // 0.12 - Energy step for additional DEF ignore
    defIgnorePerEner: data_gen.coreParams[7], // 0.0052-0.01 - Additional DEF ignore per energy step
    maxDefIgnore: data_gen.coreParams[8], // 0.1288-0.25 - Max DEF ignore
    duration: data_gen.coreParams[9], // 30s - Effect duration after Venom depleted
    corrodeBoneDmg: data_gen.coreParams[10], // 2.27-3.35 - Corrode Bone ATK%
    corrodeBoneDaze1Elec: data_gen.coreParams[13] ?? 0.4, // 0.4 - Daze boost with 1 Electric
    corrodeBoneDaze2Elec: data_gen.coreParams[14] ?? 0.6, // 0.6 - Daze boost with 2 Electric
    defIgnorePerStep:
      Number(data_gen.coreParams[7]?.[0] ?? 0.0052) /
      Number(data_gen.coreParams[6]?.[0] ?? 0.12), // 0.0433-0.0833 - DEF ignore per 0.12 energy step
  },
  ability: {
    squadCritDmg_: data_gen.abilityParams[0], // 0.4 - 40% squad CRIT DMG
    selfCritDmg_: data_gen.abilityParams[1], // 0.1 - 10% additional for Cissia
    duration: data_gen.abilityParams[2], // 30 - 30s duration
  },
  m1: {
    baseVenom: data_gen.mindscapeParams[0][0], // 6 - Venom increases to 6
    defIgnoreMult: data_gen.mindscapeParams[0][1], // 1.4 - DEF ignore to 140%
    electricResIgnore: data_gen.mindscapeParams[0][2], // 0.05 - 5% Electric RES ignore
    corrodeBoneResIgnore: data_gen.mindscapeParams[0][3], // 0.1 - 10% Corrode Bone RES ignore
  },
  m2: {
    addlVenom: data_gen.mindscapeParams[1][0], // 3 - +3 Venom on Chain/Ultimate hit
    basicSerpentsKissDmg_: data_gen.mindscapeParams[1][1], // 0.35 - +35% Basic Serpent's Kiss DMG
  },
  m3: {
    skillLevel: data_gen.mindscapeParams[2][0], // 2 - Skills +2
  },
  m4: {
    decidednessGain: data_gen.mindscapeParams[3][0], // 1 - gain 1 Decidedness
    maxDecidedness: data_gen.mindscapeParams[3][1], // 3 - max 3 stacks
    specialCorrodeBone: data_gen.mindscapeParams[3][2], // 1 - triggers special Corrode Bone
  },
  m5: {
    skillLevel: data_gen.mindscapeParams[4][0], // 2 - Skills +2
  },
  m6: {
    boneDeepCorrosion: data_gen.mindscapeParams[5][0], // 1 - gain 1 stack
    consumeBoneDeepCorrosion: data_gen.mindscapeParams[5][1], // 1 - consume 1 stack
    triggerSpecialCorrodeBone: data_gen.mindscapeParams[5][2], // 1 - trigger special
    stackConsumption: data_gen.mindscapeParams[5][3], // 1 - stacks consumed
    interval: data_gen.mindscapeParams[5][4], // 3 - 3s interval
  },
} as const

export default dm
