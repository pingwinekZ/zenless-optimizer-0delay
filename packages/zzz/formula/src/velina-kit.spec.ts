import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { describe, expect, it } from 'vitest'
import {
  buffs,
  charTagMapNodeEntries,
  conditionals,
  formulas,
  own,
  ownBuff,
  teamData,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff } from './data/util'

const charKey: CharacterKey = 'Velina'

const velinaCounts: TagMapNodeEntries = [
  ownBuff.common.count.withSpecialty('anomaly').add(1),
]
const janeCounts: TagMapNodeEntries = [
  ownBuff.common.count.withSpecialty('anomaly').add(1),
]
const burniceCounts: TagMapNodeEntries = [
  ownBuff.common.count.withSpecialty('anomaly').add(1),
]

function memberEntries(
  key: CharacterKey,
  counts: TagMapNodeEntries,
  mindscape: number
): TagMapNodeEntries {
  return withMember(
    key,
    ...charTagMapNodeEntries({
      level: 60,
      promotion: 5,
      key,
      mindscape: key === charKey ? mindscape : 0,
      basic: 11,
      dodge: 11,
      special: 11,
      chain: 11,
      assist: 11,
      core: 6,
    }),
    ...counts
  )
}

// Ability check is anomaly count + wind count >= 3. Velina herself counts as
// anomaly (injected) but her wind count is NOT injected, so solo gives 1
// (OFF) and the full team gives 3 (ON) without attribute-count plumbing.
const OFF_CONDS = {
  windbiteVortex: 0,
  sweepingCycloneHit: 0,
  windAnomalyEnemy: 0,
  exSpecialAtk: 0,
  vortexAllResIgn: 0,
  windsweptWindResIgn: 0,
  windsweptRemaining: 0,
}

function setupCalc(opts: {
  teammates?: boolean
  mindscape?: number
  conds?: Record<string, number>
}): Calculator {
  const teammates = opts.teammates
    ? (['Jane', 'Burnice'] as const)
    : ([] as const)
  const members: readonly CharacterKey[] = [charKey, ...teammates]
  const extraData: TagMapNodeEntries = [
    ...teamData(members),
    ...memberEntries(charKey, velinaCounts, opts.mindscape ?? 0),
    ...(opts.teammates
      ? [
          ...memberEntries('Jane', janeCounts, 0),
          ...memberEntries('Burnice', burniceCounts, 0),
        ]
      : []),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
    ...Object.entries({ ...OFF_CONDS, ...opts.conds }).map(([name, val]) =>
      conditionalEntries('Velina', charKey, null)(name, val)
    ),
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, extraData))
}

function readVelinaFormula(calc: Calculator, name: string): number {
  const tag = (formulas.Velina as any)[name]?.tag
  if (!tag) throw new Error(`No Velina formula for ${name}`)
  return calc.withTag({ src: charKey, dst: charKey }).compute(read(tag))
    .val as number
}

function readAggVortex(calc: Calculator, attr: string): number {
  const tag = (formulas.agg as any)[`vortexDmgInst_${attr}`]?.tag
  if (!tag) throw new Error(`No vortex formula for ${attr}`)
  return calc.withTag({ src: charKey, dst: charKey }).compute(read(tag))
    .val as number
}

describe('velina kit', () => {
  it('exposes the refactored conditionals and buffs', () => {
    const cond = (conditionals as any).Velina
    expect(cond.windbiteVortex.type).toEqual('bool')
    expect(cond.sweepingCycloneHit.type).toEqual('bool')
    expect(cond.exSpecialAtk.mindscapeRequirement).toEqual(4)
    expect(cond.vortexAllResIgn.mindscapeRequirement).toEqual(1)
    expect(cond.windsweptWindResIgn.mindscapeRequirement).toEqual(1)
    expect(cond.windAnomalyEnemy.mindscapeRequirement).toEqual(6)
    expect(cond.windsweptRemaining.type).toEqual('num')
    expect(cond.windsweptRemaining.min).toEqual(0)
    expect(cond.windsweptRemaining.max).toEqual(16)
    expect(cond.windsweptRemaining.mindscapeRequirement).toEqual(6)

    const buff = (buffs as any).Velina
    expect(buff.core_sweeping_anomBuildupRes_.team).toEqual(true)
    expect(buff.m1_wind_resIgn_.team).toEqual(true)
    expect(buff.ability_wind_dmg_.team).toEqual(false)
    expect(buff.m6_windswept_dmg_.team).toEqual(false)

    for (const name of [
      'SweepingCyclone_0_daze',
      'SweepingCyclone_0_anomBuildup',
      'core_condensed_abloom_dmg',
      'core_sweeping_abloom_dmg',
      'ability_ult_abloom_dmg',
    ])
      expect((formulas.Velina as any)[name]?.tag).toBeDefined()
  })

  it('merges ability and M1 daze into Sweeping Cyclone only (no global leak)', () => {
    const solo = setupCalc({})
    const team = setupCalc({ teammates: true })
    const teamM1 = setupCalc({ teammates: true, mindscape: 1 })
    const d0 = readVelinaFormula(solo, 'SweepingCyclone_0_daze')
    expect(d0).toBeGreaterThan(0)
    // +30% ability
    expect(readVelinaFormula(team, 'SweepingCyclone_0_daze') / d0).toBeCloseTo(
      1.3,
      4
    )
    // +30% ability +20% M1. Would be 1.6 if the old global buff double-applied.
    expect(
      readVelinaFormula(teamM1, 'SweepingCyclone_0_daze') / d0
    ).toBeCloseTo(1.5, 4)
    // Other EX Special hits are unaffected (extras-only, includeOriginalEntry false)
    const e0 = readVelinaFormula(
      solo,
      'EXSpecialAttackWindShearPurifyingRise_0_daze'
    )
    const e1 = readVelinaFormula(
      teamM1,
      'EXSpecialAttackWindShearPurifyingRise_0_daze'
    )
    expect(e1 / e0).toBeCloseTo(1, 8)
  })

  it('applies ability buildup to Sweeping Cyclone buildup', () => {
    const solo = setupCalc({})
    const team = setupCalc({ teammates: true })
    const b0 = readVelinaFormula(solo, 'SweepingCyclone_0_anomBuildup')
    expect(b0).toBeGreaterThan(0)
    expect(
      readVelinaFormula(team, 'SweepingCyclone_0_anomBuildup') / b0
    ).toBeCloseTo(1.15, 4)
  })

  it('reduces Anomaly Buildup RES on Sweeping Cyclone hit', () => {
    // Solo: core half only (-7%)
    const soloOff = setupCalc({})
    const soloOn = setupCalc({ conds: { sweepingCycloneHit: 1 } })
    const s0 = readVelinaFormula(soloOff, 'SweepingCyclone_0_anomBuildup')
    expect(
      readVelinaFormula(soloOn, 'SweepingCyclone_0_anomBuildup') / s0
    ).toBeCloseTo(1.07, 4)
    // Team: core + ability halves (-7% + -7%)
    const teamOff = setupCalc({ teammates: true })
    const teamOn = setupCalc({
      teammates: true,
      conds: { sweepingCycloneHit: 1 },
    })
    const t0 = readVelinaFormula(teamOff, 'SweepingCyclone_0_anomBuildup')
    expect(
      readVelinaFormula(teamOn, 'SweepingCyclone_0_anomBuildup') / t0
    ).toBeCloseTo(1.14, 4)
  })

  it('empowers Vortex DMG with consumed Windbite', () => {
    const off = setupCalc({ teammates: true })
    const on = setupCalc({ teammates: true, conds: { windbiteVortex: 1 } })
    const v0 = readAggVortex(off, 'fire')
    const v1 = readAggVortex(on, 'fire')
    // Core 6 Windbite ratio is +150%; ability adds +10% on both sides:
    // (1 + 0.1 + 1.5) / (1 + 0.1)
    expect(v1 / v0).toBeCloseTo(2.6 / 1.1, 4)
  })

  it('adds M6 Wind Anomaly Buildup against Wind-Anomaly enemies', () => {
    const off = setupCalc({ teammates: true, mindscape: 6 })
    const on = setupCalc({
      teammates: true,
      mindscape: 6,
      conds: { windAnomalyEnemy: 1 },
    })
    const b0 = readVelinaFormula(off, 'SweepingCyclone_0_anomBuildup')
    // (1 + 0.15 + 0.2) / (1 + 0.15)
    expect(
      readVelinaFormula(on, 'SweepingCyclone_0_anomBuildup') / b0
    ).toBeCloseTo(1.35 / 1.15, 4)
  })

  it('resolves Abloom instances at fixed ratios of Wind Anomaly DMG', () => {
    const solo = setupCalc({})
    const anomaly = readVelinaFormula(solo, 'anomalyDmgInst')
    expect(anomaly).toBeGreaterThan(0)
    // Core 6: condensed 145%, sweeping 255%
    expect(
      readVelinaFormula(solo, 'core_condensed_abloom_dmg') / anomaly
    ).toBeCloseTo(1.45, 4)
    expect(
      readVelinaFormula(solo, 'core_sweeping_abloom_dmg') / anomaly
    ).toBeCloseTo(2.55, 4)
    // Ult Abloom needs the ability trigger: 0 solo, 680% with team.
    // Compared against the Sweeping Abloom (same abloom-tagged pipeline)
    // rather than the anomaly instance, whose windswept damageType2 also
    // picks up the Windswept DMG bonus — pre-existing tag behavior.
    expect(readVelinaFormula(solo, 'ability_ult_abloom_dmg')).toBeCloseTo(0, 8)
    const team = setupCalc({ teammates: true })
    expect(
      readVelinaFormula(team, 'ability_ult_abloom_dmg') /
        readVelinaFormula(team, 'core_sweeping_abloom_dmg')
    ).toBeCloseTo(6.8 / 2.55, 4)
  })
})
