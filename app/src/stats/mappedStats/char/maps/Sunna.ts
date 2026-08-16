import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'Sunna'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackMischiefMeteorHammer:
      data_gen.skillParams['basic']['BasicAttackMischiefMeteorHammer'],
    BasicAttackNaughtyCatSpotted:
      data_gen.skillParams['basic']['BasicAttackNaughtyCatSpotted'],
  },
  dodge: {
    DodgeCantHitMe: data_gen.skillParams['dodge']['DodgeCantHitMe'],
    DashAttackSkywardHammer:
      data_gen.skillParams['dodge']['DashAttackSkywardHammer'],
    DodgeCounterDelusionStrikeout:
      data_gen.skillParams['dodge']['DodgeCounterDelusionStrikeout'],
  },
  special: {
    SpecialAttackStarShooter:
      data_gen.skillParams['special']['SpecialAttackStarShooter'],
    EXSpecialAttackBubblegumBarrage:
      data_gen.skillParams['special']['EXSpecialAttackBubblegumBarrage'],
    EXSpecialAttackSpecialPhotographyTechnique:
      data_gen.skillParams['special'][
        'EXSpecialAttackSpecialPhotographyTechnique'
      ],
  },
  chain: {
    ChainAttackDontMessWithTheCat:
      data_gen.skillParams['chain']['ChainAttackDontMessWithTheCat'],
    UltimateSmashItAll: data_gen.skillParams['chain']['UltimateSmashItAll'],
  },
  assist: {
    QuickAssistSonicBeatdown:
      data_gen.skillParams['assist']['QuickAssistSonicBeatdown'],
    DefensiveAssistStageFright:
      data_gen.skillParams['assist']['DefensiveAssistStageFright'],
    AssistFollowUpJumpTraining:
      data_gen.skillParams['assist']['AssistFollowUpJumpTraining'],
  },
  core: {
    atk_: data_gen.coreParams[0][0], // 0.3 - 30% ATK in Angelic Chord-ination
    maxAtkBonus: data_gen.coreParams[1], // [525, 615, 705, 795, 885, 975, 1050] - Max ATK bonus by level
    atkThreshold: data_gen.coreParams[2], // [1750, 2050, 2350, 2650, 2950, 3250, 3500] - ATK threshold by level
    catsGazeDuration: data_gen.coreParams[3][0], // 12s - Cat's Gaze duration
    catsGazeAttackDmg: data_gen.coreParams[4], // [1.5, 1.75, 2, 2.25, 2.5, 2.75, 3] - Attack DMG by level
    catsGazeAnomalyDmg: data_gen.coreParams[5], // [2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8] - Anomaly DMG by level
    catsGazeCritDmg: data_gen.coreParams[6], // [0.8, 0.9, 1, 1.2, 1.3, 1.4, 1.5] - CRIT DMG by level
  },
  ability: {
    stunDmg_: data_gen.abilityParams[0], // 0.3 - 30% Stun DMG Multiplier
    stunDuration: data_gen.abilityParams[1], // 40s - Stun duration
    energyOnEntry: data_gen.abilityParams[2], // 15 - Energy on entry
    investigationCooldown: data_gen.abilityParams[3], // 180s - Investigation Zone cooldown
  },
  m1: {
    energyOnEntry: data_gen.mindscapeParams[0][0], // 15 - Energy on entry
    investigationCooldown: data_gen.mindscapeParams[0][1], // 180s - Investigation Zone cooldown
    defReduction: data_gen.mindscapeParams[0][2], // 0.07 - 7% DEF reduction per stack
    defReductionDuration: data_gen.mindscapeParams[0][3], // 40s - DEF reduction duration
    defReductionStacks: data_gen.mindscapeParams[0][4] ?? 3, // 3 - Max stacks
  },
  m2: {
    etherVeilAtk: data_gen.mindscapeParams[1][0], // 0.1 - 10% ATK while in Ether Veil
    clawSharpenerRate: data_gen.mindscapeParams[1][1], // 1s - Claw Sharpener every 1s (10s in description, but value is 1)
    catsGazeTriggerReduction: data_gen.mindscapeParams[1][2], // 10 - reduced trigger count (10 = -10? Or value interpretation)
    catsGazeAttackDmg: data_gen.mindscapeParams[1][3], // 2 - +200% Attack trigger
    catsGazeAnomalyDmg: data_gen.mindscapeParams[1][4], // 3 - +300% Anomaly trigger
  },
  m3: {
    skillLevel: data_gen.mindscapeParams[2][0], // 2 - Skills +2
  },
  m4: {
    squadDmg_: data_gen.mindscapeParams[3][0], // 0.18 - +18% squad DMG
    duration: data_gen.mindscapeParams[3][1] ?? 60, // 60s - Duration
  },
  m5: {
    skillLevel: data_gen.mindscapeParams[4][0], // 2 - Skills +2
  },
  m6: {
    focusedCreationDuration: data_gen.mindscapeParams[5][0], // 8s - Focused Creation duration
    critexPerAtk: data_gen.mindscapeParams[5][1], // 0.0003 - CRIT DMG per initial ATK
    maxCritEx: data_gen.mindscapeParams[5][2], // 1.05 - Max 105% CRIT DMG
    dmgReduction: data_gen.mindscapeParams[5][3], // 0.4 - 40% DMG reduction
    catsGazeDmg_: data_gen.mindscapeParams[5][4] ?? 0.5, // 0.5 - +50% Cat's Gaze DMG
  },
} as const

export default dm
