import { compileTagMapValues } from '@zenless-optimizer/pando/engine'
import { charTagMapNodeEntries, teamData, withMember, withPreset } from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import { convert, ownBuff, ownTag, teamBuff } from './data/util'

/**
 * Phase 0 baseline for buff/target attribution (see doc/architecture.md).
 *
 * These tests pin the CURRENT aggregation behavior that Phase 1 must preserve
 * while adding per-source provenance:
 * - own buffs add to the owner's final stats,
 * - teammate `teamBuff`s fan out to every member (including the source),
 * - `preset`-scoped entries only match reads with the same preset (the
 *   combo/rotation primitive the analysis panel relies on).
 *
 * Phase 1 may add `Calculator.contributions()` and per-source breakdowns, but
 * the sums asserted here must not change.
 */
const anbyInput = {
  key: 'Anby',
  level: 60,
  promotion: 5,
  basic: 0,
  dodge: 0,
  special: 0,
  assist: 0,
  chain: 0,
  core: 6,
  mindscape: 0,
} as const
const lucyInput = {
  key: 'Lucy',
  level: 60,
  promotion: 5,
  basic: 0,
  dodge: 0,
  special: 0,
  assist: 0,
  chain: 0,
  core: 6,
  mindscape: 0,
} as const

function buildCalc(extra: Parameters<typeof compileTagMapValues>[1]) {
  const data = [
    ...teamData(['Anby', 'Lucy']),
    ...withMember('Anby', ...charTagMapNodeEntries(anbyInput)),
    ...withMember('Lucy', ...charTagMapNodeEntries(lucyInput)),
    ...extra,
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, data))
}

describe('attribution baseline', () => {
  it('own buff adds to own final stat (single-target)', () => {
    const anbyReader = convert(ownTag, { et: 'own', src: 'Anby' })
    const baseline = buildCalc([]).compute(anbyReader.final.atk).val
    expect(baseline).toBeCloseTo(658)

    const buffed = buildCalc([
      ...withMember('Anby', ownBuff.combat.atk.add(100)),
    ]).compute(anbyReader.final.atk).val
    expect(buffed).toBeCloseTo(758)
    expect(buffed - baseline).toBeCloseTo(100)
  })

  it('teammate teamBuff fans out to the whole team', () => {
    const anbyReader = convert(ownTag, { et: 'own', src: 'Anby' })
    const lucyReader = convert(ownTag, { et: 'own', src: 'Lucy' })
    const baseline = buildCalc([]).compute(anbyReader.final.atk).val

    const calc = buildCalc([
      ...withMember('Lucy', teamBuff.combat.atk.add(200)),
    ])
    const anbyAtk = calc.compute(anbyReader.final.atk).val
    const lucyAtk = calc.compute(lucyReader.final.atk).val
    // Team-wide today: the same buff lands on main char AND source.
    // Phase 1 must keep these sums while attributing 200 to Lucy.
    expect(anbyAtk - baseline).toBeCloseTo(200)
    // Team-wide today: source sees the same buff as teammates.
    expect(lucyAtk).toBeCloseTo(anbyAtk)
  })

  it('preset-scoped buffs only match same-preset reads (combo)', () => {
    const calc = buildCalc([
      ...withPreset(
        'preset0',
        ...withMember('Anby', ownBuff.combat.atk.add(50))
      ),
    ])
    const readP0 = convert(ownTag, {
      et: 'own',
      src: 'Anby',
      preset: 'preset0',
    })
    const readP1 = convert(ownTag, {
      et: 'own',
      src: 'Anby',
      preset: 'preset1',
    })
    expect(calc.compute(readP0.final.atk).val).toBeCloseTo(708)
    expect(calc.compute(readP1.final.atk).val).toBeCloseTo(658)
  })
})
