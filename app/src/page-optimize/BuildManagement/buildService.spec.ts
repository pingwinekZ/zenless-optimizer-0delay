import { createTestDBStorage } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type { CharacterKey } from '../../consts'
import { allCharacterKeys, allDiscSetKeys, allDiscSlotKeys } from '../../consts'
import { ZzzDatabase } from '../../db/Database/Database'
import { initialTeam } from '../../db/Database/DataManagers/TeamDataManager'
import { formulas } from '../../formula'
import { BuildSource } from '../../zood'
import {
  buildEquipConflicts,
  clearBuilds,
  deleteBuild,
  equipBuild,
  loadBuildInOptimizer,
  saveBuild,
} from './buildService'

const charKey = allCharacterKeys[0] as CharacterKey
const charKey2 = allCharacterKeys[1] as CharacterKey

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
  const database = new ZzzDatabase(1, createTestDBStorage('zzz'))
  database.chars.getOrCreate(charKey)
  const optConfigId = database.optConfigs.new()
  database.teams.set(charKey, {
    ...initialTeam(charKey),
    frames: [
      {
        tag: {
          rotation: [firstFormula(), firstFormula()],
          comboType: 'advanced',
          comboStateJson: JSON.stringify({
            version: '1.0',
            values: {},
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
  return { database, optConfigId }
}

describe('saveBuild', () => {
  it('saves and rejects duplicates without overwrite', () => {
    const { database, optConfigId } = testDB()
    expect(
      saveBuild(database, {
        name: 'a',
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
      }).error
    ).toBeUndefined()
    expect(
      saveBuild(database, {
        name: 'a',
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
      }).error
    ).toMatch(/already exists/)
    expect(
      saveBuild(database, {
        name: 'a',
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
        overwrite: true,
      }).error
    ).toBeUndefined()
    expect(database.chars.get(charKey)?.builds).toHaveLength(1)
  })

  it('errors on overwrite of a missing build and on empty names', () => {
    const { database, optConfigId } = testDB()
    expect(
      saveBuild(database, {
        name: 'missing',
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
        overwrite: true,
      }).error
    ).toMatch(/No matching build/)
    expect(
      saveBuild(database, {
        name: '   ',
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
      }).error
    ).toBeDefined()
  })

  it('saves without a selected build and snapshots char setup', () => {
    const { database, optConfigId } = testDB()
    database.chars.set(charKey, { mindscape: 3 })
    const res = saveBuild(database, {
      name: 'bare',
      characterKey: charKey,
      optConfigId,
      source: BuildSource.Optimizer,
    })
    expect(res.error).toBeUndefined()
    const build = database.chars.get(charKey)?.builds?.[0]
    expect(build?.value).toBeUndefined()
    expect(build?.charSetup?.mindscape).toBe(3)
    expect(build?.teamSnapshot?.frames?.[0].tag.comboType).toBe('advanced')
  })
})

describe('loadBuildInOptimizer', () => {
  it('restores team combo, settings, results and maxes mindscape', () => {
    const { database, optConfigId } = testDB()
    database.chars.set(charKey, { mindscape: 2 })
    saveBuild(database, {
      name: 'a',
      characterKey: charKey,
      optConfigId,
      source: BuildSource.Optimizer,
      equipped: {
        discIds: objKeyMap(allDiscSlotKeys, () => undefined),
        value: 999,
      },
    })
    const build = database.chars.get(charKey)?.builds?.[0]
    expect(build).toBeDefined()
    if (!build) return

    // Diverge the live state, then load
    database.chars.set(charKey, { mindscape: 5 })
    database.teams.setFrame0(charKey, { tag: undefined })
    database.optConfigs.set(optConfigId, { maxBuildsToShow: 50 })
    loadBuildInOptimizer(database, build, {
      characterKey: charKey,
      optConfigId,
    })

    // Mindscape takes the max (saved 2 vs current 5)
    expect(database.chars.get(charKey)?.mindscape).toBe(5)
    const tag = database.teams.get(charKey)?.frames[0].tag
    expect(tag?.comboType).toBe('advanced')
    expect(tag?.rotation).toHaveLength(2)
    expect(tag?.comboStateJson).toContain('1.0')
    const listId = database.optConfigs.get(optConfigId)?.generatedBuildListId
    const list = listId && database.generatedBuildList.get(listId)
    expect(list?.builds[0].value).toBe(999)
  })

  it('tolerates stale combo blobs on load', () => {
    const { database, optConfigId } = testDB()
    saveBuild(database, {
      name: 'a',
      characterKey: charKey,
      optConfigId,
      source: BuildSource.Optimizer,
    })
    const build = database.chars.get(charKey)?.builds?.[0]
    expect(build).toBeDefined()
    if (!build) return
    // Corrupt the blob: wrong version and wrong hit count
    const frames = build.teamSnapshot?.frames
    if (frames?.[0]?.tag) {
      frames[0].tag.comboStateJson = JSON.stringify({
        version: '0.0',
        values: { x: [1] },
      })
    }
    expect(() =>
      loadBuildInOptimizer(database, build, {
        characterKey: charKey,
        optConfigId,
      })
    ).not.toThrow()
    // Stale blob dropped, rotation preserved
    const tag = database.teams.get(charKey)?.frames[0].tag
    expect(tag?.rotation).toHaveLength(2)
    expect(tag?.comboStateJson).toBeUndefined()
  })
})

describe('equip', () => {
  it('detects stolen discs and equips onto the character', () => {
    const { database, optConfigId } = testDB()
    const discId = database.discs.new({
      setKey: allDiscSetKeys[0],
      rarity: 'S',
      level: 15,
      slotKey: '1',
      mainStatKey: 'hp',
      substats: [
        { key: 'atk_', upgrades: 2 },
        { key: 'def_', upgrades: 2 },
        { key: 'crit_', upgrades: 2 },
        { key: 'crit_dmg_', upgrades: 1 },
      ],
      location: charKey2,
      lock: false,
      trash: false,
    })
    expect(discId).toBeTruthy()
    saveBuild(database, {
      name: 'a',
      characterKey: charKey,
      optConfigId,
      source: BuildSource.Optimizer,
      equipped: {
        discIds: objKeyMap(allDiscSlotKeys, (sk) =>
          sk === '1' ? discId : undefined
        ),
      },
    })
    const build = database.chars.get(charKey)?.builds?.[0]
    expect(build).toBeDefined()
    if (!build) return

    expect(buildEquipConflicts(database, charKey, build)).toEqual([
      { discId, slotKey: '1', owner: charKey2 },
    ])
    equipBuild(database, charKey, build)
    expect(database.discs.get(discId)?.location).toBe(charKey)
    expect(database.chars.get(charKey)?.equippedDiscs['1']).toBe(discId)
    expect(buildEquipConflicts(database, charKey, build)).toEqual([])
  })
})

describe('delete/clear', () => {
  it('removes builds by name and all at once', () => {
    const { database, optConfigId } = testDB()
    for (const name of ['a', 'b']) {
      saveBuild(database, {
        name,
        characterKey: charKey,
        optConfigId,
        source: BuildSource.Optimizer,
      })
    }
    deleteBuild(database, charKey, 'a')
    expect(database.chars.get(charKey)?.builds?.map((b) => b.name)).toEqual([
      'b',
    ])
    clearBuilds(database, charKey)
    expect(database.chars.get(charKey)?.builds).toEqual([])
  })
})
