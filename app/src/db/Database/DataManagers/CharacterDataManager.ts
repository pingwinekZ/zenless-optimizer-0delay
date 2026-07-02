import type { TriggerString } from '@zenless-optimizer/common/database'
import { deepClone, objKeyMap } from '@zenless-optimizer/common/util'
import type { CharacterKey, DiscSlotKey } from '../../../consts'
import { allDiscSlotKeys } from '../../../consts'
import type { ICharacter } from '../../../zood'
import { parseCharacter } from '../../../zood'
import type { ICachedCharacter } from '../../Interfaces'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

export class CharacterDataManager extends DataManager<
  CharacterKey,
  'characters',
  ICachedCharacter,
  ICharacter
> {
  constructor(database: ZzzDatabase) {
    super(database, 'characters')
  }
  override validate(obj: unknown) {
    return parseCharacter(obj)
  }

  override toCache(storageObj: ICharacter, id: CharacterKey): ICachedCharacter {
    const oldChar = this.get(id)
    return {
      equippedDiscs: oldChar
        ? oldChar.equippedDiscs
        : objKeyMap(
            allDiscSlotKeys,
            (sk) =>
              Object.values(this.database.discs?.data ?? {}).find(
                (a) => a?.location === id && a.slotKey === sk
              )?.id ?? ''
          ),
      ...storageObj,
    }
  }
  // These overrides allow CharacterKey to be used as id.
  // This assumes we only support one copy of a character in a DB.
  override toStorageKey(key: string): string {
    return `${this.goKeySingle}_${key}`
  }
  override toCacheKey(key: string): CharacterKey {
    return key.split(`${this.goKeySingle}_`)[1] as CharacterKey
  }

  getOrCreate(key: CharacterKey): ICachedCharacter {
    if (!this.keys.includes(key)) {
      this.set(key, initialCharacterData(key))
    }
    return this.get(key) as ICachedCharacter
  }

  // hasDup(char: ICharacter, isSro: boolean) {
  //   const db = this.getStorage(char.key)
  //   if (!db) return false
  //   if (isSro) {
  //     return JSON.stringify(db) === JSON.stringify(char)
  //   } else {
  //     let {
  //       key,
  //       level,
  //       eidolon,
  //       ascension,
  //       basic,
  //       skill,
  //       ult,
  //       talent,
  //       bonusAbilities,
  //       statBoosts,
  //     } = db
  //     const dbSr = {
  //       key,
  //       level,
  //       eidolon,
  //       ascension,
  //       basic,
  //       skill,
  //       ult,
  //       talent,
  //       bonusAbilities,
  //       statBoosts,
  //     }
  //     ;({
  //       key,
  //       level,
  //       eidolon,
  //       ascension,
  //       basic,
  //       skill,
  //       ult,
  //       talent,
  //       bonusAbilities,
  //       statBoosts,
  //     } = char)
  //     const charSr = {
  //       key,
  //       level,
  //       eidolon,
  //       ascension,
  //       basic,
  //       skill,
  //       ult,
  //       talent,
  //       bonusAbilities,
  //       statBoosts,
  //     }
  //     return JSON.stringify(dbSr) === JSON.stringify(charSr)
  //   }
  // }
  triggerCharacter(key: CharacterKey, reason: TriggerString) {
    this.trigger(key, reason, this.get(key))
  }

  override remove(key: CharacterKey): ICachedCharacter | undefined {
    const char = this.get(key)
    if (!char) return undefined
    for (const discKey of Object.values(char.equippedDiscs)) {
      const disc = this.database.discs.get(discKey)
      if (discKey && disc && disc.location === key)
        this.database.discs.setCached(discKey, { ...disc, location: '' })
    }
    return super.remove(key)
  }

  /**
   * **Caution**:
   * This does not update the `location` on disc
   * This function should be use internally for database to maintain cache on ICachedCharacter.
   */
  setEquippedDisc(key: CharacterKey, slotKey: DiscSlotKey, discId: string) {
    const char = super.get(key)
    if (!char) return
    const equippedDiscs = deepClone(char.equippedDiscs)
    equippedDiscs[slotKey] = discId
    super.setCached(key, { ...char, equippedDiscs })
  }
}

export function initialCharacterData(key: CharacterKey): ICachedCharacter {
  return {
    key,
    level: 60,
    core: 6,
    promotion: 5,
    mindscape: 0,
    potential: 5,
    dodge: 11,
    basic: 11,
    chain: 11,
    special: 11,
    assist: 11,
    wengineKey: '',
    wenginePhase: 1,
    equippedDiscs: objKeyMap(allDiscSlotKeys, () => ''),
  }
}
