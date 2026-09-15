export const dbVersionKeys = ['db_ver', 'sro_db_ver', 'zzz_db_ver'] as const
export type DbVersionKey = (typeof dbVersionKeys)[number]

export const dbIndexKeys = ['dbIndex', 'sro_dbIndex', 'zzz_dbIndex'] as const
export type DbIndexKey = (typeof dbIndexKeys)[number]

export type StorageType = 'go' | 'sro' | 'zzz'

export interface DBStorage {
  keys: string[]
  entries: [key: string, value: string][]
  dbVersionKey: DbVersionKey
  dbIndexKey: DbIndexKey
  /**
   * `true` when `set`/`setString`/`remove` hit a real, persistent store
   * immediately (browser localStorage). In-memory storages - including ones
   * seeded from persisted data - are `false`: they only reach persistent
   * storage when the database explicitly persists them (e.g. `persistSlot`).
   */
  readonly writeThrough: boolean

  get(key: string): any | undefined
  set(key: string, value: any): void

  getString(key: string): string | undefined
  setString(key: string, value: string): void
  remove(key: string): void
  removeForKeys(shouldRemove: (key: string) => boolean): void

  copyFrom(other: DBStorage): void
  clear(): void
  getDBVersion(): number
  setDBVersion(version: number): void
  getDBIndex(): 1 | 2 | 3 | 4
  setDBIndex(ind: 1 | 2 | 3 | 4): void
}
