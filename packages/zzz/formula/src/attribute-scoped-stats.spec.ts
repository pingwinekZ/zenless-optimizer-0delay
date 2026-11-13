import { compileTagMapValues, constant } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { charTagMapNodeEntries, teamData, withMember } from '.'
import { Calculator } from './calculator'
import { data, keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { convert, ownBuff, ownTag } from './data/util'

/**
 * Bonus stats can carry an `attribute` (e.g. "Wind and Ice CRIT DMG +80%").
 * Damage formulas are computed inside an Attribute-tagged instance, so such a
 * stat only joins gathers whose tag carries the same Attribute. These tests pin
 * that behavior down for a stat that is not `dmg_`.
 */
// Without another spec in the same process, the compiled sheet data has to be
// merged in by hand (same as `formula.test.ts`).
Object.assign(values, compileTagMapValues(keys, data))

const anby = convert(ownTag, { et: 'own', src: 'Anby' })

function finalCritDmg(entries: TagMapNodeEntries) {
  const calc = new Calculator(
    keys,
    values,
    compileTagMapValues(keys, [
      ...teamData(['Anby']),
      ...withMember(
        'Anby',
        ...charTagMapNodeEntries({
          level: 60,
          promotion: 5,
          key: 'Anby' as CharacterKey,
          mindscape: 0,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          core: 6,
        })
      ),
      ...entries,
    ])
  )
  return {
    unscoped: calc.compute(anby.final.crit_dmg_).val,
    fire: calc.compute(anby.final.crit_dmg_.fire).val,
    ice: calc.compute(anby.final.crit_dmg_.ice).val,
  }
}

describe('attribute-scoped bonus stats', () => {
  it('only applies CRIT DMG to the matching Attribute', () => {
    const { unscoped, fire, ice } = finalCritDmg([
      ownBuff.combat.crit_dmg_.fire.add(0.8),
    ])
    expect(unscoped).toBeCloseTo(0.5)
    expect(fire).toBeCloseTo(1.3)
    expect(ice).toBeCloseTo(0.5)
  })

  it('keeps the Attribute through the custom-sheet path used by the solver', () => {
    const { fire, ice } = finalCritDmg([
      {
        tag: {
          q: 'crit_dmg_',
          qt: 'combat',
          attribute: 'fire',
          sheet: 'custom',
          et: 'own',
          src: 'Anby',
        },
        value: constant(0.8),
      } as any,
    ])
    expect(fire).toBeCloseTo(1.3)
    expect(ice).toBeCloseTo(0.5)
  })

  it('still applies unqualified CRIT DMG to every Attribute', () => {
    const { unscoped, fire, ice } = finalCritDmg([
      ownBuff.combat.crit_dmg_.add(0.8),
    ])
    expect(unscoped).toBeCloseTo(1.3)
    expect(fire).toBeCloseTo(1.3)
    expect(ice).toBeCloseTo(1.3)
  })
})
