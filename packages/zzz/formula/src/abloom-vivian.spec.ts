import { expect, test } from 'bun:test'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import {
  charTagMapNodeEntries,
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

const charKey: CharacterKey = 'Vivian'

function setup(
  opts: {
    mindscape?: number
    guardFeathers?: number
    extra?: TagMapNodeEntries
  } = {}
): Calculator {
  const { mindscape = 0, guardFeathers, extra = [] } = opts
  const extraData: TagMapNodeEntries = [
    ...teamData([charKey]),
    ...withMember(
      charKey,
      ...charTagMapNodeEntries({
        level: 60,
        promotion: 5,
        key: charKey,
        mindscape,
        basic: 11,
        dodge: 11,
        special: 11,
        chain: 11,
        assist: 11,
        core: 6,
      }),
      ownBuff.initial.atk.add(25),
      ownBuff.combat.atk.add(100),
      ownBuff.initial.atk_.add(0.08),
      ownBuff.initial.anomProf.add(338)
    ),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemy.common.lvl.add(100),
    enemy.common.res_.electric.add(0.1),
    enemy.common.res_.fire.add(0.1),
    enemy.common.res_.ice.add(0.1),
    enemy.common.res_.physical.add(0.1),
    enemy.common.res_.ether.add(0.1),
    enemy.common.res_.wind.add(0.1),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
    ...(guardFeathers !== undefined
      ? [
          conditionalEntries(
            'Vivian',
            charKey,
            null
          )('m6_guard_feathers', guardFeathers),
        ]
      : []),
    ...extra,
  ]
  return new Calculator(
    keys,
    values,
    compileTagMapValues(keys, extraData)
  ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })
}

const abloomName = (attr: string) => `abloomDmgInst_${attr}`

function computeAbloom(calc: Calculator, attr: string): number {
  const tag = (formulas.Vivian as any)[abloomName(attr)]?.tag
  if (!tag) throw new Error(`No abloom formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

function computeAnomaly(calc: Calculator, attr: string): number {
  const tag = (formulas.Vivian as any)[
    attr === 'ether' ? 'anomalyDmgInst' : `anomalyDmgInst_${attr}`
  ]?.tag
  if (!tag) throw new Error(`No anomaly formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

/** Value of a registered core buff (e.g. the core Abloom ratio) from the listing. */
function coreBuffValue(calc: Calculator, name: string): number {
  const entry = calc
    .listFormulas(own.listing.buffs)
    .find((b: any) => b.tag?.name === name)
  if (!entry) throw new Error(`No buff ${name}`)
  return calc.compute(entry).val as number
}

function computeEtherAnomBuildup(calc: Calculator): number {
  return calc.compute(
    read({
      et: 'own',
      qt: 'final',
      q: 'anomBuildup_',
      sheet: 'agg',
      attribute: 'ether',
    })
  ).val as number
}

test('abloom formulas listed for all attributes', () => {
  const calc = setup()
  const listed = calc.listFormulas(own.listing.formulas)
  const abloomNames = listed
    .map(({ tag }) => tag.name)
    .filter((n) => n?.startsWith('abloomDmgInst'))
  expect(abloomNames.sort()).toEqual(
    [
      'abloomDmgInst_electric',
      'abloomDmgInst_fire',
      'abloomDmgInst_ice',
      'abloomDmgInst_physical',
      'abloomDmgInst_ether',
      'abloomDmgInst_wind',
    ].sort()
  )
})

test('per-attribute abloom values scale with core (AP * core %)', () => {
  const calc = setup()
  const electric = computeAbloom(calc, 'electric')
  const ether = computeAbloom(calc, 'ether')
  const wind = computeAbloom(calc, 'wind')
  expect(ether > 0).toBe(true)
  expect(electric > 0).toBe(true)
  expect(wind > 0).toBe(true)
  // electric base = 1.25 * atk, ether base = 0.625 * atk
  expect(electric).toBeGreaterThan(ether)
})

test('Abloom instance is the core ratio times the original anomaly DMG', () => {
  // The core ratio is a multiplier on the original anomaly's DMG, not a bonus
  // added to the generic anomaly MV multiplier (which would be 1 + ratio).
  const calc = setup()
  const ratio = coreBuffValue(calc, 'core_ether_anom_mv_mult_')
  expect(ratio).toBeGreaterThan(0)
  expect(
    computeAbloom(calc, 'ether') / computeAnomaly(calc, 'ether')
  ).toBeCloseTo(ratio, 4)
})

test('M2 raises the Abloom ratio by 1.3 for all attributes', () => {
  const m0 = setup({ mindscape: 0 })
  const m2 = setup({ mindscape: 2 })
  for (const attr of ['electric', 'fire', 'ice', 'physical', 'wind', 'ether']) {
    const name = `core_${attr}_anom_mv_mult_`
    expect(coreBuffValue(m2, name) / coreBuffValue(m0, name)).toBeCloseTo(
      1.3,
      4
    )
    expect(computeAbloom(m2, attr)).toBeGreaterThan(computeAbloom(m0, attr))
  }
})

test('M2 raises Ether Anomaly Buildup Rate by 25%', () => {
  const m0 = computeEtherAnomBuildup(setup())
  const m2 = computeEtherAnomBuildup(setup({ mindscape: 2 }))
  expect(m0).toBeCloseTo(0, 6)
  expect(m2 - m0).toBeCloseTo(0.25, 6)
})

test('M2 RES ignore is general (no damage-type qualifier)', () => {
  const resIgn = (mindscape: number) =>
    setup({ mindscape }).compute(
      read({ et: 'own', qt: 'final', q: 'resIgn_', sheet: 'agg' })
    ).val as number
  expect(resIgn(2) - resIgn(0)).toBeCloseTo(0.15, 6)
})

test('M6 Abloom DMG scales with Guard Feathers consumed', () => {
  const abloomBonus = (guardFeathers: number) =>
    setup({ mindscape: 6, guardFeathers }).compute(
      read({
        et: 'own',
        qt: 'final',
        q: 'common_dmg_',
        sheet: 'agg',
        damageType2: 'abloom',
      })
    ).val as number
  const at = (guardFeathers: number) =>
    computeAbloom(setup({ mindscape: 6, guardFeathers }), 'ether')

  // 0 feathers = buff disabled; n feathers adds n × 100% Anomaly DMG.
  expect(abloomBonus(0)).toBeCloseTo(0, 6)
  expect(abloomBonus(1)).toBeCloseTo(1, 6)
  expect(abloomBonus(2)).toBeCloseTo(2, 6)
  expect(abloomBonus(5)).toBeCloseTo(5, 6)
  // More feathers always means more Abloom DMG.
  expect(at(1)).toBeGreaterThan(at(0))
  expect(at(2)).toBeGreaterThan(at(1))
  expect(at(5)).toBeGreaterThan(at(2))
  // Buff is gated behind M6.
  const m5 = setup({ mindscape: 5, guardFeathers: 5 })
  expect(
    m5.compute(
      read({
        et: 'own',
        qt: 'final',
        q: 'common_dmg_',
        sheet: 'agg',
        damageType2: 'abloom',
      })
    ).val
  ).toBeCloseTo(0, 6)
})
