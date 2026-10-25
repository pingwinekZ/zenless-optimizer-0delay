import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Severian'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackSwiftEdge: data_gen.skillParams['basic']['BasicAttackSwiftEdge'],
    BasicAttackRagingWhirlwind:
      data_gen.skillParams['basic']['BasicAttackRagingWhirlwind'],
    BasicAttackAzureWindsShadowhunt:
      data_gen.skillParams['basic']['BasicAttackAzureWindsShadowhunt'],
  },
  dodge: {
    DodgeWindshift: data_gen.skillParams['dodge']['DodgeWindshift'],
    DashAttackSheerAssault:
      data_gen.skillParams['dodge']['DashAttackSheerAssault'],
    DodgeCounterFatalEnd: data_gen.skillParams['dodge']['DodgeCounterFatalEnd'],
    DodgeSpontaneity: data_gen.skillParams['dodge']['DodgeSpontaneity'],
  },
  special: {
    SpecialAttackGaleRend:
      data_gen.skillParams['special']['SpecialAttackGaleRend'],
    EXSpecialAttackSwiftwindRupture:
      data_gen.skillParams['special']['EXSpecialAttackSwiftwindRupture'],
  },
  chain: {
    ChainAttackColdbladeReap:
      data_gen.skillParams['chain']['ChainAttackColdbladeReap'],
    UltimateAnnihilatingWindstorm:
      data_gen.skillParams['chain']['UltimateAnnihilatingWindstorm'],
  },
  assist: {
    QuickAssistFieldOrders:
      data_gen.skillParams['assist']['QuickAssistFieldOrders'],
    DefensiveAssistProvocationProhibited:
      data_gen.skillParams['assist']['DefensiveAssistProvocationProhibited'],
    AssistFollowUpFightForceWithForce:
      data_gen.skillParams['assist']['AssistFollowUpFightForceWithForce'],
    EntrySkillClearOut: data_gen.skillParams['assist']['EntrySkillClearOut'],
  },
  core: {
    crit_dmg_: data_gen.coreParams[0],
    dmg_: data_gen.coreParams[1],
    wind_ally_dmg_: data_gen.coreParams[2],
    shadowflash_entry: data_gen.coreParams[3][0],
    cooldown: data_gen.coreParams[4][0],
    shadowflash_consumed: data_gen.coreParams[5][0],
    max_shadowflash: data_gen.coreParams[6][0],
    windborne_overflow: data_gen.coreParams[7][0],
    windborne_perfect_dodge: data_gen.coreParams[8][0],
    max_flow: data_gen.coreParams[9][0],
    shadowhunt_flow_threshold: data_gen.coreParams[10][0],
    shadowhunt_flow_cost: data_gen.coreParams[11][0],
  },
  ability: {
    crit_rate_step: data_gen.abilityParams[0],
    atk_per_crit_rate: data_gen.abilityParams[1],
    max_crit_rate: data_gen.abilityParams[2],
  },
  m1: {
    chain_flow: data_gen.mindscapeParams[0][0],
    cooldown: data_gen.mindscapeParams[0][1],
    windborne: data_gen.mindscapeParams[0][2],
    wind_resIgn_: data_gen.mindscapeParams[0][3],
  },
  m2: {
    flow: data_gen.mindscapeParams[1][0],
    cooldown: data_gen.mindscapeParams[1][1],
    pen_: data_gen.mindscapeParams[1][2],
    duration: data_gen.mindscapeParams[1][3],
  },
  m4: {
    atk_: data_gen.mindscapeParams[3][0],
    duration: data_gen.mindscapeParams[3][1],
    decibelGen_: data_gen.mindscapeParams[3][2],
    decibel_duration: data_gen.mindscapeParams[3][3],
  },
  m6: {
    max_flow: data_gen.mindscapeParams[5][0],
    entry_flow: data_gen.mindscapeParams[5][1],
    shadowhunt_final_dmg: data_gen.mindscapeParams[5][2],
    windrise_flow: data_gen.mindscapeParams[5][3],
    windrise_duration: data_gen.mindscapeParams[5][4],
  },
} as const

export default dm
