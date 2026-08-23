import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
import {
  Calculator,
  charTagMapNodeEntries,
  discTagMapNodeEntries,
  own,
  ownBuff,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '.'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'

const charKey: CharacterKey = 'Remielle'

// Remielle lvl 60, promo 5, core 6:
//   atk = 124 + 222 + 59 * 6.8214 + core 75 = 823.4626
//   hp = 602 + 2064 + 59 * 81.6391 = 7482.7069
//   def = 48 + 166 + 59 * 6.5524 = 600.5916
function setupCalc(extra: TagMapNodeEntries = []): Calculator {
  const data: TagMapNodeEntries = [
    ...teamData([charKey]),
    ...withMember(
      charKey,
      ...charTagMapNodeEntries({
        key: charKey,
        level: 60,
        promotion: 5,
        basic: 11,
        dodge: 11,
        special: 11,
        chain: 11,
        assist: 11,
        core: 6,
        mindscape: 0,
        potential: 0,
      })
    ),
    ...extra,
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, data)).withTag({
    src: charKey,
    dst: charKey,
  })
}

function computeStat(calc: Calculator, stat: 'atk' | 'hp' | 'def'): number {
  return calc.compute(read(own.initial[stat].tag)).val as number
}

describe('initial stat flooring (game parity)', () => {
  it('truncates fractional character base stats to integers', () => {
    const calc = setupCalc()
    expect(computeStat(calc, 'atk')).toBe(823)
    expect(computeStat(calc, 'hp')).toBe(7482)
    expect(computeStat(calc, 'def')).toBe(600)
  })

  it('applies % bonuses to the floored base stat', () => {
    // base.atk floors to 823; 823 * (1 + 0.5) + 25 = 1259.5
    const calc = setupCalc([
      ownBuff.initial.atk_.add(0.5),
      ownBuff.initial.atk.add(25),
    ])
    expect(computeStat(calc, 'atk')).toBeCloseTo(1259.5, 6)
  })

  it('matches the game for the Remielle regression build (3998 vs 4000)', () => {
    // base.atk = 823.4626 + wengine 50*(1+9.409+0.8922*5)=743.5 -> 1566.9626
    // initial.atk_ = 87% discs + 36% wengine secondary = 123%
    // initial.atk = floor(1566.9626) * 2.23 + 506 flat = 3998.18
    // (unfloored float math would give 4000.33)
    const calc = setupCalc([
      ...wengineTagMapNodeEntries({
        key: 'OdeOfResurrectedWings',
        level: 60,
        modification: 5,
        phase: 1,
      }),
      ...discTagMapNodeEntries(
        {
          atk: 316 + 19 * 10,
          atk_: 0.6 + 0.09 * 3,
          hp: 2200 + 112 * 2,
          def: 184 + 15 * 2,
          anomProf: 92 + 9 * 12,
          pen: 9 * 12,
          crit_: 0.024,
          crit_dmg_: 0.048 * 2,
          def_: 0.048 * 2,
          hp_: 0.03,
        },
        { FeatheredFate: 4, FreedomBlues: 2 }
      ),
    ])
    expect(computeStat(calc, 'atk')).toBeCloseTo(3998.18, 6)
  })
})
