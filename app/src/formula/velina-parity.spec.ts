import { truncateToFixed } from '@zenless-optimizer/common/util'
import { compileTagMapValues, read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey } from '../consts'
import {
  Calculator,
  charTagMapNodeEntries,
  discsToTagMapNodeEntries,
  own,
  ownBuff,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '.'
import { keys, values } from './data'

const charKey: CharacterKey = 'Velina'

const disc = (
  setKey: string,
  slotKey: string,
  mainStatKey: string,
  substats: { key: string; upgrades: number }[]
) => ({
  setKey,
  rarity: 'S',
  level: 15,
  slotKey,
  mainStatKey,
  substats,
})

// Regression build reported against the live game panel:
// HP 11025 / ATK 2542 (level 60, promotion 5, core 6, TheVault R5).
// Slots 1-5 are known; slot 6 is reconstructed to satisfy both observations.
const discs = [
  disc('WutheringSalon', '1', 'hp', [
    { key: 'crit_dmg_', upgrades: 2 },
    { key: 'anomProf', upgrades: 3 },
    { key: 'atk_', upgrades: 3 },
    { key: 'hp_', upgrades: 1 },
  ]),
  disc('WutheringSalon', '2', 'atk', [
    { key: 'anomProf', upgrades: 1 },
    { key: 'def', upgrades: 2 },
    { key: 'def_', upgrades: 2 },
    { key: 'atk_', upgrades: 3 },
  ]),
  disc('WutheringSalon', '3', 'def', [
    { key: 'atk_', upgrades: 1 },
    { key: 'anomProf', upgrades: 4 },
    { key: 'crit_dmg_', upgrades: 3 },
    { key: 'hp', upgrades: 1 },
  ]),
  disc('SwingJazz', '4', 'anomProf', [
    { key: 'crit_dmg_', upgrades: 1 },
    { key: 'hp_', upgrades: 2 },
    { key: 'atk', upgrades: 2 },
    { key: 'atk_', upgrades: 3 },
  ]),
  disc('WutheringSalon', '5', 'pen_', [
    { key: 'atk_', upgrades: 3 },
    { key: 'def_', upgrades: 3 },
    { key: 'anomProf', upgrades: 1 },
    { key: 'atk', upgrades: 1 },
  ]),
  // Slot 6 (from in-game inspection): SwingJazz ER main, no hp/atk panel
  // contributions except hp flat x2 and atk_% x2 substat rolls
  disc('SwingJazz', '6', 'enerRegen_', [
    { key: 'hp', upgrades: 2 },
    { key: 'atk_', upgrades: 2 },
    { key: 'anomProf', upgrades: 2 },
    { key: 'pen', upgrades: 1 },
  ]),
] as any[]

function setup(): Calculator {
  const data = [
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
      }),
      ...wengineTagMapNodeEntries({
        key: 'TheVault',
        level: 60,
        modification: 5,
        phase: 5,
      }),
      ...discsToTagMapNodeEntries(discs)
    ),
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, data)).withTag({
    src: charKey,
    dst: charKey,
  })
}

function setupRemielleHp(): Calculator {
  const data = [
    ...teamData(['Remielle']),
    ...withMember(
      'Remielle',
      ...charTagMapNodeEntries({
        key: 'Remielle',
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
      ownBuff.initial.hp.add(2424),
      ownBuff.initial.hp_.add(0.03),
      ownBuff.initial.def.add(214),
      ownBuff.initial.def_.add(0.096)
    ),
  ]
  return new Calculator(keys, values, compileTagMapValues(keys, data)).withTag({
    src: 'Remielle',
    dst: 'Remielle',
  })
}

describe('velina game parity', () => {
  it('floors ATK/DEF base per source, keeps HP base fractional', () => {
    const calc = setup()
    // wengine ATK floors separately: floor(872.574) + floor(624.54)
    expect(calc.compute(read(own.base.atk.tag)).val).toBeCloseTo(1496)
    // HP base stays fractional: 626 + 2149 + 59 * 84.9779
    expect(calc.compute(read(own.base.hp.tag)).val).toBeCloseTo(7788.6961, 4)
    // DEF base floors: 49 + 169 + 59 * 6.6882 = 612.6038 -> 612
    expect(calc.compute(read(own.base.def.tag)).val).toBeCloseTo(612)
    // initial.hp = 7788.6961 * 1.09 + 2536 = 11025.6787 -> game shows 11025
    const hp = calc.compute(read(own.final.hp.tag)).val as number
    expect(hp).toBeCloseTo(11025.6787, 3)
    expect(truncateToFixed(hp, 0)).toEqual('11025')
    // initial.atk = 1496 * 1.45 + 373 = 2542.2 -> game shows 2542
    const atk = calc.compute(read(own.final.atk.tag)).val as number
    expect(atk).toBeCloseTo(2542.2, 6)
    expect(truncateToFixed(atk, 0)).toEqual('2542')
    // initial.def = 612 * 1.24 + 214 = 972.88 -> game shows 972
    // (unfloored would give 973.63 -> 973)
    const def = calc.compute(read(own.final.def.tag)).val as number
    expect(def).toBeCloseTo(972.88, 6)
    expect(truncateToFixed(def, 0)).toEqual('972')
  })

  it('matches the game for the Remielle panel (10131 / 3998 / 871)', () => {
    // Game panel: HP 7482 +2649 = 10131 (F=2424, p=3%),
    // DEF 600 +271 = 871 (F=214, p=9.6%)
    // 7482.7069 * 1.03 + 2424 = 10131.1881 -> truncated display 10131
    // 600 * 1.096 + 214 = 871.6 -> truncated display 871
    const calc = setupRemielleHp()
    const hp = calc.compute(read(own.final.hp.tag)).val as number
    expect(hp).toBeCloseTo(10131.1881, 3)
    expect(truncateToFixed(hp, 0)).toEqual('10131')
    const def = calc.compute(read(own.final.def.tag)).val as number
    expect(def).toBeCloseTo(871.6, 6)
    expect(truncateToFixed(def, 0)).toEqual('871')
  })
})
