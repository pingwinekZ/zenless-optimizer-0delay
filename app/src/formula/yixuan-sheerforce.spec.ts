import {
  compileTagMapValues,
  setDebugMode,
} from '@zenless-optimizer/pando/engine'
import {
  charTagMapNodeEntries,
  discTagMapNodeEntries,
  teamData,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { data, keys, values } from './data'
import { convert, enemy, ownTag, type TagMapNodeEntries } from './data/util'

setDebugMode(true)
Object.assign(values, compileTagMapValues(keys, data))

describe('Yixuan sheerForce HP scaling', () => {
  it('HP% substat rolls produce more sheerForce than flat HP rolls', () => {
    // Build A: 20 flat HP rolls (2240) + 2 HP% rolls (6%)
    const buildAStats = {
      hp: 4440, // slot 1 (2200) + substat 20 rolls (2240)
      hp_: 0.36, // slot 6 (0.30) + substat 2 rolls (0.06)
    }
    // Build B: 2 flat HP rolls (224) + 20 HP% rolls (60%)
    const buildBStats = {
      hp: 2424, // slot 1 (2200) + substat 2 rolls (224)
      hp_: 0.9, // slot 6 (0.30) + substat 20 rolls (0.60)
    }

    const sharedData: TagMapNodeEntries = [
      ...teamData(['Yixuan']),
      ...withMember(
        'Yixuan',
        ...charTagMapNodeEntries({
          key: 'Yixuan',
          level: 60,
          promotion: 5,
          basic: 11,
          dodge: 11,
          special: 11,
          assist: 11,
          chain: 11,
          core: 6,
          mindscape: 0,
        })
      ),
      ...discTagMapNodeEntries({ atk: 316, def: 184 }, {}), // slot 2 + 3 main stats
      enemy.common.def.add(635),
      enemy.common.res_.ether.add(0.1),
    ]

    const dataA = [...sharedData, ...discTagMapNodeEntries(buildAStats, {})]
    const calcA = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, dataA)
    ).withTag({ src: 'Yixuan', dst: 'Yixuan' })

    const dataB = [...sharedData, ...discTagMapNodeEntries(buildBStats, {})]
    const calcB = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, dataB)
    ).withTag({ src: 'Yixuan', dst: 'Yixuan' })

    const char = convert(ownTag, { et: 'own', src: 'Yixuan' })

    const hpA = calcA.compute(char.final.hp).val
    const hpB = calcB.compute(char.final.hp).val
    const sheerForceA = calcA.compute(char.final.sheerForce).val
    const sheerForceB = calcB.compute(char.final.sheerForce).val

    console.log(
      'B|A:  hp=',
      (hpB / hpA - 1) * 100,
      '% more  sheerForce=',
      (sheerForceB / sheerForceA - 1) * 100,
      '% more'
    )

    expect(hpB).toBeGreaterThan(hpA)
    expect(sheerForceB).toBeGreaterThan(sheerForceA)
  })
})
