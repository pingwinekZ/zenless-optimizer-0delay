import { expect, test } from 'bun:test'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { allStats } from '@zenless-optimizer/zzz/stats'
import { charTagMapNodeEntries, formulas, own, teamData, withMember } from '.'
import { Calculator } from './calculator'
import { keys, values } from './data'
import type { TagMapNodeEntries } from './data/util'
import { conditionalEntries, enemy, enemyDebuff, ownBuff } from './data/util'

const charKey: CharacterKey = 'Severian'

// Any other Wind member triggers the core's additional DMG line.
const windTeammate = Object.keys(allStats.char).find(
  (k) => k !== charKey && allStats.char[k as CharacterKey].attribute === 'wind'
) as CharacterKey

// A Support / Stun or C.I.S.R.T. member activates Optimal Setup.
const ableTeammate = Object.keys(allStats.char).find(
  (k) =>
    k !== charKey &&
    (['support', 'stun'].includes(allStats.char[k as CharacterKey].specialty) ||
      allStats.char[k as CharacterKey].faction ===
        'CriminalInvestigationSpecialResponseTeam')
) as CharacterKey

// Production count entries (CharCalcProvider.memberAndEquipmentEntries):
// team.common.count is populated per member — specialty, faction and
// attribute each +1.
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
    ownBuff.common.count.withFaction(allStats.char[key].faction).add(1),
    ownBuff.common.count
      .withTag({ attribute: allStats.char[key].attribute })
      .add(1)
  )
}

function setup(
  opts: {
    mindscape?: number
    core?: number
    /** Extra squad member for the core / ability squad checks */
    teammate?: CharacterKey
    /** M2 / M4 trigger toggles */
    m2?: boolean
    m4?: boolean
    /** Flat CRIT Rate bonus (ability cap tests) */
    extraCrit?: number
  } = {}
): Calculator {
  const {
    mindscape = 0,
    core = 6,
    teammate,
    m2 = false,
    m4 = false,
    extraCrit = 0,
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
    conditionalEntries(charKey, charKey, null)('m2_pen', m2 ? 1 : 0),
    conditionalEntries(charKey, charKey, null)('m4_atk', m4 ? 1 : 0),
    ...(extraCrit ? [ownBuff.combat.crit_.add(extraCrit)] : []),
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
  const tag = (formulas.Severian as any)[name]?.tag
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

test('Core: CRIT DMG and DMG scale with the core level', () => {
  // Core 6 -> +60% CRIT DMG, +25% DMG; core 0 -> +30% / +12.5%
  const core6 = setup({ core: 6 })
  expect(buffValue(core6, 'core_crit_dmg_')).toBeCloseTo(0.6, 6)
  expect(buffValue(core6, 'core_dmg_')).toBeCloseTo(0.25, 6)
  const core0 = setup({ core: 0 })
  expect(buffValue(core0, 'core_crit_dmg_')).toBeCloseTo(0.3, 6)
  expect(buffValue(core0, 'core_dmg_')).toBeCloseTo(0.125, 6)
})

test('Core: the additional DMG line needs another Wind squad member', () => {
  // Solo Severian is the only Wind member -> count.wind = 1 -> inactive
  const solo = setup()
  expect(buffValue(solo, 'core_wind_ally_dmg_')).toBeCloseTo(0, 6)
  // A second Wind character pushes count.wind to 2 -> core 6 gives +30%
  const teamed = setup({ teammate: windTeammate })
  expect(buffValue(teamed, 'core_wind_ally_dmg_')).toBeCloseTo(0.3, 6)
  expect(
    buffValue(setup({ teammate: windTeammate, core: 0 }), 'core_wind_ally_dmg_')
  ).toBeCloseTo(0.15, 6)
})

test('Additional ability needs another qualifying squad member', () => {
  // Solo: Severian contributes only his own faction (1) -> below the >= 2 gate
  const solo = setup()
  expect(buffValue(solo, 'ability_atk')).toBeCloseTo(0, 6)
  // A Support / Stun / C.I.S.R.T. teammate activates the conversion:
  // +8.5 ATK per 1% CRIT Rate (min(crit, 100%) * 850)
  const teamed = setup({ teammate: ableTeammate })
  const crit = readFinal(teamed, 'crit_')
  expect(crit).toBeGreaterThan(0)
  expect(buffValue(teamed, 'ability_atk')).toBeCloseTo(crit * 850, 6)
})

test('Additional ability caps at 100% CRIT Rate', () => {
  const teamed = setup({ teammate: ableTeammate, extraCrit: 1 })
  expect(buffValue(teamed, 'ability_atk')).toBeCloseTo(850, 6)
})

test("M1 ignores 15% of the target's Wind RES", () => {
  expect(buffValue(setup({ mindscape: 0 }), 'm1_wind_resIgn_')).toBeCloseTo(
    0,
    6
  )
  expect(buffValue(setup({ mindscape: 1 }), 'm1_wind_resIgn_')).toBeCloseTo(
    0.15,
    6
  )
})

test('M2 grants 20% PEN Ratio while active', () => {
  expect(buffValue(setup({ mindscape: 2 }), 'm2_pen_')).toBeCloseTo(0, 6)
  expect(buffValue(setup({ mindscape: 2, m2: true }), 'm2_pen_')).toBeCloseTo(
    0.2,
    6
  )
  expect(buffValue(setup({ mindscape: 1, m2: true }), 'm2_pen_')).toBeCloseTo(
    0,
    6
  )
})

test('M4 grants 10% ATK while active', () => {
  expect(buffValue(setup({ mindscape: 4 }), 'm4_atk_')).toBeCloseTo(0, 6)
  expect(buffValue(setup({ mindscape: 4, m4: true }), 'm4_atk_')).toBeCloseTo(
    0.1,
    6
  )
  expect(buffValue(setup({ mindscape: 3, m4: true }), 'm4_atk_')).toBeCloseTo(
    0,
    6
  )
})

test('M6 adds a fixed 350% multiplier instance to the Shadowhunt final hit', () => {
  const m0 = setup({ mindscape: 0 })
  expect(formulaValue(m0, 'm6_shadowhunt_final_dmg')).toBeCloseTo(0, 6)
  const m6 = setup({ mindscape: 6 })
  const m6v = formulaValue(m6, 'm6_shadowhunt_final_dmg')
  expect(m6v).toBeGreaterThan(0)
  // Display values run through the shared damage pipeline, so compare
  // against the Shadowhunt instance itself: same ATK read, same pipeline
  // — the ratio reduces to the multipliers. M3/M5 add +2 skill levels each
  // (11 -> 15), so the instance multiplier is 20.277 + 14 * 1.844.
  const instv = formulaValue(m6, 'BasicAttackAzureWindsShadowhunt_0_dmg')
  expect(m6v / instv).toBeCloseTo(3.5 / (20.277 + 14 * 1.844), 6)
  // The paired display buff reports the literal 350%
  expect(buffValue(m6, 'm6_shadowhunt_final_dmg')).toBeCloseTo(3.5, 6)
})
