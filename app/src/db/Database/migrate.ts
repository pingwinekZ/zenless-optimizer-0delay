// MIGRATION STEP
// 0. DO NOT change old `migrateVersion` calls
// 1. Add new `migrateVersion` call within `migrateSr` function
// 2. Add new `migrateVersion` call within `migrateStorage` function
// 3. Update `currentDBVersion`
// 4. Test on import, and also on version update

import type { DBStorage } from '@zenless-optimizer/common/database'
import type { CharacterKey } from '../../consts'
import type { ICharacter } from '../../zood'
import type {
  ICharMeta,
  IZenlessObjectDescription,
  IZZZDatabase,
} from '../Interfaces'

export const currentDBVersion = 3

export function migrateZOOD(
  zood: IZenlessObjectDescription & IZZZDatabase
): IZenlessObjectDescription & IZZZDatabase {
  const version = zood.dbVersion ?? 0
  function migrateVersion(version: number, cb: () => void) {
    const dbver = zood.dbVersion ?? 0
    if (dbver < version) {
      cb()
      // Update version upon each successful migration, so we don't
      // need to migrate that part again if later parts fail.
      zood.dbVersion = version
    }
  }

  // Change code name keys to char name keys
  migrateVersion(2, () => {
    function migrateData(oldKey: string, newKey: CharacterKey) {
      const chars = zood['characters'] as ICharacter[]
      if (chars) {
        const char = chars.find((c) => (c.key as string) === oldKey)
        if (char) {
          char.key = newKey
          ;(char as any).id = newKey
        }
      }

      const charMetas = zood['charMetas'] as ICharMeta[]
      if (charMetas) {
        const charMeta = charMetas.find(
          (c) => ((c as any)['id'] as string) === oldKey
        )
        if (charMeta) {
          ;(charMeta as any)['id'] = newKey
        }
      }

      const discs = zood.discs
      if (discs) {
        discs
          .filter((disc) => (disc.location as string) === oldKey)
          .forEach((disc) => (disc.location = newKey))
      }

      const weng = zood['wengines'] as any[]
      if (weng) {
        weng
          .filter((weng: any) => (weng.location as string) === oldKey)
          .forEach((weng: any) => (weng.location = newKey))
      }
    }
    migrateData('Astra', 'AstraYao')
    migrateData('QingYi', 'Qingyi')
  })

  // Migrate equippedWengine → wengineKey/wenginePhase
  migrateVersion(3, () => {
    const chars = zood['characters'] as (ICharacter & {
      equippedWengine?: string
    })[]
    if (chars) {
      for (const char of chars) {
        // 'equippedWengine' was a string ID; we can't resolve key from ID
        // so we clear it. Exporters may already provide wengineKey/wenginePhase
        // (e.g. zzz_packet_capture) - keep those. If a character has neither,
        // leave the fields absent so replace-semantics imports preserve the
        // previously imported value instead of wiping it (the capturer omits
        // them when the engines category is disabled in its export settings).
        if ('equippedWengine' in char) {
          delete (char as any).equippedWengine
          char.wengineKey ??= ''
          char.wenginePhase ??= 1
        }
      }
    }
    // Remove old wengine instances (they become catalog entries)
    delete zood['wengines']
  })

  zood.dbVersion = currentDBVersion
  if (version > currentDBVersion)
    throw new Error(`Database version ${version} is not supported`)
  return zood
}

/**
 * Migrate parsed data in `storage` in-place to a parsed data of the latest supported DB version.
 *
 * **CAUTION**
 * Throw an error if `storage` uses unsupported DB version.
 */
export function migrateStorage(storage: DBStorage) {
  const version = storage.getDBVersion()

  function migrateVersion(version: number, cb: () => void) {
    const dbver = storage.getDBVersion()
    if (dbver < version) {
      cb()
      // Update version upon each successful migration, so we don't
      // need to migrate that part again if later parts fail.
      storage.setDBVersion(version)
    }
  }

  migrateVersion(2, () => {
    function migrateData(oldKey: string, newKey: CharacterKey) {
      const keys = storage.keys
      for (const key of keys) {
        if (key === `zzz_character_${oldKey}`) {
          const astra = storage.get(key)
          astra.key = newKey
          storage.set(`zzz_character_${newKey}`, astra)
          storage.remove(`zzz_character_${oldKey}`)
        }
        if (key === `zzz_charOpt_${oldKey}`) {
          const astra = storage.get(key)
          astra.id = newKey

          if (astra.target?.sheet === oldKey) {
            astra.target.sheet = newKey
          }

          if (astra.conditionals) {
            astra.conditionals
              .filter((c: any) => c.src === oldKey)
              .forEach((c: any) => (c.src = newKey))
          }

          storage.set(`zzz_charOpt_${newKey}`, astra)
          storage.remove(`zzz_charOpt_${oldKey}`)
        }
        if (key === `zzz_charMeta_${oldKey}`) {
          const astra = storage.get(key)
          astra.id = newKey
          storage.set(`zzz_charMeta_${newKey}`, astra)
          storage.remove(`zzz_charMeta_${oldKey}`)
        }
        if (key.startsWith('zzz_disc_')) {
          const disc = storage.get(key)
          if (disc.location === oldKey) {
            disc.location = newKey
            storage.set(key, disc)
          }
        }
        if (key.startsWith('zzz_wengine_')) {
          const weng = storage.get(key) as any
          if (weng?.location === oldKey) {
            weng.location = newKey
            storage.set(key, weng)
          }
        }
      }
    }
    migrateData('Astra', 'AstraYao')
    migrateData('QingYi', 'Qingyi')
  })

  migrateVersion(3, () => {
    const keys = storage.keys
    for (const key of keys) {
      if (key.startsWith('zzz_character_')) {
        const char = storage.get(key)
        if (char && 'equippedWengine' in char) {
          delete char.equippedWengine
          char.wengineKey = ''
          char.wenginePhase = 1
          storage.set(key, char)
        }
      }
      // Remove old wengine entries (they become catalog)
      if (key.startsWith('zzz_wengine_')) {
        storage.remove(key)
      }
    }
  })

  storage.setDBVersion(currentDBVersion)
  if (version > currentDBVersion)
    throw new Error(`Database version ${version} is not supported`)
}
