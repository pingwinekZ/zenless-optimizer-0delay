import { notEmpty } from '@zenless-optimizer/common/util'
import type { IDisc } from '../../../zood'
import { validateDisc } from '../../../zood'
import type {
  ICachedDisc,
  IZenlessObjectDescription,
  IZZZDatabase,
} from '../../Interfaces'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'
import type { ImportResult } from '../exim'
export class DiscDataManager extends DataManager<
  string,
  'discs',
  ICachedDisc,
  IDisc
> {
  constructor(database: ZzzDatabase) {
    super(database, 'discs')
  }
  override validate(obj: unknown): IDisc | undefined {
    return validateDisc(obj)
  }
  override toCache(storageObj: IDisc, id: string): ICachedDisc | undefined {
    // Generate cache fields
    const newDisc = { ...storageObj, id } as ICachedDisc

    // Check relations and update equipment
    const oldDisc = super.get(id)
    if (newDisc.location !== oldDisc?.location) {
      const slotKey = newDisc.slotKey
      const prevChar = oldDisc?.location
        ? this.database.chars.getOrCreate(oldDisc.location)
        : undefined
      const newChar = newDisc.location
        ? this.database.chars.getOrCreate(newDisc.location)
        : undefined
      // previously equipped disc at new location
      const prevDisc = super.get(newChar?.equippedDiscs[slotKey])

      //current prevDisc <-> newChar  && newDisc <-> prevChar
      //swap to prevDisc <-> prevChar && newDisc <-> newChar(outside of this if)

      if (prevDisc)
        super.setCached(prevDisc.id, {
          ...prevDisc,
          location: prevChar?.key ?? '',
        })
      if (newChar)
        this.database.chars.setEquippedDisc(newChar.key, slotKey, newDisc.id)
      if (prevChar)
        this.database.chars.setEquippedDisc(
          prevChar.key,
          slotKey,
          prevDisc?.id ?? ''
        )
    } else
      newDisc.location &&
        this.database.chars.triggerCharacter(newDisc.location, 'update')

    return newDisc
  }
  override deCache(disc: ICachedDisc): IDisc {
    const {
      setKey,
      rarity,
      level,
      slotKey,
      mainStatKey,
      substats,
      location,
      lock,
      trash,
    } = disc
    return {
      setKey,
      rarity,
      level,
      slotKey,
      mainStatKey,
      substats: substats.map(({ key, upgrades }) => ({
        key,
        upgrades,
      })),
      location,
      lock,
      trash,
    }
  }

  new(value: IDisc): string {
    const id = this.generateKey()
    this.set(id, value)
    return id
  }
  override remove(key: string, notify = true): ICachedDisc | undefined {
    const disc = super.remove(key, notify)
    if (!disc) return disc
    if (disc.location)
      this.database.chars.setEquippedDisc(disc.location, disc.slotKey, '')
    // Strip the deleted disc from saved builds so they never dangle
    for (const char of this.database.chars.values) {
      if (!(char.builds ?? []).some((b) => b.discIds[disc.slotKey] === key))
        continue
      this.database.chars.set(char.key, {
        builds: (char.builds ?? []).map((b) =>
          b.discIds[disc.slotKey] === key
            ? { ...b, discIds: { ...b.discIds, [disc.slotKey]: undefined } }
            : b
        ),
      })
    }
    return disc
  }
  override importZOOD(
    zood: IZenlessObjectDescription & IZZZDatabase,
    result: ImportResult
  ): void {
    result.discs.beforeMerge = this.values.length

    // Match discs for counter, metadata, and locations
    const discs = zood.discs

    if (!Array.isArray(discs) || !discs.length) {
      result.discs.notInImport = this.values.length
      return
    }

    const takenIds = new Set(this.keys)
    discs.forEach((r) => {
      const id = (r as ICachedDisc).id
      if (!id) return
      takenIds.add(id)
    })

    result.discs.import = discs.length
    const idsToRemove = new Set(this.values.map((r) => r.id))
    const hasEquipment = discs.some((r) => r.location)
    // Candidates for a duplicate/upgrade must match on set, rarity, slot and
    // main stat, so indexing the stored discs by those four fields once turns
    // the per-disc scan below into a lookup of a small bucket. Scanning every
    // stored disc per imported disc made imports of a full inventory
    // quadratic - tens of seconds for a few thousand discs.
    const matchBuckets = discMatchBuckets(this.values)
    discs.forEach((r): void => {
      const disc = this.validate(r)
      if (!disc) {
        result.discs.invalid.push(r)
        return
      }

      let importDisc = disc
      let importId: string | undefined = (r as ICachedDisc).id
      let foundDupOrUpgrade = false
      if (!result.ignoreDups) {
        const { duplicated, upgraded } = findDupCandidates(
          disc,
          discCandidates(disc, matchBuckets, idsToRemove, (id) => this.get(id))
        )
        if (duplicated[0] || upgraded[0]) {
          foundDupOrUpgrade = true
          // Favor upgrades with the same location, else use 1st dupe
          let [match, isUpgrade] =
            hasEquipment &&
            disc.location &&
            upgraded[0]?.location === disc.location
              ? [upgraded[0], true]
              : duplicated[0]
                ? [duplicated[0], false]
                : [upgraded[0], true]
          if (importId) {
            // favor exact id matches
            const up = upgraded.find((a) => a.id === importId)
            if (up) [match, isUpgrade] = [up, true]
            const dup = duplicated.find((a) => a.id === importId)
            if (dup) [match, isUpgrade] = [dup, false]
          }
          isUpgrade
            ? result.discs.upgraded.push(disc)
            : result.discs.unchanged.push(disc)
          idsToRemove.delete(match.id)

          //Imported disc will be set to `importId` later, so remove the dup/upgrade now to avoid a duplicate
          this.remove(match.id, false) // Do not notify, since this is a "replacement"
          if (!importId) importId = match.id // always resolve some id
          importDisc = {
            ...disc,
            location: hasEquipment ? disc.location : match.location,
          }
        }
      }
      if (importId) {
        if (this.get(importId)) {
          // `importid` already in use, get a new id
          const newId = this.generateKey(takenIds)
          takenIds.add(newId)
          if (this.changeId(importId, newId)) {
            // Sync the id in `idsToRemove` due to the `changeId`
            if (idsToRemove.has(importId)) {
              idsToRemove.delete(importId)
              idsToRemove.add(newId)
              // The re-keyed disc is still stored, so later imported discs must
              // still be able to match against it
              const rekeyed = this.get(newId)
              if (rekeyed) {
                const bucket = matchBuckets.get(discMatchKey(rekeyed))
                bucket?.delete(importId)
                bucket?.add(newId)
              }
            }
          }
        }
      } else {
        importId = this.generateKey(takenIds)
        takenIds.add(importId)
      }
      this.set(importId, importDisc, !foundDupOrUpgrade)
    })
    const idtoRemoveArr = Array.from(idsToRemove)
    if (result.keepNotInImport || result.ignoreDups)
      result.discs.notInImport = idtoRemoveArr.length
    else idtoRemoveArr.forEach((k) => this.remove(k))
  }
  findDups(
    editorDisc: IDisc,
    idList = this.keys
  ): { duplicated: ICachedDisc[]; upgraded: ICachedDisc[] } {
    const discs = idList.map((id) => this.get(id)).filter(notEmpty)
    return findDupCandidates(editorDisc, discs)
  }
}

/** Fields two discs must share to be a duplicate of (or an upgrade to) each other */
function discMatchKey(
  disc: Pick<IDisc, 'setKey' | 'rarity' | 'slotKey' | 'mainStatKey'>
): string {
  return `${disc.setKey}|${disc.rarity}|${disc.slotKey}|${disc.mainStatKey}`
}

/** Index stored discs by {@link discMatchKey} to keep duplicate checks off the full inventory */
function discMatchBuckets(
  discs: Iterable<ICachedDisc>
): Map<string, Set<string>> {
  const buckets = new Map<string, Set<string>>()
  for (const disc of discs) {
    const key = discMatchKey(disc)
    const bucket = buckets.get(key)
    if (bucket) bucket.add(disc.id)
    else buckets.set(key, new Set([disc.id]))
  }
  return buckets
}

/**
 * The stored discs {@link findDupCandidates} may match against, restricted to
 * the bucket sharing the imported disc's set/rarity/slot/main stat and still
 * awaiting a match. Values are read from the live cache because earlier
 * iterations can move a disc's location or re-key it.
 */
function discCandidates(
  disc: IDisc,
  buckets: Map<string, Set<string>>,
  removableIds: Set<string>,
  getStoredDisc: (id: string) => ICachedDisc | undefined
): ICachedDisc[] {
  const bucket = buckets.get(discMatchKey(disc))
  if (!bucket) return []
  const candidates: ICachedDisc[] = []
  for (const id of bucket) {
    if (!removableIds.has(id)) continue
    const candidate = getStoredDisc(id)
    if (candidate) candidates.push(candidate)
  }
  return candidates
}

/**
 * Find the discs `editorDisc` duplicates or strictly upgrades. Callers pass
 * candidate discs that already share the set/rarity/slot/main-stat fields
 * (see {@link discMatchKey}) - the checks below are on top of that.
 */
function findDupCandidates(
  editorDisc: IDisc,
  discs: ICachedDisc[]
): { duplicated: ICachedDisc[]; upgraded: ICachedDisc[] } {
  const {
    setKey,
    rarity,
    level = 0,
    slotKey,
    mainStatKey,
    substats = [],
  } = editorDisc

  const candidates = discs.filter(
    (candidate) =>
      setKey === candidate.setKey &&
      rarity === candidate.rarity &&
      slotKey === candidate.slotKey &&
      mainStatKey === candidate.mainStatKey &&
      level >= candidate.level &&
      substats.every(
        (substat, i) =>
          !candidate.substats[i]?.key || // Candidate doesn't have anything on this slot
          (substat.key === candidate.substats[i]?.key && // Or editor simply has better substat
            substat.upgrades >= candidate.substats[i]?.upgrades)
      )
  )

  // Strictly upgraded disc
  const upgraded = candidates
    .filter(
      (candidate) =>
        level > candidate.level &&
        (Math.floor(level / 3) === Math.floor(candidate.level / 3) // Check for extra rolls
          ? substats.every(
              (
                substat,
                i // Has no extra roll
              ) =>
                substat.key === candidate.substats[i]?.key &&
                substat.upgrades === candidate.substats[i]?.upgrades
            )
          : substats.some(
              (
                substat,
                i // Has extra rolls
              ) =>
                candidate.substats[i]?.key
                  ? substat.upgrades > candidate.substats[i]?.upgrades // Extra roll to existing substat
                  : substat.key // Extra roll to new substat
            ))
    )
    .sort((candidates) =>
      candidates.location === editorDisc.location ? -1 : 1
    )
  // Strictly duplicated disc
  const duplicated = candidates
    .filter(
      (candidate) =>
        level === candidate.level &&
        substats.every(
          (substat, i) =>
            substat.key === candidate.substats[i]?.key &&
            candidate.substats.some(
              (candidateSubstat) =>
                substat.key === candidateSubstat.key && // Or same slot
                substat.upgrades === candidateSubstat.upgrades
            )
        )
    )
    .sort((candidates) =>
      candidates.location === editorDisc.location ? -1 : 1
    )
  return { duplicated, upgraded }
}

// Re-export validation functions for backward compatibility
// The schemas are now the single source of truth in zood
export {
  validateDisc,
  validateDiscWithErrors as validateDiscBasedOnRarity,
} from '../../../zood'
