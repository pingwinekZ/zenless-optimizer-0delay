import { expect, test } from 'bun:test'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
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
import { enemy, enemyDebuff } from './data/util'

const charKey: CharacterKey = 'Vivian'

function setup(opts: { mindscape?: number } = {}): Calculator {
  const { mindscape = 0 } = opts
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
  ]
  return new Calculator(
    keys,
    values,
    compileTagMapValues(keys, extraData)
  ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })
}

const abloomName = (attr: string) =>
  attr === 'ether' ? 'abloomDmgInst' : `abloomDmgInst_${attr}`

function computeAbloom(calc: Calculator, attr: string): number {
  const tag = (formulas.Vivian as any)[abloomName(attr)]?.tag
  if (!tag) throw new Error(`No abloom formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

test('abloom formulas listed for all attributes', () => {
  const calc = setup()
  const listed = calc.listFormulas(own.listing.formulas)
  const abloomNames = listed
    .map(({ tag }) => tag.name)
    .filter((n) => n?.startsWith('abloomDmgInst'))
  expect(abloomNames.sort()).toEqual(
    [
      'abloomDmgInst',
      'abloomDmgInst_electric',
      'abloomDmgInst_fire',
      'abloomDmgInst_ice',
      'abloomDmgInst_physical',
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

test('M2 raises abloom MV mult by 1.3 for all attributes', () => {
  const m0 = setup({ mindscape: 0 })
  const m2 = setup({ mindscape: 2 })
  for (const attr of ['electric', 'fire', 'ice', 'physical', 'wind', 'ether']) {
    const readMv = (calc: Calculator) =>
      (calc.compute(
        read({
          et: 'own',
          qt: 'final',
          q: 'anom_mv_mult_',
          sheet: 'agg',
          attribute: attr,
          damageType1: 'anomaly',
          damageType2: 'abloom',
        })
      ).val ?? 0) as number
    const mv0 = readMv(m0)
    const mv2 = readMv(m2)
    expect(mv2 / mv0).toBeCloseTo(1.3, 4)
    const v0 = computeAbloom(m0, attr)
    const v2 = computeAbloom(m2, attr)
    expect(v2).toBeGreaterThan(v0)
  }
})
