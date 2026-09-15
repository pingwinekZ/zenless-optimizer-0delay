import { DBLocalStorage } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import type { CharacterKey } from '../../consts'
import { allCharacterKeys, allDiscSlotKeys } from '../../consts'
import type { SavedBuild } from '../../zood'
import { ZzzDatabase } from './Database'

const charKey = allCharacterKeys[0] as CharacterKey

function legacyBuild(name: string, updatedAt: number): SavedBuild {
  return {
    name,
    characterKey: charKey,
    discIds: objKeyMap(allDiscSlotKeys, () => undefined),
    value: 100,
    createdAt: updatedAt,
    updatedAt,
  } as SavedBuild
}

describe('migrateStorage v6: global savedBuilds -> character builds', () => {
  it('moves builds onto the character and drops old keys', () => {
    // Storage stub where data keys are own enumerable props, like real
    // localStorage (createMockStorage keeps them in a closure, so
    // `storage.keys` cannot see them).
    const mock = {} as Storage & Record<string, string>
    const api: Record<string, unknown> = {
      getItem: (key: string) => mock[key] ?? null,
      setItem: (key: string, value: string) => {
        mock[key] = value
      },
      removeItem: (key: string) => {
        delete mock[key]
      },
      clear: () => {
        for (const key of Object.keys(mock)) delete mock[key]
      },
      length: 0,
      key: (index: number) => Object.keys(mock)[index] ?? null,
    }
    for (const [k, v] of Object.entries(api))
      Object.defineProperty(mock, k, { value: v, enumerable: false })
    const storage = new DBLocalStorage(mock, 'zzz')
    storage.setDBVersion(5)
    storage.set('zzz_savedBuild_0', legacyBuild('a', 1))
    storage.set('zzz_savedBuild_1', legacyBuild('b', 2))
    // Duplicate name: newest wins
    storage.set('zzz_savedBuild_2', legacyBuild('a', 3))

    const database = new ZzzDatabase(1, storage)
    expect(
      database.chars
        .get(charKey)
        ?.builds?.map((b) => b.name)
        .sort()
    ).toEqual(['a', 'b'])
    expect(
      database.chars.get(charKey)?.builds?.find((b) => b.name === 'a')
        ?.updatedAt
    ).toBe(3)
    expect(storage.keys.filter((k) => k.startsWith('zzz_savedBuild_'))).toEqual(
      []
    )
    expect(storage.getDBVersion()).toBe(6)
  })
})
