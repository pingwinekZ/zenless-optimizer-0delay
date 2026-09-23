import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import { Calculator } from './calculator'
import { keys, values } from './data'
import { enemy, enemyDebuff } from './data/util'
import {
  charTagMapNodeEntries,
  formulas,
  own,
  ownBuff,
  teamData,
  teammateStatBridges,
  withMember,
} from './index'

const charKey: any = 'Remielle'

function setup(mindscape: number) {
  const members = [charKey]
  const data = [
    ...teamData(members),
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
      ownBuff.combat.atk_.add(0.08),
      ownBuff.initial.crit_.add(0.7),
      ownBuff.initial.crit_dmg_.add(1.04),
      ownBuff.initial.anomProf.add(338),
      ownBuff.initial.anomMas.add(40)
    ),
    ...teammateStatBridges(charKey, members),
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
  return new Calculator(keys, values, compileTagMapValues(keys, data)).withTag({
    src: charKey,
    dst: charKey,
    preset: 'preset0',
  })
}

const base = setup(0)
const m1 = setup(1)
const name = 'luminizeRainbowsEndDmgInst'
const lum = (calc: any) =>
  calc.compute(read((formulas as any)[charKey][name].tag)).val as number
const resMult = (calc: any) =>
  calc.compute(read(ownBuff.dmg.res_mult_.tag)).val as number
console.log('base:', lum(base), 'm1:', lum(m1), 'ratio:', lum(m1) / lum(base))
console.log('res_mult base:', resMult(base), 'res_mult m1:', resMult(m1))
