import {
  compressToGzipString,
  decompressGzipString,
  isGzipString,
} from '@zenless-optimizer/common/util'
import type { StorageType } from './DBStorage'
import { SandboxStorage } from './SandboxStorage'
import { decodeSlotPayload } from './util'

/** Order-independent fingerprint of a slot's entries */
function canonical(entries: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(entries)
      .sort()
      .map((key) => [key, entries[key]])
  )
}

/**
 * A database slot: the whole database lives in memory and persists as ONE
 * compressed key in a `Storage`.
 *
 * One key per database keeps the per-entry redundancy (repeated set/stat keys,
 * shared field names, ...) inside a single gzip stream, which compresses
 * roughly an order of magnitude better than one key per entry - gzip on a
 * small record spends more bytes on headers than it saves.
 *
 * Writes are buffered: `set`/`remove` only mark the slot dirty, and `flush()`
 * serializes and stores it. The database layer drives `flush()` through
 * `ZzzDatabase.persistSlot()`, which the provider debounces.
 */
export class SlotStorage extends SandboxStorage {
  /** localStorage key holding this slot */
  readonly slotKey: string
  /** Storage the slot is persisted to */
  readonly persistTarget: Storage
  protected dirtyFlag = false

  constructor(
    slotKey: string,
    target: Storage,
    obj?: Record<string, string>,
    storageType: StorageType = 'go'
  ) {
    super(obj, storageType)
    this.slotKey = slotKey
    this.persistTarget = target
  }

  /**
   * Open a slot, seeding it from whatever is stored under `slotKey` (current
   * gzip-Latin-1 form, or the legacy base64/plain-JSON forms).
   */
  static open(
    slotKey: string,
    target: Storage,
    storageType: StorageType = 'go'
  ): SlotStorage {
    const payload = decodeSlotPayload(target.getItem(slotKey) ?? '')
    return new SlotStorage(slotKey, target, payload, storageType)
  }

  /** Whether in-memory changes have not been flushed yet */
  get dirty(): boolean {
    return this.dirtyFlag
  }

  /**
   * Treat the current contents as already persisted. Used right after opening
   * a slot, so the default entries a fresh database writes on construction are
   * not flushed back to storage as if the user had changed something.
   */
  markClean(): void {
    this.dirtyFlag = false
  }

  /** Serialized, compressed form of the current contents */
  serialize(): string {
    return compressToGzipString(JSON.stringify(this.storage))
  }

  /** Persist the slot as a single compressed key. Clears `dirty` on success. */
  flush(): void {
    this.persistTarget.setItem(this.slotKey, this.serialize())
    this.dirtyFlag = false
  }

  /**
   * Whether the stored payload round-trips back to the current contents.
   * Used to confirm a destructive migration before the source is deleted.
   * Key order is ignored, since deletes and re-adds can reorder entries.
   */
  verifyFlushed(): boolean {
    const raw = this.persistTarget.getItem(this.slotKey)
    if (!raw) return false
    try {
      const decoded = isGzipString(raw)
        ? (JSON.parse(decompressGzipString(raw)) as Record<string, string>)
        : decodeSlotPayload(raw)
      return canonical(decoded) === canonical(this.storage)
    } catch {
      return false
    }
  }

  /** Remove the slot key from the underlying storage */
  removeSlot(): void {
    this.persistTarget.removeItem(this.slotKey)
  }

  override set(key: string, value: any): void {
    super.set(key, value)
    this.dirtyFlag = true
  }
  override setString(key: string, value: string): void {
    super.setString(key, value)
    this.dirtyFlag = true
  }
  override remove(key: string): void {
    super.remove(key)
    this.dirtyFlag = true
  }
  override clear(): void {
    super.clear()
    this.dirtyFlag = true
  }
  override removeForKeys(shouldRemove: (key: string) => boolean): void {
    super.removeForKeys(shouldRemove)
    this.dirtyFlag = true
  }
}
