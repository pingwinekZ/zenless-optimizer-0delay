import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
import {
  charTagMapNodeEntries,
  conditionals,
  formulas,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff, own } from './data/util'

const charKey: CharacterKey = 'Velina'

function setupCalc(isWindswept: boolean, infusion = 0): Calculator {
  const extraData: TagMapNodeEntries = [
    ...teamData([charKey]),
    ...withMember(
      charKey,
      ...charTagMapNodeEntries({
        level: 60,
        promotion: 5,
        key: charKey,
        mindscape: 0,
        basic: 11,
        dodge: 11,
        special: 11,
        chain: 11,
        assist: 11,
        core: 6,
      }),
      ...wengineTagMapNodeEntries({
        key: 'JoyauDore',
        level: 60,
        modification: 5,
        phase: 1,
      })
    ),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemy.common.res_.wind.add(0.1),
    conditionalEntries(
      'enemy',
      charKey,
      null
    )(conditionals.enemy.isWindswept.name, isWindswept ? 1 : 0),
    conditionalEntries(
      'enemy',
      charKey,
      null
    )(conditionals.enemy.windsweptInfusion.name, infusion),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, extraData))
}

function computeStandard(calc: Calculator): number {
  return calc
    .withTag({ src: charKey, dst: charKey })
    .compute(read(formulas.Velina.standardDmgInst.tag, undefined)).val
}

function computeAnomaly(calc: Calculator): number {
  return calc
    .withTag({ src: charKey, dst: charKey })
    .compute(read(formulas.Velina.anomalyDmgInst.tag, undefined)).val
}

describe('windswept enemy conditional', () => {
  it('exposes isWindswept + windsweptInfusion metadata', () => {
    expect(conditionals.enemy.isWindswept.type).toEqual('bool')
    expect(conditionals.enemy.windsweptInfusion.type).toEqual('list')
    expect(conditionals.enemy.windsweptInfusion.list).toEqual([
      'None',
      'fire',
      'electric',
      'ice',
      'physical',
      'ether',
    ])
  })

  it('grants 10% Direct DMG Bonus to wind direct hits only', () => {
    const off = setupCalc(false)
    const on = setupCalc(true)
    expect(computeStandard(on) / computeStandard(off)).toBeCloseTo(1.1, 5)
    // Anomaly DMG is not affected by Direct DMG Bonus
    expect(computeAnomaly(on) / computeAnomaly(off)).toBeCloseTo(1, 5)
  })

  it('infusion grants 10% Direct DMG Bonus to the infused attribute', () => {
    const calc = setupCalc(true, 1).withTag({
      src: charKey,
      dst: charKey,
    })
    expect(calc.compute(own.final.directDmg_.wind).val).toBeCloseTo(0.1)
    expect(calc.compute(own.final.directDmg_.fire).val).toBeCloseTo(0.1)
    expect(calc.compute(own.final.directDmg_.ice).val).toBeCloseTo(0)

    // No infusion selected -> no infused bonus
    const noInfusion = setupCalc(true, 0).withTag({
      src: charKey,
      dst: charKey,
    })
    expect(noInfusion.compute(own.final.directDmg_.fire).val).toBeCloseTo(0)
    expect(noInfusion.compute(own.final.directDmg_.wind).val).toBeCloseTo(0.1)

    // Infusion requires the windswept aura
    const notWindswept = setupCalc(false, 1).withTag({
      src: charKey,
      dst: charKey,
    })
    expect(notWindswept.compute(own.final.directDmg_.fire).val).toBeCloseTo(0)
  })
})
