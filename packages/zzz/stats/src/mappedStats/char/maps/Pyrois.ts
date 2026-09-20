import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Pyrois'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackEmberglow: data_gen.skillParams['basic']['BasicAttackEmberglow'],
    BasicAttackCelestialLight:
      data_gen.skillParams['basic']['BasicAttackCelestialLight'],
  },
  dodge: {
    DodgeTwilight: data_gen.skillParams['dodge']['DodgeTwilight'],
    DashAttackSunrise: data_gen.skillParams['dodge']['DashAttackSunrise'],
    DodgeCounterFirstLight:
      data_gen.skillParams['dodge']['DodgeCounterFirstLight'],
  },
  special: {
    SpecialAttackFadingRays:
      data_gen.skillParams['special']['SpecialAttackFadingRays'],
    EXSpecialAttackSunsHalo:
      data_gen.skillParams['special']['EXSpecialAttackSunsHalo'],
    SpecialAttackAssaultDirective:
      data_gen.skillParams['special']['SpecialAttackAssaultDirective'],
    '': data_gen.skillParams['special'][''],
  },
  chain: {
    ChainAttackCeremonialMarch:
      data_gen.skillParams['chain']['ChainAttackCeremonialMarch'],
    UltimateTotalAnnihilation:
      data_gen.skillParams['chain']['UltimateTotalAnnihilation'],
    UltimateTriumphantReturn:
      data_gen.skillParams['chain']['UltimateTriumphantReturn'],
    UltimateUnboundSwordstorm:
      data_gen.skillParams['chain']['UltimateUnboundSwordstorm'],
    UltimateEternalImprisonment:
      data_gen.skillParams['chain']['UltimateEternalImprisonment'],
  },
  assist: {
    QuickAssistDuskguard:
      data_gen.skillParams['assist']['QuickAssistDuskguard'],
    DefensiveAssistIronhideBehemoth:
      data_gen.skillParams['assist']['DefensiveAssistIronhideBehemoth'],
    AssistFollowUpReturnToDaylight:
      data_gen.skillParams['assist']['AssistFollowUpReturnToDaylight'],
  },
  core: {
    // Core Passive: Radiant Chariot
    initialProminence: data_gen.coreParams[0][0],
    initialCooldown: data_gen.coreParams[1][0],
    prominenceRegenPerSec: data_gen.coreParams[2][0],
    maxProminence: data_gen.coreParams[3][0],
    // Upper Branch (Ultimate: Total Annihilation) — Mirage state
    ultProminence: data_gen.coreParams[4][0],
    mirageCritDmg_: data_gen.coreParams[5][0],
    prominenceFollowUpThreshold: data_gen.coreParams[6][0],
    mirageDuration: data_gen.coreParams[7][0],
    // Lower Branch (Ultimate: Triumphant Return) — Sunflare state
    sunflareEnerRegen: data_gen.coreParams[8][0],
    sunflareDmg_: data_gen.coreParams[9],
    prominencePerPerfectBlock: data_gen.coreParams[10][0],
    sunflareDuration: data_gen.coreParams[11][0],
    // Left Branch (Ultimate: Unbound Swordstorm) vs Contamination
    leftBranchAtk: data_gen.coreParams[12],
    // Right Branch (Ultimate: Eternal Imprisonment) vs Stunned
    rightBranchAtk: data_gen.coreParams[13],
    stunExtension: data_gen.coreParams[14][0],
  },
  ability: {
    crit_dmg_: data_gen.abilityParams[0],
    decibel: data_gen.abilityParams[1],
  },
  m1: {
    decibel: data_gen.mindscapeParams[0][0],
    crit_: data_gen.mindscapeParams[0][2],
  },
  m2: {
    decibel: data_gen.mindscapeParams[1][0],
    cooldown: data_gen.mindscapeParams[1][1],
    decibelLimit: data_gen.mindscapeParams[1][2],
  },
} as const

export default dm
