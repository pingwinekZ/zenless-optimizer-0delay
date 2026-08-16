import type { CharacterKey } from '../../../../consts'
import { getCharStat } from '../../../char'

const key: CharacterKey = 'NangongYu'
const data_gen = getCharStat(key)

const dm = {
  basic: {
    BasicAttackShootingStarStep:
      data_gen.skillParams['basic']['BasicAttackShootingStarStep'],
    BasicAttackAdorableExplosiveImpact:
      data_gen.skillParams['basic']['BasicAttackAdorableExplosiveImpact'],
  },
  dodge: {
    DodgeNaturalDancer: data_gen.skillParams['dodge']['DodgeNaturalDancer'],
    DashAttackSpinningMeteor:
      data_gen.skillParams['dodge']['DashAttackSpinningMeteor'],
    DodgeCounterAsteroidWaltz:
      data_gen.skillParams['dodge']['DodgeCounterAsteroidWaltz'],
  },
  special: {
    SpecialAttackTheWeightOfLove:
      data_gen.skillParams['special']['SpecialAttackTheWeightOfLove'],
    EXSpecialAttackTheUnbearableWeightOfLove:
      data_gen.skillParams['special'][
        'EXSpecialAttackTheUnbearableWeightOfLove'
      ],
  },
  chain: {
    ChainAttackCometGravity:
      data_gen.skillParams['chain']['ChainAttackCometGravity'],
    UltimateMeteorShower: data_gen.skillParams['chain']['UltimateMeteorShower'],
  },
  assist: {
    QuickAssistEmergencySave:
      data_gen.skillParams['assist']['QuickAssistEmergencySave'],
    DefensiveAssistPerfectedChoreography:
      data_gen.skillParams['assist']['DefensiveAssistPerfectedChoreography'],
    AssistFollowUpImprovisedPerformance:
      data_gen.skillParams['assist']['AssistFollowUpImprovisedPerformance'],
  },
  core: {
    anomalyProf: data_gen.coreParams[0], // 60 - Anomaly Prof +60
    masteryThresh: data_gen.coreParams[1][0], // 110 - Anomaly Mastery threshold
    impactPerMastery: data_gen.coreParams[2]?.[0] ?? 1, // 1 - Impact per mastery above threshold
    vibratoGain: data_gen.coreParams[3] ?? 1, // 1 - 1 stack of Vibrato
    maxVibrato: data_gen.coreParams[4], // 4 - Max Vibrato 4
    etherAbloom: data_gen.coreParams[5], // 7.2 - 720% Ether Abloom
    electricAbloom: data_gen.coreParams[6], // 3.6 - 360% Electric Abloom
    fireAbloom: data_gen.coreParams[7], // 9 - 900% Fire Abloom
    physicalAbloom: data_gen.coreParams[8], // 0.63 - 63% Physical Abloom
    iceAbloom: data_gen.coreParams[9], // 0.9 - 90% Ice Abloom
    windAbloom: data_gen.coreParams[10], // 0.36 - 36% Wind Abloom
    vibratoStackDmg: data_gen.coreParams[11], // 0.25 - +25% per Vibrato stack
    anomalyBuildup: data_gen.coreParams[12], // 0.17 - +17% Anomaly Buildup
    daze: data_gen.coreParams[13], // 0.11 - +11% Daze
    squadDmg: data_gen.coreParams[14], // 0.13 - +13% squad DMG
    duration: data_gen.coreParams[15], // 30 - 30s duration
    downbeatsRegen: data_gen.coreParams[16], // 3.8 - restores 3.8 Downbeats/s
    addlDownbeats: data_gen.coreParams[17], // 12 - additional 12 Downbeats
    downbeatsCd: data_gen.coreParams[18] ?? 6, // 6 - once every 6s
    maxDownbeats: data_gen.coreParams[19], // 100 - max 100 Downbeats
    initDownbeats: data_gen.coreParams[20], // 30 - starts with 30 Downbeats
  },
  ability: {
    squadAnomalyBuildup_: data_gen.abilityParams[0], // 0.3 - 30% squad Anomaly Buildup
    chainAnomalyBuildup_: data_gen.abilityParams[1], // 0.3 - 30% Chain Attack Anomaly Buildup
    danceProwessGain: data_gen.abilityParams[2], // 2 - 2 stacks Dance Prowess gained
    maxDanceProwess: data_gen.abilityParams[3], // 2 - max 2 stacks
    danceProwessDuration: data_gen.abilityParams[4], // 15 - 15s duration
    danceProwessConsume: data_gen.abilityParams[5], // 1 - 1 stack consumed for Polarity Disorder
    polarityDisorderDmg: data_gen.abilityParams[6], // 0.25 - 25% of Disorder DMG
    exSpecialNoEnergyDuration: data_gen.abilityParams[7], // 15 - 15s duration
    exSpecialNoEnergyCd: data_gen.abilityParams[8] ?? 15, // 15 - once every 15s
    ariaStackConsume: data_gen.abilityParams[9], // 1 - Aria triggers also consume 1 stack
    misstepStunDmg_: data_gen.abilityParams[10], // 0.3 - +30% Stun DMG
    stunDuration_: data_gen.abilityParams[11], // 3 - +3s Stun duration
  },
  m1: {
    resDecrease: data_gen.mindscapeParams[0][0], // 0.18 - 18% All-Attribute RES decrease
    duration: data_gen.mindscapeParams[0][1], // 40 - duration
    cooldown: data_gen.mindscapeParams[0][2], // 180 - Investigation Zone cooldown
  },
  m2: {
    vibratoStackDmg: data_gen.mindscapeParams[1][0], // 0.1 - +10% per Vibrato stack
    stunDmg: data_gen.mindscapeParams[1][1], // 0.3 - +30% Stun DMG
    polarityDisorderDmg: data_gen.mindscapeParams[1][2], // 0.25 - 25% Polarity Disorder
  },
  m3: {
    skillLevel: data_gen.mindscapeParams[2][0], // 2 - Skills +2
  },
  m4: {
    anomalyProf: data_gen.mindscapeParams[3][0], // 40 - Anomaly Prof +40
    basicAdorableExplosiveImpactAnomalyBuildup: data_gen.mindscapeParams[3][1], // 0.35 - +35% Basic Attack Anomaly Buildup
  },
  m5: {
    skillLevel: data_gen.mindscapeParams[4][0], // 2 - Skills +2
  },
  m6: {
    daze: data_gen.mindscapeParams[5][0], // 0.5 - +50% Daze
    vibratoModifiedGain1: data_gen.mindscapeParams[5][1], // 1 - 1 stack from triggers
    vibratoModifiedGain2: data_gen.mindscapeParams[5][2], // 1 - 1 stack from EX/Basic
    vibratoModifiedGain3: data_gen.mindscapeParams[5][3], // 2 - 2 stacks from Ultimate
    maxVibratoModified: data_gen.mindscapeParams[5][4], // 4 - max 4 stacks
    etherAbloom: data_gen.mindscapeParams[5][5], // 8 - 800% Ether
    electricAbloom: data_gen.mindscapeParams[5][6], // 4 - 400% Electric
    fireAbloom: data_gen.mindscapeParams[5][7], // 10 - 1000% Fire
    physicalAbloom: data_gen.mindscapeParams[5][8], // 0.7 - 70% Physical
    iceAbloom: data_gen.mindscapeParams[5][9], // 1 - 100% Ice
    windAbloom: data_gen.mindscapeParams[5][10], // 0.4 - 40% Wind
    vibratoModifiedStackDmg: data_gen.mindscapeParams[5][11], // 0.25 - +25% per stack
  },
} as const

export default dm
