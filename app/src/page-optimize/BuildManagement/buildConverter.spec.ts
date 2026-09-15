import { createTestDBStorage } from '@zenless-optimizer/common/database'
import type { CharacterKey, WengineKey } from '../../consts'
import { allCharacterKeys, allWengineKeys } from '../../consts'
import type { Team } from '../../db'
import { ZzzDatabase } from '../../db/Database/Database'
import { initialTeam } from '../../db/Database/DataManagers/TeamDataManager'
import { formulas } from '../../formula'
import { BuildSource } from '../../zood'
import {
  deserializeBuild,
  resolveFlexibleWengine,
  resolveMindscape,
  serializeFromCharacterTab,
  serializeFromOptimizer,
} from './buildConverter'

const charKey = allCharacterKeys[0] as CharacterKey
const wengineA = allWengineKeys[0] as WengineKey
const wengineB = allWengineKeys[1] as WengineKey

function firstFormula(): { sheet: string; name: string } {
  for (const [sheet, sheetFormulas] of Object.entries(
    formulas as Record<string, Record<string, unknown>>
  )) {
    const name = Object.keys(sheetFormulas ?? {})[0]
    if (name) return { sheet, name }
  }
  throw new Error('No formulas found')
}

function testDB() {
  return new ZzzDatabase(1, createTestDBStorage('zzz'))
}

describe('resolveFlexibleWengine', () => {
  it('takes max phase for the same W-Engine', () => {
    expect(resolveFlexibleWengine(wengineA, 2, wengineA, 4)).toEqual({
      wengineKey: wengineA,
      wenginePhase: 4,
    })
    expect(resolveFlexibleWengine(wengineA, 5, wengineA, 4)).toEqual({
      wengineKey: wengineA,
      wenginePhase: 5,
    })
  })
  it('takes the saved W-Engine when different', () => {
    expect(resolveFlexibleWengine(wengineB, 3, wengineA, 5)).toEqual({
      wengineKey: wengineB,
      wenginePhase: 3,
    })
  })
  it('keeps current when nothing saved', () => {
    expect(resolveFlexibleWengine(undefined, undefined, wengineA, 2)).toEqual({
      wengineKey: wengineA,
      wenginePhase: 2,
    })
  })
})

describe('resolveMindscape', () => {
  it('takes the max', () => {
    expect(resolveMindscape(2, 6)).toBe(6)
    expect(resolveMindscape(6, 2)).toBe(6)
    expect(resolveMindscape(undefined, 3)).toBe(3)
  })
})

describe('serialize/deserialize round-trip', () => {
  it('preserves team frames including combo state', () => {
    const database = testDB()
    const char = database.chars.getOrCreate(charKey)
    const hit = firstFormula()
    const rotation = [hit, { ...hit }]
    database.teams.set(charKey, {
      ...initialTeam(charKey),
      frames: [
        {
          tag: {
            rotation,
            comboType: 'advanced',
            comboKind: 'daze',
            comboStateJson: JSON.stringify({
              version: '1.0',
              values: { 'some:cond:src:': [3, 7] },
            }),
          },
          multiplier: 1,
          critMode: 'avg',
          bonusStats: [],
          conditionals: [],
          enemyStats: [],
        },
      ],
    })
    const team = database.teams.get(charKey) as Team
    const optConfigId = database.optConfigs.new()
    const optConfig = database.optConfigs.get(optConfigId)

    const build = serializeFromOptimizer(
      'combo',
      charKey,
      char,
      team,
      optConfig,
      { discIds: { ...char.equippedDiscs }, value: 123 }
    )

    // Clearing the live team after save must not affect the snapshot
    database.teams.setFrame0(charKey, { tag: undefined })
    expect(build.teamSnapshot?.frames?.[0].tag.rotation).toHaveLength(2)

    const tag = build.teamSnapshot?.frames?.[0].tag
    expect(tag?.rotation).toHaveLength(2)
    expect(tag?.comboType).toBe('advanced')
    expect(tag?.comboKind).toBe('daze')
    expect(tag?.comboStateJson).toContain('1.0')
    expect(build.teamSnapshot?.enemyLvl).toBe(team.enemyLvl)
    expect(build.optimizerSettings).toBeDefined()
    expect(
      build.optimizerSettings &&
        'generatedBuildListId' in build.optimizerSettings
    ).toBe(false)
    expect(build.charSetup?.mindscape).toBe(char.mindscape)
    expect(build.value).toBe(123)

    const patch = deserializeBuild(build, charKey, { char })
    expect(patch.teamPatch?.frames[0].tag.comboStateJson).toBe(
      tag?.comboStateJson
    )
    expect(patch.teamPatch?.frames[0].tag.rotation).toHaveLength(2)
    expect(patch.optimizerSettings).toBeDefined()
    expect(patch.generatedBuild?.value).toBe(123)
  })

  it('character-tab builds only restore setup', () => {
    const database = testDB()
    const char = database.chars.getOrCreate(charKey)
    const build = serializeFromCharacterTab('showcase', charKey, char)
    expect(build.source).toBe(BuildSource.Character)
    const patch = deserializeBuild(build, charKey, { char })
    expect(patch.teamPatch).toBeUndefined()
    expect(patch.optimizerSettings).toBeUndefined()
    expect(patch.charPatch.mindscape).toBe(char.mindscape)
  })
})
