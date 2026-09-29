import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats, mappedStats } from '@zenless-optimizer/zzz/stats'
import {
  buffs,
  charTagMapNodeEntries,
  formulas,
  own,
  ownBuff,
  teamData,
  teammateStatBridges,
  withMember,
} from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff } from './data/util'

const charKey: CharacterKey = 'Sunna'
const dm = mappedStats.char[charKey]

function memberEntries(
  t: CharacterKey,
  extra: TagMapNodeEntries = []
): TagMapNodeEntries {
  return withMember(
    t,
    ...charTagMapNodeEntries({
      key: t,
      level: 60,
      promotion: 5,
      basic: 11,
      dodge: 11,
      special: 11,
      chain: 11,
      assist: 11,
      core: 6,
      mindscape: 0,
    }),
    ownBuff.common.count
      .withSpecialty(allStats.char[t].specialty as 'attack')
      .add(1),
    ownBuff.common.count
      .withFaction(allStats.char[t].faction as 'AngelsOfDelusion')
      .add(1),
    ...extra
  )
}

function setupSunnaCalc(
  opts: {
    teammates?: CharacterKey[]
    bridgeKeys?: (CharacterKey | undefined)[]
    extra?: TagMapNodeEntries
    mindscape?: number
  } = {}
): Calculator {
  const { teammates = [], extra = [], mindscape = 0 } = opts
  const members = [charKey, ...teammates]
  const bridgeKeys = opts.bridgeKeys ?? members

  const data: TagMapNodeEntries = [
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
      ownBuff.common.count.withSpecialty('support').add(1),
      ownBuff.common.count.withFaction('AngelsOfDelusion').add(1)
    ),
    // Teammates get flat ATK + crit so bridged trigger stats are nonzero.
    ...teammates.flatMap((t) =>
      memberEntries(t, [
        ownBuff.combat.atk.add(1000),
        ownBuff.combat.crit_.add(0.5),
        ownBuff.combat.crit_dmg_.add(1.0),
      ])
    ),
    ...teammateStatBridges(charKey, bridgeKeys),
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
    ...extra,
  ]

  return new Calculator(keys, values, compileTagMapValues(keys, data)).withTag({
    src: charKey,
    dst: charKey,
    preset: 'preset0',
  })
}

function computeFormula(calc: Calculator, name: string): number {
  const tag = (formulas as any)[charKey][name]?.tag
  if (!tag) throw new Error(`No ${name} formula for ${charKey}`)
  return calc.compute(read(tag)).val as number
}

function computeBuff(calc: Calculator, name: string): number {
  const tag = (buffs as any)[charKey][name]?.tag
  if (!tag) throw new Error(`No ${name} buff for ${charKey}`)
  return calc.compute(read(tag)).val as number
}

const slot = (n: number) =>
  conditionalEntries('Sunna', charKey, null)('teammateSlot', n)
const fcOn = () =>
  conditionalEntries('Sunna', charKey, null)('focusedCreation', 1)
const fcDmgOn = () =>
  conditionalEntries('Sunna', charKey, null)('focusedCreationDmg', 1)
const stunOn = () =>
  conditionalEntries('Sunna', charKey, null)('abilityStun', 1)

describe("Sunna Cat's Gaze teammate trigger", () => {
  it('reads zero with no teammate selected', () => {
    const calc = setupSunnaCalc({ teammates: ['Ellen'] })
    expect(computeFormula(calc, 'catsgaze_dmg_ice')).toBe(0)
  })

  it('computes Attack-trigger damage from slot 1 (Ellen)', () => {
    const calc = setupSunnaCalc({
      teammates: ['Ellen'],
      extra: [slot(1)],
    })
    expect(computeFormula(calc, 'catsgaze_dmg_ice')).toBeGreaterThan(0)
  })

  it('computes Anomaly-trigger damage from slot 2 (Jane)', () => {
    const calc = setupSunnaCalc({
      teammates: ['Ellen', 'Jane'],
      extra: [slot(2)],
    })
    expect(computeFormula(calc, 'catsgaze_dmg_physical')).toBeGreaterThan(0)
  })

  it('routes damage to the trigger attribute instance only (Ellen is Ice)', () => {
    const setup = { teammates: ['Ellen'], extra: [slot(1)] }
    expect(
      computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_ice')
    ).toBeGreaterThan(0)
    expect(computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_fire')).toBe(0)
    expect(computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_physical')).toBe(
      0
    )
  })

  it('routes damage to the trigger attribute instance only (Jane is Physical)', () => {
    const setup = { teammates: ['Ellen', 'Jane'], extra: [slot(2)] }
    expect(
      computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_physical')
    ).toBeGreaterThan(0)
    expect(computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_ice')).toBe(0)
    expect(computeFormula(setupSunnaCalc(setup), 'catsgaze_dmg_ether')).toBe(0)
  })

  it('M2 increases the trigger damage', () => {
    const base = computeFormula(
      setupSunnaCalc({ teammates: ['Ellen'], extra: [slot(1)] }),
      'catsgaze_dmg_ice'
    )
    const m2 = computeFormula(
      setupSunnaCalc({
        teammates: ['Ellen'],
        mindscape: 2,
        extra: [slot(1)],
      }),
      'catsgaze_dmg_ice'
    )
    expect(m2).toBeGreaterThan(base)
  })

  it('M6 trigger-DMG bonus applies to every trigger', () => {
    const trigger = (extra: TagMapNodeEntries) =>
      computeFormula(
        setupSunnaCalc({
          teammates: ['Ellen'],
          mindscape: 6,
          extra,
        }),
        'catsgaze_dmg_ice'
      )
    // Focused Creation alone (crit for Sunna's own hits) leaves teammate
    // triggers untouched ...
    expect(trigger([slot(1), fcOn()])).toBe(trigger([slot(1)]))
    // ... while the trigger-DMG bonus scales them exactly.
    expect(trigger([slot(1), fcDmgOn()])).toBeCloseTo(
      trigger([slot(1)]) * (1 + dm.m6.catsGazeDmg_),
      6
    )
    // The conditional readout shows the bonus itself.
    expect(
      computeBuff(
        setupSunnaCalc({ mindscape: 6, extra: [fcDmgOn()] }),
        'm6_catsgaze_dmg_'
      )
    ).toBeCloseTo(dm.m6.catsGazeDmg_, 6)
  })

  it("ignores Sunna's own crit, dmg%, and flat bonuses", () => {
    const plain = computeFormula(
      setupSunnaCalc({ teammates: ['Ellen'], extra: [slot(1)] }),
      'catsgaze_dmg_ice'
    )
    const buffed = computeFormula(
      setupSunnaCalc({
        teammates: ['Ellen'],
        extra: [
          slot(1),
          ...withMember(
            charKey,
            ownBuff.combat.crit_.add(1),
            ownBuff.combat.crit_dmg_.add(5),
            ownBuff.combat.dmg_.physical.add(5),
            ownBuff.combat.common_dmg_.add(5),
            ownBuff.combat.directDmg_.add(5),
            ownBuff.combat.flat_dmg.add(500)
          ),
        ],
      }),
      'catsgaze_dmg_ice'
    )
    expect(buffed).toBe(plain)
  })

  it("applies enemy RES of the triggerer's attribute (Jane is Physical)", () => {
    // Setup already has 0.1 RES + 0.15 RES-red per attribute (factor 1.05).
    const base = computeFormula(
      setupSunnaCalc({ teammates: ['Jane'], extra: [slot(1)] }),
      'catsgaze_dmg_physical'
    )
    expect(base).toBeGreaterThan(0)
    const resisted = computeFormula(
      setupSunnaCalc({
        teammates: ['Jane'],
        extra: [slot(1), enemy.common.res_.physical.add(0.4)],
      }),
      'catsgaze_dmg_physical'
    )
    // Physical RES 0.1 -> 0.5: factor (1 - 0.5 + 0.15) / (1 - 0.1 + 0.15).
    expect(resisted).toBeCloseTo(base * (0.65 / 1.05), 6)
  })

  it('ignores RES of other attributes (Ellen is Ice)', () => {
    const base = computeFormula(
      setupSunnaCalc({ teammates: ['Ellen'], extra: [slot(1)] }),
      'catsgaze_dmg_ice'
    )
    const same = computeFormula(
      setupSunnaCalc({
        teammates: ['Ellen'],
        extra: [slot(1), enemy.common.res_.physical.add(0.4)],
      }),
      'catsgaze_dmg_ice'
    )
    expect(same).toBe(base)
  })
})

describe('Sunna M6 self trigger', () => {
  it('is zero below M6 or without Focused Creation', () => {
    expect(
      computeFormula(setupSunnaCalc({ mindscape: 5 }), 'm6_catsgaze_dmg')
    ).toBe(0)
    expect(
      computeFormula(setupSunnaCalc({ mindscape: 6 }), 'm6_catsgaze_dmg')
    ).toBe(0)
  })

  it('computes self-trigger damage at M6 with Focused Creation', () => {
    const calc = setupSunnaCalc({ mindscape: 6, extra: [fcOn()] })
    expect(computeFormula(calc, 'm6_catsgaze_dmg')).toBeGreaterThan(0)
  })

  it('trigger-DMG bonus scales the self trigger too', () => {
    const self = (extra: TagMapNodeEntries) =>
      computeFormula(setupSunnaCalc({ mindscape: 6, extra }), 'm6_catsgaze_dmg')
    expect(self([fcOn(), fcDmgOn()])).toBeCloseTo(
      self([fcOn()]) * (1 + dm.m6.catsGazeDmg_),
      6
    )
  })
})

describe('Sunna ability and core buffs', () => {
  it('Additional Ability stun needs the toggle and the team requirement', () => {
    const stun = (
      teammates: Array<'Ellen' | 'Jane'>,
      extra: TagMapNodeEntries
    ) => computeBuff(setupSunnaCalc({ teammates, extra }), 'ability_stun_')
    // Toggle on but no Attack teammate / shared faction (Jane) → 0.
    expect(stun(['Jane'], [stunOn()])).toBe(0)
    // Requirement met (Ellen) but toggle off → 0.
    expect(stun(['Ellen'], [])).toBe(0)
    // Both → +30% Stun DMG Multiplier.
    expect(stun(['Ellen'], [stunOn()])).toBeCloseTo(dm.ability.stunDmg_, 6)
  })

  it('M1 DEF reduction scales with stacks', () => {
    const stacks = (n: number) =>
      computeBuff(
        setupSunnaCalc({
          mindscape: 1,
          extra: [
            conditionalEntries(
              'Sunna',
              charKey,
              null
            )('m1DefReductionStacks', n),
          ],
        }),
        'm1_defRed_'
      )
    expect(stacks(0)).toBe(0)
    expect(stacks(2)).toBeCloseTo(2 * dm.m1.defReduction, 6)
    expect(stacks(3)).toBeCloseTo(3 * dm.m1.defReduction, 6)
  })

  it('core ATK applies while Angelic Chord-ination is active', () => {
    const off = computeBuff(setupSunnaCalc(), 'core_atk')
    expect(off).toBe(0)
    const on = computeBuff(
      setupSunnaCalc({
        extra: [
          conditionalEntries('Sunna', charKey, null)('angelic_chordination', 1),
        ],
      }),
      'core_atk'
    )
    expect(on).toBeGreaterThan(0)
  })
})
