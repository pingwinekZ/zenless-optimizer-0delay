import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import {
  Calculator,
  charTagMapNodeEntries,
  own,
  teamData,
  withMember,
} from '@zenless-optimizer/zzz/formula'
import { keys, values } from '@zenless-optimizer/zzz/formula/data'
import { formulaText } from './formulaText'

describe('formulaText', () => {
  it('renders custom ops (floor) without throwing', () => {
    const charKey: CharacterKey = 'Anby'
    const data = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          basic: 0,
          dodge: 0,
          special: 0,
          chain: 0,
          assist: 0,
          core: 6,
          mindscape: 0,
        })
      ),
    ]
    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, data)
    ).withTag({ src: charKey, dst: charKey })

    const result = calc.compute(read(own.initial.atk.tag))
    // The initial-atk aggregation contains the `floor` custom op
    const text = formulaText(result)
    const serialized = JSON.stringify(text.formula)
    expect(serialized).toContain('Floor')
    expect(text.prec).toBeGreaterThan(0)
  })
})
