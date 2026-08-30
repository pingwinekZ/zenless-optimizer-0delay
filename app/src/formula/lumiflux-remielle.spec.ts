import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
import { mappedStats } from '../stats'
import {
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
import { conditionalEntries, enemy, enemyDebuff, teamBuff } from './data/util'

const charKey: CharacterKey = 'Remielle'
const dm = mappedStats.char[charKey]

function teammateEntries(teammates: CharacterKey[]): TagMapNodeEntries {
  return teammates.flatMap((t) =>
    withMember(
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
      })
    )
  )
}

function setupRemielleCalc(
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
      ownBuff.initial.atk.add(25),
      ownBuff.combat.atk.add(100),
      ownBuff.combat.atk_.add(0.08),
      ownBuff.initial.crit_.add(0.7),
      ownBuff.initial.crit_dmg_.add(1.04),
      ownBuff.initial.anomProf.add(338),
      ownBuff.initial.anomMas.add(40)
    ),
    ...teammateEntries(teammates),
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

  const calc = new Calculator(
    keys,
    values,
    compileTagMapValues(keys, data)
  ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })
  return calc
}

function computeFormula(calc: Calculator, name: string): number {
  const tag = (formulas as any)[charKey][name]?.tag
  if (!tag) throw new Error(`No ${name} formula for ${charKey}`)
  return calc.compute(read(tag)).val as number
}

function computeMemberFormula(
  calc: Calculator,
  member: CharacterKey,
  name: string
): number {
  const tag = (formulas as any)[member]?.[name]?.tag
  if (!tag) throw new Error(`No ${name} formula for ${member}`)
  return calc
    .withTag({ src: member, dst: member, preset: 'preset0' })
    .compute(read(tag)).val as number
}

function computeStat(calc: Calculator, name: 'anomProf'): number {
  const tag = (own.final as any)[name].tag
  return calc.compute(read(tag)).val as number
}

describe('lumiflux (Remielle) anomaly gating', () => {
  it('does not register generic anomaly formulas for lumiflux characters', () => {
    const remielleFormulas = (formulas as any).Remielle
    // Dead generic anomaly pipeline instances must not exist
    expect(remielleFormulas.anomalyDmgInst).toBeUndefined()
    expect(remielleFormulas.disorderDmgInst_lumiflux).toBeUndefined()
    expect(remielleFormulas.luminizeDmgInst).toBeUndefined()
    expect(remielleFormulas.anomalyBuildupInst).toBeUndefined()
    // Real lumiflux instances still exist
    expect(remielleFormulas.standardDmgInst).toBeDefined()
    expect(remielleFormulas.luminizeRainbowsEndDmgInst).toBeDefined()
    expect(remielleFormulas.luminizeFleetingGraceDmgInst).toBeDefined()
    expect(remielleFormulas.luminizeUltimateDmgInst).toBeDefined()
    expect(remielleFormulas.luminizeFlowerFeatherDmgInst).toBeDefined()
  })

  it('non-lumiflux characters keep generic anomaly formulas', () => {
    const anbyFormulas = (formulas as any).Anby
    expect(anbyFormulas.anomalyDmgInst).toBeDefined()
    expect(anbyFormulas.anomalyBuildupInst).toBeDefined()
    expect(anbyFormulas.abloomDmgInst).toBeDefined()
  })

  it('computes per-skill Luminize damage and standard damage', () => {
    const calc = setupRemielleCalc()
    const luminize = computeFormula(calc, 'luminizeRainbowsEndDmgInst')
    const standard = computeFormula(calc, 'standardDmgInst')
    console.log('luminizeRainbowsEndDmgInst:', Math.round(luminize))
    console.log('standardDmgInst:', Math.round(standard))
    expect(luminize).toBeGreaterThan(0)
    expect(standard).toBeGreaterThan(0)
  })
})

describe('luminize inherited element (Voidflare fluxed attribute)', () => {
  const luminize = (calc: Calculator) =>
    computeFormula(calc, 'luminizeRainbowsEndDmgInst')

  it('inherits the first teammate attribute for enemy RES targeting', () => {
    // Solo (lumiflux context): the per-attribute enemy RES entries don't apply.
    const solo = luminize(setupRemielleCalc())
    // Lighter (fire): fire RES 0.1 + fire RES Down 0.15 now apply.
    const fire = luminize(setupRemielleCalc({ teammates: ['Lighter'] }))
    expect(fire).toBeGreaterThan(solo)
    // Jane (physical): physical RES entries apply instead.
    const physical = luminize(setupRemielleCalc({ teammates: ['Jane'] }))
    expect(physical).toBeGreaterThan(solo)
    // The per-attribute entries are uniform, so the result is attribute-agnostic.
    expect(fire).toBeCloseTo(physical, 6)
  })

  it('applies attribute-scoped RES / RES Down only for the inherited attribute', () => {
    const fireBase = luminize(setupRemielleCalc({ teammates: ['Lighter'] }))
    const extraFireResDown = luminize(
      setupRemielleCalc({
        teammates: ['Lighter'],
        extra: [enemyDebuff.common.resRed_.fire.add(0.15)],
      })
    )
    expect(extraFireResDown).toBeGreaterThan(fireBase)
    // Ice RES Down must not affect a fire-inherited Luminize.
    const iceResDown = luminize(
      setupRemielleCalc({
        teammates: ['Lighter'],
        extra: [enemyDebuff.common.resRed_.ice.add(0.15)],
      })
    )
    expect(iceResDown).toBe(fireBase)
    // Enemy Fire RES is targeted by a fire-inherited Luminize.
    const extraFireRes = luminize(
      setupRemielleCalc({
        teammates: ['Lighter'],
        extra: [enemy.common.res_.fire.add(0.1)],
      })
    )
    expect(extraFireRes).toBeLessThan(fireBase)
    // Fire RES Down must not affect a physical-inherited Luminize.
    const physicalBase = luminize(setupRemielleCalc({ teammates: ['Jane'] }))
    const fireResDown = luminize(
      setupRemielleCalc({
        teammates: ['Jane'],
        extra: [enemyDebuff.common.resRed_.fire.add(0.15)],
      })
    )
    expect(fireResDown).toBe(physicalBase)
  })

  it('slot 1 takes precedence; falls through to a non-lumiflux slot 2', () => {
    // Lighter (fire) in slot 1, Jane (physical) in slot 2 → fire wins.
    const base = luminize(setupRemielleCalc({ teammates: ['Lighter', 'Jane'] }))
    const physicalResDown = luminize(
      setupRemielleCalc({
        teammates: ['Lighter', 'Jane'],
        extra: [enemyDebuff.common.resRed_.physical.add(0.15)],
      })
    )
    expect(physicalResDown).toBe(base)
    const fireResDown = luminize(
      setupRemielleCalc({
        teammates: ['Lighter', 'Jane'],
        extra: [enemyDebuff.common.resRed_.fire.add(0.15)],
      })
    )
    expect(fireResDown).toBeGreaterThan(base)
    // Slot 1 = lumiflux (Remielle), slot 2 = Lighter (fire) → fire is used.
    const lumifluxSlot1 = luminize(
      setupRemielleCalc({
        teammates: ['Lighter'],
        bridgeKeys: ['Remielle', 'Remielle', 'Lighter'],
      })
    )
    const lumifluxSlot1FireDown = luminize(
      setupRemielleCalc({
        teammates: ['Lighter'],
        bridgeKeys: ['Remielle', 'Remielle', 'Lighter'],
        extra: [enemyDebuff.common.resRed_.fire.add(0.15)],
      })
    )
    expect(lumifluxSlot1FireDown).toBeGreaterThan(lumifluxSlot1)
  })

  it('does not benefit from attribute-scoped anomaly buffs (e.g. Assault CRIT DMG)', () => {
    // Jane is physical, so a leaked physical-scoped buff would be visible.
    const withCrit = (extra: TagMapNodeEntries) =>
      luminize(
        setupRemielleCalc({
          teammates: ['Jane'],
          extra: [ownBuff.combat.anom_crit_.add(0.5), ...extra],
        })
      )
    const base = withCrit([])
    // Jane-style Assault CRIT DMG is physical-scoped → must not apply.
    const assaultCrit = withCrit([
      teamBuff.combat.anom_crit_dmg_.physical.add(1.5),
    ])
    expect(assaultCrit).toBe(base)
    // Universal (untagged) Anomaly CRIT DMG does apply.
    const universalCrit = withCrit([ownBuff.combat.anom_crit_dmg_.add(1.5)])
    expect(universalCrit).toBeGreaterThan(base)
  })

  it('applies no inheritance without a non-lumiflux teammate', () => {
    const solo = luminize(setupRemielleCalc())
    const soloFireRes = luminize(
      setupRemielleCalc({ extra: [enemy.common.res_.fire.add(0.1)] })
    )
    expect(soloFireRes).toBe(solo)
  })
})

describe('Remielle mindscape buffs', () => {
  const luminize = (calc: Calculator, name = 'luminizeRainbowsEndDmgInst') =>
    computeFormula(calc, name)

  it('M1: Luminize ignores 50% All-Attribute RES', () => {
    // Solo (no inheritance): RES multiplier goes from 1.0 to 1.5.
    const base = luminize(setupRemielleCalc())
    const m1 = luminize(setupRemielleCalc({ mindscape: 1 }))
    expect(m1).toBeCloseTo(base * 1.5, 6)
    // With an inherited element (Lighter fire): (1 - 0.1 + 0.15 + 0.5) / (1 - 0.1 + 0.15)
    const fireBase = luminize(setupRemielleCalc({ teammates: ['Lighter'] }))
    const fireM1 = luminize(
      setupRemielleCalc({ teammates: ['Lighter'], mindscape: 1 })
    )
    expect(fireM1).toBeCloseTo((fireBase * 1.55) / 1.05, 6)
  })

  it('M1: Phase Flow gives other squad members +10% Anomaly DMG', () => {
    const jane = (mindscape: number, phaseFlowOn: boolean) =>
      computeMemberFormula(
        setupRemielleCalc({
          teammates: ['Jane'],
          mindscape,
          extra: phaseFlowOn
            ? [conditionalEntries('Remielle', charKey, null)('phaseFlow_m1', 1)]
            : [],
        }),
        'Jane',
        'anomalyDmgInst'
      )
    // Without Phase Flow, M1 does nothing for teammates.
    expect(jane(1, false)).toBe(jane(0, false))
    // With Phase Flow, Jane gets exactly +10% Anomaly DMG.
    expect(jane(1, true)).toBeCloseTo(jane(0, true) * 1.1, 6)
    // Remielle herself doesn't benefit from the +10% (notOwnBuff) — she only
    // gets the Phase Flow team DMG (special level 11 → 16.5%). The linked
    // `phaseFlow` conditional is toggled alongside `phaseFlow_m1` here since
    // the two are linked in the UI.
    const remielle = (phaseFlowOn: boolean) =>
      luminize(
        setupRemielleCalc({
          mindscape: 1,
          extra: phaseFlowOn
            ? [
                conditionalEntries('Remielle', charKey, null)('phaseFlow', 1),
                conditionalEntries(
                  'Remielle',
                  charKey,
                  null
                )('phaseFlow_m1', 1),
              ]
            : [],
        })
      )
    expect(remielle(true)).toBeCloseTo(remielle(false) * 1.165, 6)
  })

  it('M2: Refringe Coefficient +20% increases Luminize DMG', () => {
    const m1 = luminize(setupRemielleCalc({ mindscape: 1 }))
    const m2 = luminize(setupRemielleCalc({ mindscape: 2 }))
    const R =
      dm.core.refringeCoeff * computeStat(setupRemielleCalc(), 'anomProf')
    // Only the Refringe term differs between M1 and M2 (prismatic is off).
    expect(m2).toBeCloseTo((m1 * (1 + 1.2 * R)) / (1 + R), 6)
  })

  it('M2: Prismatic lets squad Anomaly DMG ignore 15% DEF', () => {
    const jane = (mindscape: number, prismaticOn: boolean) =>
      computeMemberFormula(
        setupRemielleCalc({
          teammates: ['Jane'],
          mindscape,
          extra: prismaticOn
            ? [conditionalEntries('Remielle', charKey, null)('prismatic', 1)]
            : [],
        }),
        'Jane',
        'anomalyDmgInst'
      )
    // No Prismatic → M2 does nothing.
    expect(jane(2, false)).toBe(jane(1, false))
    // No M2 → Prismatic does nothing.
    expect(jane(0, true)).toBe(jane(0, false))
    // DEF multiplier: levelFactor / (levelFactor + def × (1 - defIgn)).
    const defLvlFactor = 794 // defLevelFactor at character level 60
    expect(jane(2, true)).toBeCloseTo(
      (jane(2, false) * (defLvlFactor + 635)) / (defLvlFactor + 635 * 0.85),
      6
    )
  })

  it('M4: Luminize DMG multiplier +12%', () => {
    const m3 = luminize(setupRemielleCalc({ mindscape: 3 }))
    const m4 = luminize(setupRemielleCalc({ mindscape: 4 }))
    // Baseline anom_mv_mult_ = core Luminize AP% scaling (visual-only buff).
    const X =
      dm.core.luminizeApMultiplier[6] *
      computeStat(setupRemielleCalc(), 'anomProf') *
      0.01
    expect(m4).toBeCloseTo((m3 * (1 + X + 0.12)) / (1 + X), 6)
  })

  it('M6: Basic Attack Luminize triggers 2×, others unchanged', () => {
    const m5 = (name: string) =>
      luminize(setupRemielleCalc({ mindscape: 5 }), name)
    const m6 = (name: string) =>
      luminize(setupRemielleCalc({ mindscape: 6 }), name)
    expect(m6('luminizeRainbowsEndDmgInst')).toBeCloseTo(
      m5('luminizeRainbowsEndDmgInst') * 2,
      6
    )
    expect(m6('luminizeFleetingGraceDmgInst')).toBeCloseTo(
      m5('luminizeFleetingGraceDmgInst') * 2,
      6
    )
    expect(m6('luminizeUltimateDmgInst')).toBe(m5('luminizeUltimateDmgInst'))
    expect(m6('luminizeFlowerFeatherDmgInst')).toBe(
      m5('luminizeFlowerFeatherDmgInst')
    )
  })
})
