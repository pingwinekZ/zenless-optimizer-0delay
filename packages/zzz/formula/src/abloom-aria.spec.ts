import { expect, test } from 'bun:test'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { charTagMapNodeEntries, formulas, own, teamData, withMember } from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff } from './data/util'

const charKey: CharacterKey = 'Aria'

function setup(
  opts: { mindscape?: number; extra?: TagMapNodeEntries } = {}
): Calculator {
  const { mindscape = 0, extra = [] } = opts
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
      })
    ),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemy.common.lvl.add(100),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
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
  const tag = (formulas.Aria as any)[abloomName(attr)]?.tag
  if (!tag) throw new Error(`No abloom formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

function computeAnomaly(calc: Calculator, attr: string): number {
  const tag = (formulas.Aria as any)[
    attr === 'ether' ? 'anomalyDmgInst' : `anomalyDmgInst_${attr}`
  ]?.tag
  if (!tag) throw new Error(`No anomaly formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

function coreBuffValue(calc: Calculator, name: string): number {
  const entry = calc
    .listFormulas(own.listing.buffs)
    .find((b: any) => b.tag?.name === name)
  if (!entry) throw new Error(`No buff ${name}`)
  return calc.compute(entry).val as number
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

test('Abloom instance is the core ratio times the original anomaly DMG', () => {
  const calc = setup()
  const ratio = coreBuffValue(calc, 'core_ether_anom_mv_mult_')
  expect(ratio).toBeGreaterThan(0)
  // core 6 ether ratio: 27.5% per 10 initial AM; AM = 115 base + 36 core = 151
  expect(ratio).toBeCloseTo(0.275 * 15.1, 4)
  expect(
    computeAbloom(calc, 'ether') / computeAnomaly(calc, 'ether')
  ).toBeCloseTo(ratio, 4)
})

test('Stunned target increases Abloom ratio by 50%', () => {
  const unstunned = setup()
  const stunned = setup({
    extra: [conditionalEntries('enemy', charKey, null)('isStunned', 1)],
  })
  const r0 = coreBuffValue(unstunned, 'core_ether_anom_mv_mult_')
  const r1 = coreBuffValue(stunned, 'core_ether_anom_mv_mult_')
  expect(r1 / r0).toBeCloseTo(1.5, 4)
  expect(computeAbloom(stunned, 'ether')).toBeGreaterThan(
    computeAbloom(unstunned, 'ether')
  )
})

test('M1 Abloom crit applies globally at M1', () => {
  const readFinal = (calc: Calculator, q: string) =>
    calc.compute(read({ et: 'own', qt: 'final', q, sheet: 'agg' }))
      .val as number
  const m0 = setup({ mindscape: 0 })
  expect(readFinal(m0, 'anom_crit_')).toBeCloseTo(0, 6)
  expect(readFinal(m0, 'anom_crit_dmg_')).toBeCloseTo(0, 6)
  const m1 = setup({ mindscape: 1 })
  // 25% base + (151 - 100) * 0.5% excess mastery
  expect(readFinal(m1, 'anom_crit_')).toBeCloseTo(0.25 + 51 * 0.005, 4)
  expect(readFinal(m1, 'anom_crit_dmg_')).toBeCloseTo(0.25, 6)
})
