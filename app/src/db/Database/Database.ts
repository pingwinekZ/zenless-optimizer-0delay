import type { DBStorage } from '@zenless-optimizer/common/database'
import {
  Database,
  SandboxStorage,
  SlotStorage,
} from '@zenless-optimizer/common/database'
import type { IZenlessObjectDescription, IZZZDatabase } from '../Interfaces'
import { zzzSource } from '../Interfaces'
import { DBMetaEntry, DisplayDiscEntry } from './DataEntries/'
import { DisplayCharacterEntry } from './DataEntries/DisplayCharacterEntry'
import { DisplayWengineEntry } from './DataEntries/DisplayWengineEntry'
import {
  CharMetaDataManager,
  DiscDataManager,
  StatWeightDataManager,
} from './DataManagers/'
import { CharacterDataManager } from './DataManagers/CharacterDataManager'
import { GeneratedBuildListDataManager } from './DataManagers/GeneratedBuildListDataManager'
import { OptConfigDataManager } from './DataManagers/OptConfigDataManager'
import { TeamDataManager } from './DataManagers/TeamDataManager'
import { WengineDataManager } from './DataManagers/WengineDataManager'
import type { ImportResult } from './exim'
import { newImportResult } from './exim'
import { currentDBVersion, migrateStorage, migrateZOOD } from './migrate'
/**
 * localStorage key prefixes owned by the legacy per-entry storage: one key per
 * disc/character/... entry, written straight to localStorage by
 * {@link DBLocalStorage}. New databases store the same entries inside a single
 * compressed slot instead, so these keys are only read once, to migrate, and
 * then deleted.
 */
export const legacyStorageKeyPrefixes = [
  'zzz_disc_',
  'zzz_character_',
  'zzz_characterBuild_',
  'zzz_charMeta_',
  'zzz_statWeight_',
  'zzz_generatedBuildList_',
  'zzz_optConfig_',
  'zzz_team_',
  'zzz_wengine_',
  // Historical prefixes that may still be present in an old install:
  // legacy per-run configs, and the pre-charMeta / pre-builds formats.
  'zzz_charOpt_',
  'zzz_savedBuild_',
] as const

/** Single-key (not per-entry) keys written by the legacy storage */
export const legacyStorageEntryKeys = [
  'zzz_dbMeta',
  'zzz_display_disc',
  'zzz_display_character',
  'zzz_display_wengine',
  // The per-entry storage kept the schema version next to the entries; a slot
  // carries its own version, so this key only belongs to the legacy layout.
  'zzz_db_ver',
] as const

/** Whether `key` is written per-entry by the legacy storage */
export function isLegacyStorageKey(key: string): boolean {
  return (
    legacyStorageKeyPrefixes.some((prefix) => key.startsWith(prefix)) ||
    (legacyStorageEntryKeys as readonly string[]).includes(key)
  )
}

/** The localStorage key holding a database slot */
export function slotStorageKey(index: number): string {
  return `zzz_extraDatabase_${index}`
}

/**
 * Marks that a slot's legacy per-entry keys have already been migrated into
 * its slot. Without it, a crash halfway through deleting those keys would make
 * the (incomplete) leftovers look like the authoritative copy.
 */
export function slotMigrationKey(index: number): string {
  return `zzz_slotMigrated_${index}`
}

export class ZzzDatabase extends Database {
  discs: DiscDataManager
  chars: CharacterDataManager
  teams: TeamDataManager
  wengines: WengineDataManager
  optConfigs: OptConfigDataManager
  charMeta: CharMetaDataManager
  statWeights: StatWeightDataManager
  dbMeta: DBMetaEntry
  displayDisc: DisplayDiscEntry
  displayCharacter: DisplayCharacterEntry
  displayWengine: DisplayWengineEntry
  generatedBuildList: GeneratedBuildListDataManager
  dbIndex: 1 | 2 | 3 | 4
  dbVer: number

  keyPrefix = 'zzz'

  constructor(dbIndex: 1 | 2 | 3 | 4, storage: DBStorage) {
    super(storage)
    migrateStorage(storage)
    // Transfer non DataManager/DataEntry data from storage
    this.dbIndex = dbIndex
    this.dbVer = storage.getDBVersion()
    this.storage.setDBVersion(this.dbVer)
    this.storage.setDBIndex(this.dbIndex)

    // Handle Datamanagers
    this.chars = new CharacterDataManager(this)

    // discs needs to be instantiated after character to check for relations
    this.discs = new DiscDataManager(this)

    // Wengines (catalog, auto-populates all keys at lvl60/mod5/phase1)
    this.wengines = new WengineDataManager(this)

    this.generatedBuildList = new GeneratedBuildListDataManager(this)

    // Depends on discs and characters
    this.optConfigs = new OptConfigDataManager(this)

    // Depends on optConfigs
    this.teams = new TeamDataManager(this)
    this.charMeta = new CharMetaDataManager(this)
    this.statWeights = new StatWeightDataManager(this)

    // Handle DataEntries
    this.dbMeta = new DBMetaEntry(this)
    this.displayDisc = new DisplayDiscEntry(this)
    this.displayCharacter = new DisplayCharacterEntry(this)
    this.displayWengine = new DisplayWengineEntry(this)

    this.discs.followAny(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })
    this.wengines.followAny(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })
    this.charMeta.followAny(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })
    this.displayDisc.follow(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })
    this.displayCharacter.follow(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })
    this.displayWengine.follow(() => {
      this.dbMeta.set({ lastEdit: Date.now() })
    })

    this.markInitialized()
  }
  get dataManagers() {
    // IMPORTANT: it must be chars, wengines, discs in order, to respect import order
    return [
      this.chars,
      this.discs,
      this.wengines,
      this.charMeta,
      this.statWeights,
      this.generatedBuildList,
      this.optConfigs,
      this.teams,
    ] as const
  }
  get dataEntries() {
    return [
      this.dbMeta,
      this.displayDisc,
      this.displayCharacter,
      this.displayWengine,
    ] as const
  }

  /** Entries loaded when this database was constructed, for the save guard */
  private initializedCounts: { chars: number; discs: number } = {
    chars: 0,
    discs: 0,
  }
  /** Set by `clear()`, so deleting everything is not treated as data loss */
  private permitEmptyPersist = false

  /** Record the loaded entry counts (called once construction is complete) */
  private markInitialized() {
    this.initializedCounts = {
      chars: this.chars.values.length,
      discs: this.discs.values.length,
    }
  }

  clear() {
    this.permitEmptyPersist = true
    this.dataManagers.map((dm) => dm.clear())
    this.dataEntries.map((de) => de.clear())
  }
  exportZOOD() {
    const zood: Partial<IZZZDatabase & IZenlessObjectDescription> = {
      format: 'ZOD',
      dbVersion: currentDBVersion,
      source: zzzSource,
      version: 1,
    }
    this.dataManagers.map((dm) => dm.exportZOOD(zood))
    this.dataEntries.map((de) => de.exportZOOD(zood))
    return zood as IZZZDatabase & IZenlessObjectDescription
  }
  importZOOD(
    zood: IZenlessObjectDescription & IZZZDatabase,
    keepNotInImport: boolean,
    ignoreDups: boolean
  ): ImportResult {
    zood = migrateZOOD(zood)
    const source = zood.source ?? 'Unknown'
    // Some Scanners might carry their own id field, which would conflict with GO dup resolution.
    if (source !== zzzSource) {
      zood.discs?.forEach((a) => delete (a as unknown as { id?: string }).id)
    }
    const result: ImportResult = newImportResult(
      source,
      keepNotInImport,
      ignoreDups
    )

    // Follow updates from char/disc/wengine to gather import results
    const unfollows = [
      // TODO:
      // this.chars.followAny((key, reason, value) => {
      //   const arr = result.characters[reason]
      //   const ind = arr.findIndex((c) => c?.key === key)
      //   if (ind < 0) arr.push(value)
      //   else arr[ind] = value
      // }),
      this.chars.followAny((_key, reason, value) =>
        result.characters[reason].push(value)
      ),
      this.discs.followAny((_key, reason, value) =>
        result.discs[reason].push(value)
      ),
      // TODO:
      /* this.wengines.followAny((_key, reason, value) =>
        result.wengines[reason].push(value)
      ), */
    ]

    this.dataManagers.map((dm) => dm.importZOOD(zood, result))
    this.dataEntries.map((de) => de.importZOOD(zood, result))
    unfollows.forEach((f) => f())

    return result
  }
  clearStorage() {
    this.dataManagers.map((dm) => dm.clearStorage())
    this.dataEntries.map((de) => de.clearStorage())
  }
  saveStorage() {
    this.dataManagers.map((dm) => dm.saveStorage())
    this.dataEntries.map((de) => de.saveStorage())
    this.storage.setDBVersion(this.dbVer)
    this.storage.setDBIndex(this.dbIndex)
  }
  swapStorage(other: ZzzDatabase) {
    this.clearStorage()
    other.clearStorage()

    const thisStorage = this.storage
    this.storage = other.storage
    other.storage = thisStorage

    this.saveStorage()
    other.saveStorage()
  }
  /** Snapshot of everything this database persists: `{storageKey: jsonString}` */
  extraEntries(): Record<string, string> {
    const other = new SandboxStorage(undefined, 'zzz')
    const oldstorage = this.storage
    this.storage = other
    this.saveStorage()
    this.storage = oldstorage
    return Object.fromEntries(other.entries)
  }

  /** Whether this database's entries live in a compressed slot */
  get isSlotBacked(): boolean {
    return this.storage instanceof SlotStorage
  }

  /** Whether this database has changes its slot has not persisted yet */
  get hasUnsavedSlotChanges(): boolean {
    return this.storage instanceof SlotStorage && this.storage.dirty
  }

  /** Treat the slot as persisted, for a database that was just opened */
  markSlotClean() {
    if (this.storage instanceof SlotStorage) this.storage.markClean()
  }

  /**
   * Make this database the slot the app opens next time, and persist both it
   * and its slot pointer. All slots are plain compressed keys now, so "active"
   * only decides which one loads at startup.
   */
  activateSlot(): boolean {
    const written = this.persistSlot({ allowEmpty: true })
    const storage = this.storage
    if (storage instanceof SlotStorage) {
      storage.persistTarget.setItem(storage.dbIndexKey, String(this.dbIndex))
    }
    return written
  }

  /**
   * Persist this database as its single compressed slot key.
   *
   * Returns `false` when there is nothing to write to, or when the write would
   * discard data that was loaded from storage:
   *
   * - A write-through storage (legacy per-entry localStorage keys) already
   *   holds everything this database contains. Writing a slot copy as well
   *   would leave an unread duplicate behind, which is exactly how installs
   *   ended up with a second, stale copy of their database in localStorage.
   * - A database that somehow lost every character and disc while the stored
   *   copy still had them is almost certainly a broken load (failed import,
   *   bad metadata), so the save is blocked. `clear()` and
   *   `adoptSlotStorage()` opt out of the guard.
   */
  persistSlot(options: { allowEmpty?: boolean } = {}): boolean {
    const storage = this.storage
    if (!(storage instanceof SlotStorage)) {
      console.warn(
        'ZzzDatabase.persistSlot: storage is not a database slot; skipping'
      )
      return false
    }
    const allowEmpty = options.allowEmpty || this.permitEmptyPersist
    const isEmpty = !this.chars.values.length && !this.discs.values.length
    const hadData =
      this.initializedCounts.chars > 0 || this.initializedCounts.discs > 0
    if (!allowEmpty && isEmpty && hadData) {
      console.warn(
        `ZzzDatabase.persistSlot: blocked a save that would delete ${this.initializedCounts.chars} characters / ${this.initializedCounts.discs} discs`
      )
      return false
    }
    this.permitEmptyPersist = false
    try {
      storage.flush()
    } catch (e) {
      // Quota exceeded, private mode, ... - keep the data in memory, and let
      // the next save attempt retry (the slot stays dirty).
      console.error('ZzzDatabase.persistSlot: failed to write the database', e)
      return false
    }
    return true
  }

  /**
   * Move this database into `next` (a compressed slot) and delete the legacy
   * per-entry keys it was loaded from.
   *
   * The legacy keys are only removed after the slot has been written and read
   * back successfully, so a failure here always leaves the previous storage
   * intact. A crash between the write and the delete is recoverable: the
   * migration marker makes the next load prefer the slot over the leftovers.
   */
  adoptSlotStorage(next: SlotStorage): boolean {
    const previous = this.storage
    this.storage = next
    // Anything the slot already held (a stale copy of this database, or a
    // previous partial write) is replaced by what is actually loaded.
    next.clear()
    this.saveStorage()
    next.setDBVersion(this.dbVer)
    next.setDBIndex(this.dbIndex)
    const written = this.persistSlot({ allowEmpty: true })
    if (!written || !next.verifyFlushed()) {
      console.error(
        'ZzzDatabase.adoptSlotStorage: slot write failed; keeping legacy keys'
      )
      this.storage = previous
      return false
    }
    next.persistTarget.setItem(slotMigrationKey(this.dbIndex), '1')
    previous.removeForKeys(isLegacyStorageKey)
    return true
  }
}
