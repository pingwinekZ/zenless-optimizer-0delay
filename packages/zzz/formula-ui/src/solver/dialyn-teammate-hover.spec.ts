import { createTestDBStorage } from '@zenless-optimizer/common/database'
import { read } from '@zenless-optimizer/pando/engine'
import type { CharacterKey, DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type { ICachedCharacter, ICachedDisc } from '@zenless-optimizer/zzz/db'
import { ZzzDatabase } from '@zenless-optimizer/zzz/db/Database/Database'
import {
  buffs,
  formulas,
  zzzCalculatorWithEntries,
} from '@zenless-optimizer/zzz/formula'
import { buildCalculatorEntries } from '@zenless-optimizer/zzz/solver/buildStatsUtils'

const MAIN = 'Ellen' as CharacterKey
const DIALYN = 'Dialyn' as CharacterKey

function mockCharacter(key: CharacterKey): ICachedCharacter {
  return {
    key,
    level: 60,
    promotion: 6,
    basic: 10,
    dodge: 9,
    special: 10,
    chain: 10,
    assist: 10,
    core: 6,
    mindscape: 0,
    wengineKey: '',
    wenginePhase: 5,
    equippedDiscs: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  } as unknown as ICachedCharacter
}

/**
 * Totem for the Dialyn teammate-hover crash: Dialyn's `ability_dmg` nodes
 * read bridged `teammateN_*` stats, whose entries used to exist only for the
 * main character's `src`. Evaluating them under teammate-`src` hover context
 * (as Frame0HoverFields does) hit an empty unique-accumulator gather and
 * threw `TypeError: Cannot destructure property 'meta' ...` out of
 * `calculator.ts` `wrap`. `allMemberStatBridges` registers one bridge set
 * per team member, so these reads stay well-formed in every view.
 */
describe('dialyn teammate hover', () => {
  function build(conditionals: Array<Record<string, unknown>>) {
    const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
    database.teams.set(MAIN, {
      teammates: [
        { characterKey: MAIN },
        { characterKey: DIALYN },
        { characterKey: 'Zhao' as CharacterKey },
      ],
      frames: [
        {
          tag: {},
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals,
          enemyStats: [],
        },
      ],
      enemyLvl: 80,
      enemyDef: 953,
      enemyStunMultiplier: 150,
    } as never)
    const team = database.teams.get(MAIN)!
    const getChar = (key: CharacterKey) =>
      key === DIALYN || key === ('Zhao' as CharacterKey)
        ? mockCharacter(key)
        : undefined
    return zzzCalculatorWithEntries(
      buildCalculatorEntries(
        mockCharacter(MAIN),
        {} as Record<DiscSlotKey, ICachedDisc | undefined>,
        team,
        getChar,
        () => undefined
      )
    )
  }

  // Mirror Frame0HoverFields: TagContext src = Dialyn over the page outer tag
  const ctx = { src: DIALYN, dst: MAIN, preset: 'preset0' } as never

  it('computes Overwhelmingly Positive DMG with src=Dialyn', () => {
    const calc = build([
      {
        sheet: DIALYN,
        src: DIALYN,
        dst: null,
        condKey: 'overwhelmingly_positive_common',
        condValue: 1,
      },
    ])
    const tag = (buffs as any)[DIALYN]['ability_common_dmg_']?.tag
    expect(tag).toBeTruthy()
    expect(calc.withTag(ctx).compute(read(tag)).val).toBeCloseTo(0.4, 10)
  })

  it('resolves bridged-reader ability_dmg nodes with src=Dialyn', () => {
    const calc = build([
      {
        sheet: DIALYN,
        src: DIALYN,
        dst: null,
        condKey: 'teammateSlot',
        condValue: 1,
      },
    ])
    const buffTag = (buffs as any)[DIALYN]['ability_dmg']?.tag
    const formulaTag = (formulas as any)[DIALYN]['ability_dmg']?.tag
    expect(buffTag).toBeTruthy()
    expect(formulaTag).toBeTruthy()
    expect(() => calc.withTag(ctx).compute(read(buffTag))).not.toThrow()
    expect(() => calc.withTag(ctx).compute(read(formulaTag))).not.toThrow()
  })
})
