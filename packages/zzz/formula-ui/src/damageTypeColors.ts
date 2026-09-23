import type { DamageType } from '@zenless-optimizer/zzz/formula'

/**
 * Ability-category palette, ported from hsr-optimizer's `ABILITY_COLORS`
 * (`lib/characterPreview/buffsAnalysis/abilityColors`). One stable hue per
 * category, used by damage-tag pills, filter bars and charts so the same
 * category reads the same everywhere.
 */
export const ABILITY_TAG_COLORS = {
  ALL: '#8c8c8c',
  BASIC: '#91caff',
  DASH: '#bae0ff',
  DODGE_COUNTER: '#7cc4ff',
  SPECIAL: '#b37feb',
  EX_SPECIAL: '#9254de',
  CHAIN: '#ffadd2',
  ULT: '#5cdbd3',
  ENTRY_SKILL: '#adc6ff',
  QUICK_ASSIST: '#69b1ff',
  DEFENSIVE_ASSIST: '#40a9ff',
  EVASIVE_ASSIST: '#91d5ff',
  ASSIST_FOLLOW_UP: '#36cfc9',
  COUNTER_ASSIST: '#85e89d',
  ANOMALY: '#95de64',
  DISORDER: '#ffc069',
  AFTERSHOCK: '#ffd666',
  ELEMENTAL: '#ff7875',
  SHEER: '#ff9c6e',
  SHARP: '#d3adf7',
  GASH: '#ff85c0',
  MAIM: '#f759ab',
  ABLOOM: '#b7eb8f',
  LUMINIZE: '#fadb14',
  VORTEX: '#87e8de',
  WINDSWEPT: '#a3d0ff',
  BURN: '#ffa940',
} as const

/** Stable color per ZZZ damage type, keyed like `damageTypeKeysMap`. */
export const DAMAGE_TYPE_COLORS: Record<DamageType, string> = {
  basic: ABILITY_TAG_COLORS.BASIC,
  dash: ABILITY_TAG_COLORS.DASH,
  dodgeCounter: ABILITY_TAG_COLORS.DODGE_COUNTER,
  special: ABILITY_TAG_COLORS.SPECIAL,
  exSpecial: ABILITY_TAG_COLORS.EX_SPECIAL,
  chain: ABILITY_TAG_COLORS.CHAIN,
  ult: ABILITY_TAG_COLORS.ULT,
  entrySkill: ABILITY_TAG_COLORS.ENTRY_SKILL,
  quickAssist: ABILITY_TAG_COLORS.QUICK_ASSIST,
  defensiveAssist: ABILITY_TAG_COLORS.DEFENSIVE_ASSIST,
  evasiveAssist: ABILITY_TAG_COLORS.EVASIVE_ASSIST,
  assistFollowUp: ABILITY_TAG_COLORS.ASSIST_FOLLOW_UP,
  counterAssist: ABILITY_TAG_COLORS.COUNTER_ASSIST,
  anomaly: ABILITY_TAG_COLORS.ANOMALY,
  disorder: ABILITY_TAG_COLORS.DISORDER,
  aftershock: ABILITY_TAG_COLORS.AFTERSHOCK,
  elemental: ABILITY_TAG_COLORS.ELEMENTAL,
  sheer: ABILITY_TAG_COLORS.SHEER,
  sharp: ABILITY_TAG_COLORS.SHARP,
  gash: ABILITY_TAG_COLORS.GASH,
  maim: ABILITY_TAG_COLORS.MAIM,
  abloom: ABILITY_TAG_COLORS.ABLOOM,
  luminize: ABILITY_TAG_COLORS.LUMINIZE,
  vortex: ABILITY_TAG_COLORS.VORTEX,
  windswept: ABILITY_TAG_COLORS.WINDSWEPT,
  burn: ABILITY_TAG_COLORS.BURN,
}

const UNKNOWN_DAMAGE_TYPE_COLOR = ABILITY_TAG_COLORS.ALL

/** Stable color for a damage type key, grey for anything unrecognized. */
export function damageTypeColor(key: string): string {
  return DAMAGE_TYPE_COLORS[key as DamageType] ?? UNKNOWN_DAMAGE_TYPE_COLOR
}
