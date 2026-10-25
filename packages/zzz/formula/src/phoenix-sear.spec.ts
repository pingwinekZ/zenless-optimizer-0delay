import { expect, test } from 'bun:test'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats } from '@zenless-optimizer/zzz/stats'
import { charTagMapNodeEntries, formulas, own, teamData, withMember } from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff, ownBuff } from './data/util'

const charKey: CharacterKey = 'Phoenix'

// Production count entries (CharCalcProvider.memberAndEquipmentEntries):
// team.common.count is populated per member, specialty + faction each +1.
function memberEntries(
  key: CharacterKey,
  { mindscape = 0, core = 6 }: { mindscape?: number; core?: number } = {}
): TagMapNodeEntries {
  return withMember(
    key,
    ...charTagMapNodeEntries({
      key,
      level: 60,
      promotion: 5,
      basic: 11,
      dodge: 11,
      special: 11,
      chain: 11,
      assist: 11,
      core,
      mindscape,
    }),
    ownBuff.common.count.withSpecialty(allStats.char[key].specialty).add(1),
    ownBuff.common.count.withFaction(allStats.char[key].faction).add(1)
  )
}

function setup(
  opts: {
    mindscape?: number
    core?: number
    /** Extra squad member for the additional-ability squad check */
    teammate?: CharacterKey
    /** Flat initial Anomaly Mastery bonus (threshold-scaling tests) */
    extraAnomMas?: number
    sear?: boolean
  } = {}
): Calculator {
  const {
    mindscape = 0,
    core = 6,
    teammate,
    extraAnomMas = 0,
    sear = true,
  } = opts
  const members: CharacterKey[] = teammate ? [charKey, teammate] : [charKey]
  const extraData: TagMapNodeEntries = [
    ...teamData(members),
    ...members.flatMap((m) =>
      memberEntries(m, m === charKey ? { mindscape, core } : {})
    ),
    own.common.critMode.add('avg'),
    enemy.common.def.add(635),
    enemy.common.lvl.add(100),
    enemyDebuff.common.stun_.add(1.5),
    enemyDebuff.common.unstun_.add(1),
    conditionalEntries(charKey, charKey, null)('sear', sear ? 1 : 0),
    conditionalEntries(charKey, charKey, null)('sear_ability', sear ? 1 : 0),
    conditionalEntries(charKey, charKey, null)('sear_m2', sear ? 1 : 0),
    ...(extraAnomMas ? [ownBuff.initial.anomMas.add(extraAnomMas)] : []),
  ]
  return new Calculator(
    keys,
    values,
    compileTagMapValues(keys, extraData)
  ).withTag({ src: charKey, dst: charKey, preset: 'preset0' })
}

function readFinal(calc: Calculator, q: string): number {
  return calc.compute(read({ et: 'own', qt: 'final', q, sheet: 'agg' }))
    .val as number
}

function formulaValue(calc: Calculator, name: string): number {
  const tag = (formulas.Phoenix as any)[name]?.tag
  if (!tag) throw new Error(`No formula ${name}`)
  return calc.compute(read(tag)).val as number
}

/** Compute a registered buff entry by name (Aria spec pattern). */
function buffValue(calc: Calculator, name: string): number {
  const entry = calc
    .listFormulas(own.listing.buffs)
    .find((b: any) => b.tag?.name === name)
  if (!entry) throw new Error(`No buff ${name}`)
  return calc.compute(entry).val as number
}

test('Sear anomaly crit rate: base 30% + 0.7%/AM over 155, capped at 255', () => {
  // Phoenix: 116 base + 36 core (6) = 152 initial AM — under the 155 threshold
  const base = setup()
  expect(readFinal(base, 'anom_crit_')).toBeCloseTo(0.3, 6)
  // 252 AM: (252 - 155) * 0.7% = 0.679
  const over = setup({ extraAnomMas: 100 })
  expect(readFinal(over, 'anom_crit_')).toBeCloseTo(0.3 + 97 * 0.007, 4)
  // 652 AM: capped at 255 -> (255 - 155) * 0.7% = 0.7
  const capped = setup({ extraAnomMas: 500 })
  expect(readFinal(capped, 'anom_crit_')).toBeCloseTo(0.3 + 0.7, 4)
  // No Sear state -> no anomaly crit
  const unseared = setup({ sear: false })
  expect(readFinal(unseared, 'anom_crit_')).toBeCloseTo(0, 6)
})

test('Sear crit DMG combines core (12.5->25%), M1 and the additional ability', () => {
  // Core 6 -> 25%; solo squad (no qualifying teammate) -> ability inactive
  const m0 = setup()
  expect(readFinal(m0, 'anom_crit_dmg_')).toBeCloseTo(0.25, 6)
  // M1 adds a flat 25%
  const m1 = setup({ mindscape: 1 })
  expect(readFinal(m1, 'anom_crit_dmg_')).toBeCloseTo(0.5, 6)
  // Anomaly teammate activates Krampus Ace: +15%
  const able = setup({ teammate: 'Burnice' })
  expect(readFinal(able, 'anom_crit_dmg_')).toBeCloseTo(0.4, 6)
  // ...but only while the enemy is Sear'd
  const unseared = setup({ teammate: 'Burnice', sear: false })
  expect(readFinal(unseared, 'anom_crit_dmg_')).toBeCloseTo(0, 6)
})

test('Additional ability needs another qualifying squad member', () => {
  // Phoenix alone contributes 2 (1 anomaly + 1 faction) -> below the >= 3 gate
  const solo = setup()
  expect(buffValue(solo, 'ability_sear_crit_dmg_')).toBeCloseTo(0, 6)
  // A second Anomaly character pushes the sum to 3
  const teamed = setup({ teammate: 'Burnice' })
  expect(buffValue(teamed, 'ability_sear_crit_dmg_')).toBeCloseTo(0.15, 6)
})

test('Sear DoT scales with the core-scaled ATK percentage', () => {
  // Core 6 (50% of ATK) vs core 0 (25% of ATK). Core level also changes
  // base ATK, so compare against atk x MV rather than a plain 2x ratio.
  const core6 = setup({ core: 6 })
  const core0 = setup({ core: 0 })
  const readAtk = (calc: Calculator) =>
    calc.compute(read({ et: 'own', qt: 'final', q: 'atk', sheet: 'agg' }))
      .val as number
  const v6 = formulaValue(core6, 'core_sear_dmg')
  const v0 = formulaValue(core0, 'core_sear_dmg')
  expect(v6).toBeGreaterThan(0)
  expect(v6 / v0).toBeCloseTo(
    (readAtk(core6) * 0.5) / (readAtk(core0) * 0.25),
    4
  )
  // Passive core effect: the DoT is unconditional (no Sear toggle)
  const unseared = setup({ sear: false })
  expect(formulaValue(unseared, 'core_sear_dmg')).toBeCloseTo(v6, 6)
})

test('Abloom instances are fractions of the original anomaly DMG', () => {
  // Sear off: the Sear anomaly-crit stats would skew the avg-crit multiplier
  // differently for abloom-tagged instances (they also get +40% CRIT DMG).
  const calc = setup({ sear: false })
  // Purifying Flame: {CAL:225+20*(basic-1)}% -> 425% at basic 11
  const purifyingFlame = formulaValue(calc, 'purifyingFlameAbloomDmgInst_fire')
  expect(purifyingFlame / formulaValue(calc, 'anomalyDmgInst')).toBeCloseTo(
    4.25,
    4
  )
  // Soul-Searching Blaze: {CAL:300+27*(chain-1)}% -> 570% at chain 11
  const blaze = formulaValue(calc, 'soulSearchingBlazeAbloomDmgInst_fire')
  expect(blaze / formulaValue(calc, 'anomalyDmgInst')).toBeCloseTo(5.7, 4)
  // M4: one additional instance at a fixed 600% multiplier
  const m0 = formulaValue(
    setup({ mindscape: 0, sear: false }),
    'm4_abloomDmgInst_fire'
  )
  expect(m0).toBeCloseTo(0, 6)
  const m4 = formulaValue(
    setup({ mindscape: 4, sear: false }),
    'm4_abloomDmgInst_fire'
  )
  expect(
    m4 / formulaValue(setup({ mindscape: 4, sear: false }), 'anomalyDmgInst')
  ).toBeCloseTo(6, 4)
})

test('Abloom formulas exist for all six attributes', () => {
  const calc = setup()
  const listed = calc.listFormulas(own.listing.formulas)
  const names = listed.map(({ tag }: any) => tag.name)
  for (const attr of ['fire', 'electric', 'ether', 'ice', 'physical', 'wind']) {
    expect(names).toContain(`purifyingFlameAbloomDmgInst_${attr}`)
    expect(names).toContain(`soulSearchingBlazeAbloomDmgInst_${attr}`)
    expect(names).toContain(`m4_abloomDmgInst_${attr}`)
  }
})

test('Abloom crits gain +40% CRIT DMG', () => {
  const calc = setup()
  expect(buffValue(calc, 'core_abloom_crit_dmg_')).toBeCloseTo(0.4, 6)
})

test('M2 boosts Phoenix DMG against Sear state enemies by 30%', () => {
  expect(buffValue(setup({ mindscape: 2 }), 'm2_sear_dmg_')).toBeCloseTo(0.3, 6)
  expect(buffValue(setup({ mindscape: 1 }), 'm2_sear_dmg_')).toBeCloseTo(0, 6)
  expect(
    buffValue(setup({ mindscape: 2, sear: false }), 'm2_sear_dmg_')
  ).toBeCloseTo(0, 6)
})

test('M6 ignores 15% All-RES and 40% of enemy DEF for Abloom', () => {
  const m0 = setup({ mindscape: 0 })
  expect(buffValue(m0, 'm6_all_resIgn_')).toBeCloseTo(0, 6)
  expect(buffValue(m0, 'm6_abloom_defIgn_')).toBeCloseTo(0, 6)
  const m6 = setup({ mindscape: 6 })
  expect(buffValue(m6, 'm6_all_resIgn_')).toBeCloseTo(0.15, 6)
  expect(buffValue(m6, 'm6_abloom_defIgn_')).toBeCloseTo(0.4, 6)
})

test('Core grants the core-scaled Anomaly Proficiency bonus', () => {
  // Core 6 -> +85 AP on top of 116 base + discs (none here)
  const calc = setup({ core: 6 })
  expect(buffValue(calc, 'core_anomProf')).toBeCloseTo(85, 6)
  const core1 = setup({ core: 0 })
  expect(buffValue(core1, 'core_anomProf')).toBeCloseTo(43, 6)
})
