import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Phoenix'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackSeverLife: data_gen.skillParams['basic']['BasicAttackSeverLife'],
    BasicAttackPurifyingFlame:
      data_gen.skillParams['basic']['BasicAttackPurifyingFlame'],
    BasicAttackMeltdown: data_gen.skillParams['basic']['BasicAttackMeltdown'],
  },
  dodge: {
    DodgeDriftingSway: data_gen.skillParams['dodge']['DodgeDriftingSway'],
    DashAttackLunge: data_gen.skillParams['dodge']['DashAttackLunge'],
    DodgeCounterTwinPassageOfKarmicFire:
      data_gen.skillParams['dodge']['DodgeCounterTwinPassageOfKarmicFire'],
  },
  special: {
    SpecialAttackFireSweep:
      data_gen.skillParams['special']['SpecialAttackFireSweep'],
    EXSpecialAttackBlazingSlash:
      data_gen.skillParams['special']['EXSpecialAttackBlazingSlash'],
    EXSpecialAttackDazzlingFlare:
      data_gen.skillParams['special']['EXSpecialAttackDazzlingFlare'],
    EXSpecialAttackFallingSun:
      data_gen.skillParams['special']['EXSpecialAttackFallingSun'],
  },
  chain: {
    ChainAttackLastMinuteSalvation:
      data_gen.skillParams['chain']['ChainAttackLastMinuteSalvation'],
    UltimatePerpetualResurrection:
      data_gen.skillParams['chain']['UltimatePerpetualResurrection'],
    SoulSearchingBlaze: data_gen.skillParams['chain']['SoulSearchingBlaze'],
  },
  assist: {
    QuickAssistEmergencyAid:
      data_gen.skillParams['assist']['QuickAssistEmergencyAid'],
    DefensiveAssistPatientTurnedDoctor:
      data_gen.skillParams['assist']['DefensiveAssistPatientTurnedDoctor'],
    AssistFollowUpRegenerationTherapy:
      data_gen.skillParams['assist']['AssistFollowUpRegenerationTherapy'],
  },
  core: {
    anomProf: data_gen.coreParams[0],
    sear_duration: data_gen.coreParams[1][0],
    sear_crit_rate: data_gen.coreParams[2][0],
    sear_crit_dmg_: data_gen.coreParams[3],
    anomMas_threshold: data_gen.coreParams[4][0],
    crit_rate_per_anomMas: data_gen.coreParams[5][0],
    max_anomMas: data_gen.coreParams[6][0],
    sear_dmg_: data_gen.coreParams[7],
    sear_interval: data_gen.coreParams[8][0],
    max_pyre: data_gen.coreParams[9][0],
    rebirth_heal_: data_gen.coreParams[10][0],
    rebirth_cooldown: data_gen.coreParams[11][0],
    perfect_block_pyre: data_gen.coreParams[12][0],
    perfect_block_cooldown: data_gen.coreParams[13][0],
    wither_bloom_duration: data_gen.coreParams[14][0],
  },
  ability: {
    sear_crit_dmg_: data_gen.abilityParams[0],
  },
  m1: {
    ascension: data_gen.mindscapeParams[0][0],
    cooldown: data_gen.mindscapeParams[0][1],
    sear_crit_dmg_: data_gen.mindscapeParams[0][2],
    pyre_efficiency_: data_gen.mindscapeParams[0][3],
  },
  m2: {
    burn_duration: data_gen.mindscapeParams[1][0],
    sear_dmg_: data_gen.mindscapeParams[1][1],
  },
  m4: {
    abloom_instances: data_gen.mindscapeParams[3][0],
    abloom_multiplier: data_gen.mindscapeParams[3][1],
  },
  m6: {
    all_resIgn_: data_gen.mindscapeParams[5][0],
    ascension: data_gen.mindscapeParams[5][1],
    abloom_defIgn_: data_gen.mindscapeParams[5][2],
  },
} as const

export default dm
