import {
  createTestDBStorage,
  createTestSandboxStorage,
} from '@zenless-optimizer/common/database'
import { allWengineKeys } from '../../../consts'
import { ZzzDatabase } from '../Database'

describe('WengineDataManager', () => {
  let database: ZzzDatabase
  let wengines: ZzzDatabase['wengines']

  beforeEach(() => {
    const dbStorage = createTestDBStorage('zzz')
    database = new ZzzDatabase(1, dbStorage)
    wengines = database.wengines
  })

  it('should validate level/modification co-validation', () => {
    const valid = {
      key: allWengineKeys[0],
      level: 50,
      modification: 3,
      phase: 2,
      location: '',
      lock: false,
    }
    const result = wengines['validate'](valid)
    expect(result?.modification).toBe(3)
  })

  it('should keep the catalog in memory without persisting or exporting it', () => {
    const storage = createTestSandboxStorage()
    const db = new ZzzDatabase(1, storage)
    // Full catalog available for selection/validation lookups
    expect(db.wengines.keys.length).toBe(allWengineKeys.length)
    expect(db.wengines.get('SteelCushion')?.key).toBe('SteelCushion')
    // ...but nothing is written to storage ...
    expect(
      storage.keys.filter(
        (k) =>
          (allWengineKeys as readonly string[]).includes(k) ||
          k.startsWith('zzz_wengine_')
      )
    ).toEqual([])
    // ... or to exports
    expect(
      (db.exportZOOD() as Record<string, unknown>).wengines
    ).toBeUndefined()
  })
})
