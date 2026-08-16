import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
import {
  charTagMapNodeEntries,
  formulas,
  own,
  ownBuff,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff } from './data/util'

// Test with Velina (wind) + Joyau Dore
const charKey: CharacterKey = 'Velina'

function setupVelinaCalc(): Calculator {
  const extraData: TagMapNodeEntries = [
    ...teamData([charKey]),
    ...withMember(
      charKey,
      ...charTagMapNodeEntries({
        level: 60,
        promotion: 5,
        key: charKey,
        mindscape: 0,
        potential: 0,
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
      }),
      ownBuff.initial.atk.add(25),
      ownBuff.combat.atk.add(100),
      ownBuff.combat.atk_.add(0.08),
      ownBuff.initial.crit_.add(0.7),
      ownBuff.initial.crit_dmg_.add(1.04),
      ownBuff.initial.anomProf.add(338),
      ownBuff.initial.anomMas.add(40)
    ),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemy.common.lvl.add(100),
    enemy.common.res_.fire.add(0.1),
    enemy.common.res_.electric.add(0.1),
    enemy.common.res_.physical.add(0.1),
    enemy.common.res_.ether.add(0.1),
    enemy.common.res_.ice.add(0.1),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
    enemy.common.dmgInc_.add(0.1),
    enemy.common.dmgRed_.add(0.15),
    enemyDebuff.common.resRed_.fire.add(0.15),
    enemyDebuff.common.resRed_.electric.add(0.15),
    enemyDebuff.common.resRed_.physical.add(0.15),
    enemyDebuff.common.resRed_.ether.add(0.15),
    enemyDebuff.common.resRed_.ice.add(0.15),
  ]

  const calc = new Calculator(
    keys,
    values,
    compileTagMapValues(keys, extraData)
  ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })
  return calc
}

function computeVortex(calc: Calculator, attr: string): number {
  const tag = (formulas.agg as any)[`vortexDmgInst_${attr}`]?.tag
  if (!tag) throw new Error(`No vortex formula for ${attr}`)
  return calc.compute(read(tag)).val as number
}

describe('vortex formula with Velina + Joyau Dore', () => {
  it('basic vortex damage for all attributes', () => {
    const calc = setupVelinaCalc(false)
    for (const attr of [
      'fire',
      'electric',
      'ether',
      'ice',
      'physical',
      'frost',
    ]) {
      const val = computeVortex(calc, attr)
      console.log(`vortexDmgInst_${attr}:`, Math.round(val))
      expect(val).toBeGreaterThan(0)
      expect(val).toBeLessThan(1e8)
    }
  })

  it('Joyau Dore vortexDmg_ buff increases fire vortex damage', () => {
    const calc0 = setupVelinaCalc(false)
    const calc2 = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, [
        ...teamData([charKey]),
        ...withMember(
          charKey,
          ...charTagMapNodeEntries({
            level: 60,
            promotion: 5,
            key: charKey,
            mindscape: 0,
            potential: 0,
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
          }),
          ownBuff.initial.atk.add(25),
          ownBuff.combat.atk.add(100),
          ownBuff.combat.atk_.add(0.08),
          ownBuff.initial.crit_.add(0.7),
          ownBuff.initial.crit_dmg_.add(1.04),
          ownBuff.initial.anomProf.add(338),
          ownBuff.initial.anomMas.add(40)
        ),
        own.common.critMode.add('avg'),
        enemy.common.def.add(635),
        enemy.common.lvl.add(100),
        enemy.common.res_.fire.add(0.1),
        enemyDebuff.common.stun_.add(1.5),
        enemyDebuff.common.unstun_.add(1),
        enemy.common.dmgInc_.add(0.1),
        enemy.common.dmgRed_.add(0.15),
        enemyDebuff.common.resRed_.fire.add(0.15),
        // Joyau Dore at 2 stacks
        conditionalEntries('JoyauDore', charKey, null)('wind_ex_stacks', 2),
      ])
    ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })

    const fire0 = computeVortex(calc0, 'fire')
    const fire2 = computeVortex(calc2, 'fire')
    console.log('Joyau Dore - fire vortex:')
    console.log('  0 stacks:', Math.round(fire0))
    console.log('  2 stacks:', Math.round(fire2))
    console.log(
      '  increase:',
      (((fire2 - fire0) / fire0) * 100).toFixed(2),
      '%'
    )
    expect(fire2).toBeGreaterThan(fire0)
  })

  it('fire and electric have ~same base (both 1900% at full duration)', () => {
    const calc = setupVelinaCalc(false)
    const fire = computeVortex(calc, 'fire')
    const electric = computeVortex(calc, 'electric')
    console.log(
      'fire:',
      Math.round(fire),
      '| electric:',
      Math.round(electric),
      '| ratio:',
      (fire / electric).toFixed(4)
    )
    expect(fire / electric).toBeCloseTo(1, 2)
  })

  it('ATK scaling is proportional', () => {
    const calcBase = setupVelinaCalc(false)
    const calcHighAtk = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, [
        ...teamData([charKey]),
        ...withMember(
          charKey,
          ...charTagMapNodeEntries({
            level: 60,
            promotion: 5,
            key: charKey,
            mindscape: 0,
            potential: 0,
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
          }),
          ownBuff.initial.atk.add(25),
          ownBuff.combat.atk.add(100),
          ownBuff.combat.atk_.add(0.08),
          ownBuff.initial.crit_.add(0.7),
          ownBuff.initial.crit_dmg_.add(1.04),
          ownBuff.initial.anomProf.add(338),
          ownBuff.initial.anomMas.add(40),
          ownBuff.combat.atk.add(500) // extra ATK
        ),
        own.common.critMode.add('avg'),
        enemy.common.def.add(635),
        enemy.common.lvl.add(100),
        enemy.common.res_.fire.add(0.1),
        enemyDebuff.common.stun_.add(1.5),
        enemyDebuff.common.unstun_.add(1),
        enemy.common.dmgInc_.add(0.1),
        enemy.common.dmgRed_.add(0.15),
        enemyDebuff.common.resRed_.fire.add(0.15),
      ])
    ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })

    const atkBase = calcBase.compute(own.final.atk).val as number
    const atkHigh = calcHighAtk.compute(own.final.atk).val as number
    const dmgBase = computeVortex(calcBase, 'fire')
    const dmgHigh = computeVortex(calcHighAtk, 'fire')

    const atkRatio = atkHigh / atkBase
    const dmgRatio = dmgHigh / dmgBase
    console.log(
      'ATK:',
      Math.round(atkBase),
      '→',
      Math.round(atkHigh),
      '| ratio:',
      atkRatio.toFixed(4)
    )
    console.log(
      'DMG:',
      Math.round(dmgBase),
      '→',
      Math.round(dmgHigh),
      '| ratio:',
      dmgRatio.toFixed(4)
    )
    expect(dmgRatio / atkRatio).toBeCloseTo(1, 2)
  })
})
