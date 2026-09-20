import { createTestDBStorage } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type { CharacterKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import {
  allCharacterKeys,
  allDiscSlotKeys,
  allWengineKeys,
} from '@zenless-optimizer/zzz/consts'
import type { Team } from '@zenless-optimizer/zzz/db'
import { ZzzDatabase } from '@zenless-optimizer/zzz/db/Database/Database'
import { initialTeam } from '@zenless-optimizer/zzz/db/Database/DataManagers/TeamDataManager'
import { formulas } from '@zenless-optimizer/zzz/formula'
import { BuildSource } from '@zenless-optimizer/zzz/zood'
import {
  deserializeBuild,
  previewOverrideFromBuild,
  resolveFlexibleWengine,
  resolveMindscape,
  serializeFromCharacterTab,
  serializeFromOptimizer,
} from './buildConverter'

const charKey = allCharacterKeys[0] as CharacterKey
const mateKey = allCharacterKeys[1] as CharacterKey
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

describe('previewOverrideFromBuild', () => {
  it('shows saved values as-is without max-merging', () => {
    const database = testDB()
    const char = database.chars.getOrCreate(charKey)
    database.chars.set(charKey, {
      ...char,
      mindscape: 6,
      wengineKey: wengineA,
      wenginePhase: 5,
    })
    const live = database.chars.get(charKey)!
    const team = database.teams.getOrCreate(charKey)

    const build = serializeFromOptimizer(
      'preview',
      charKey,
      { ...live, mindscape: 2, wengineKey: wengineB, wenginePhase: 1 },
      team,
      undefined,
      { discIds: { ...live.equippedDiscs } }
    )

    const override = previewOverrideFromBuild(
      charKey,
      { char: live, team },
      build
    )
    expect(override?.character.mindscape).toBe(2)
    expect(override?.character.wengineKey).toBe(wengineB)
    expect(override?.character.wenginePhase).toBe(1)
    expect(override?.discIds).toEqual(build.discIds)
    expect(override?.team.frames).toHaveLength(team.frames.length)
  })

  it('returns null without live character and setup', () => {
    const database = testDB()
    const team = database.teams.getOrCreate(charKey)
    const char = database.chars.getOrCreate(charKey)
    const build = serializeFromOptimizer(
      'preview',
      charKey,
      char,
      team,
      undefined,
      { discIds: { ...char.equippedDiscs } }
    )
    delete (build as { charSetup?: unknown }).charSetup
    expect(previewOverrideFromBuild(charKey, { team }, build)).toBeNull()
  })
})

describe('teammate gear snapshot', () => {
  it('captures save-time teammate gear and exposes it for preview', () => {
    const database = testDB()
    const char = database.chars.getOrCreate(charKey)
    const team = {
      ...initialTeam(charKey),
      teammates: [{ characterKey: charKey }, { characterKey: mateKey }],
    } as Team
    const mateDiscIds = objKeyMap(allDiscSlotKeys, (slot) =>
      slot === '1' ? 'mate-disc-1' : undefined
    )

    const build = serializeFromOptimizer(
      'gear',
      charKey,
      char,
      team,
      undefined,
      { discIds: { ...char.equippedDiscs } },
      {
        main: {
          wengineKey: char.wengineKey,
          wenginePhase: char.wenginePhase,
          mindscape: char.mindscape,
          discIds: { ...char.equippedDiscs },
        },
        of: (key) =>
          key === mateKey
            ? {
                wengineKey: wengineA,
                wenginePhase: 2,
                mindscape: 4,
                discIds: mateDiscIds,
              }
            : undefined,
      }
    )

    const mate = build.teamSnapshot?.teammates?.[1] as {
      wengineKey?: string
      wenginePhase?: number
      mindscape?: number
      discIds?: Record<string, string | undefined>
    }
    expect(mate?.wengineKey).toBe(wengineA)
    expect(mate?.wenginePhase).toBe(2)
    expect(mate?.mindscape).toBe(4)
    expect(mate?.discIds?.['1']).toBe('mate-disc-1')
    // Slot 0 carries the main character's saved gear too
    expect(
      (
        build.teamSnapshot?.teammates?.[0] as {
          discIds?: Record<string, string | undefined>
        }
      )?.discIds
    ).toEqual(char.equippedDiscs)

    const override = previewOverrideFromBuild(charKey, { char, team }, build)
    expect(override?.teammateGear?.[mateKey]?.wengineKey).toBe(wengineA)
    expect(override?.teammateGear?.[mateKey]?.discIds?.['1']).toBe(
      'mate-disc-1'
    )
    expect(override?.teammateGear?.[charKey]).toBeUndefined()

    // The load patch keeps teammate gear for restore
    const patch = deserializeBuild(build, charKey, { char, team })
    expect(patch.teamPatch?.teammates[1].wengineKey).toBe(wengineA)
    expect(patch.teamPatch?.teammates[1].discIds?.['1']).toBe('mate-disc-1')
  })

  it('omits teammateGear when the snapshot has no gear', () => {
    const database = testDB()
    const char = database.chars.getOrCreate(charKey)
    const team = database.teams.getOrCreate(charKey)
    const build = serializeFromOptimizer(
      'gearless',
      charKey,
      char,
      team,
      undefined,
      { discIds: { ...char.equippedDiscs } }
    )
    const override = previewOverrideFromBuild(charKey, { char, team }, build)
    expect(override?.teammateGear).toBeUndefined()
  })
})
