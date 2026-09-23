import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { isWengineKey } from '@zenless-optimizer/zzz/consts'
import type { ZzzDatabase } from '@zenless-optimizer/zzz/db'
import {
  BuildSource,
  type ICharacter,
  type SavedBuild,
} from '@zenless-optimizer/zzz/zood'
import type { EquippedSelection } from './buildConverter'
import {
  deserializeBuild,
  serializeFromCharacterTab,
  serializeFromOptimizer,
} from './buildConverter'

/** Upsert a build onto its character (HSR parity: keyed by name). */
export function saveBuild(
  database: ZzzDatabase,
  opts: {
    name: string
    characterKey: CharacterKey
    optConfigId: string
    source: BuildSource
    overwrite: boolean
    equipped?: EquippedSelection
  }
): { error?: string } {
  const { name, characterKey, optConfigId, source, overwrite } = opts
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required' }
  const char = database.chars.get(characterKey)
  if (!char) return { error: 'No character selected' }

  let build: SavedBuild
  if (source === BuildSource.Optimizer) {
    const team = database.teams.get(characterKey)
    const optConfig = database.optConfigs.get(optConfigId)
    const equipped = opts.equipped ?? {
      discIds: { ...char.equippedDiscs },
      wengineKey: char.wengineKey || undefined,
    }
    build = serializeFromOptimizer(
      trimmed,
      characterKey,
      char,
      team,
      optConfig,
      equipped,
      {
        main: {
          wengineKey: char.wengineKey,
          wenginePhase: char.wenginePhase,
          mindscape: char.mindscape,
          discIds: { ...equipped.discIds },
        },
        of: (key) => {
          const mate = database.chars.get(key)
          if (!mate) return undefined
          return {
            wengineKey: mate.wengineKey,
            wenginePhase: mate.wenginePhase,
            mindscape: mate.mindscape,
            discIds: { ...mate.equippedDiscs },
          }
        },
      }
    )
  } else {
    build = serializeFromCharacterTab(trimmed, characterKey, char)
  }

  const builds = [...(char.builds ?? [])]
  const idx = builds.findIndex((b) => b.name === trimmed)
  if (overwrite) {
    if (idx === -1) return { error: `No matching build "${trimmed}"` }
    builds[idx] = { ...build, createdAt: builds[idx].createdAt }
  } else {
    if (idx !== -1) return { error: `Build "${trimmed}" already exists` }
    builds.push(build)
  }
  database.chars.set(characterKey, { builds })
  return {}
}

/**
 * Load a saved build into the optimizer: character setup (max mindscape,
 * flexible W-Engine), team snapshot (teammates, frames incl. combo state,
 * enemy stats), optimizer settings, and a single-row results list.
 */
export function loadBuildInOptimizer(
  database: ZzzDatabase,
  build: SavedBuild,
  opts: { characterKey: CharacterKey; optConfigId: string }
): void {
  const { characterKey, optConfigId } = opts
  const char = database.chars.getOrCreate(characterKey)
  const team = database.teams.get(characterKey)
  const patch = deserializeBuild(build, characterKey, { char, team })

  database.chars.set(characterKey, patch.charPatch)

  if (patch.teamPatch) {
    database.teams.set(characterKey, {
      teammates: patch.teamPatch.teammates,
      frames: patch.teamPatch.frames,
      enemyLvl: patch.teamPatch.enemyLvl,
      enemyDef: patch.teamPatch.enemyDef,
      enemyStunMultiplier: patch.teamPatch.enemyStunMultiplier,
    })
    // Restore save-time teammate setup (slots 1-2; slot 0 is the main
    // character, handled by charPatch). W-Engines are plain references and
    // mindscapes merge upward nowhere, so these mirror the saved values.
    // Disc locations are intentionally untouched — moving discs is Equip's
    // job, for the main character and teammates alike.
    for (const mate of patch.teamPatch.teammates.slice(1)) {
      if (!mate?.characterKey) continue
      const update: Partial<
        Pick<ICharacter, 'wengineKey' | 'wenginePhase' | 'mindscape'>
      > = {}
      if (mate.wengineKey && isWengineKey(mate.wengineKey))
        update.wengineKey = mate.wengineKey
      if (mate.wenginePhase !== undefined)
        update.wenginePhase = mate.wenginePhase
      if (mate.mindscape !== undefined) update.mindscape = mate.mindscape
      if (Object.keys(update).length > 0) {
        database.chars.getOrCreate(mate.characterKey)
        database.chars.set(mate.characterKey, update)
      }
    }
  }

  if (patch.optimizerSettings)
    database.optConfigs.set(optConfigId, patch.optimizerSettings)

  if (patch.generatedBuild)
    database.optConfigs.newOrSetGeneratedBuildList(optConfigId, {
      builds: [patch.generatedBuild],
      buildDate: Date.now(),
    })
}

export type EquipConflict = {
  discId: string
  slotKey: string
  owner: string
}

/** Discs that belong to another character (HSR `stealsRelics` parity). */
export function buildEquipConflicts(
  database: ZzzDatabase,
  characterKey: CharacterKey,
  build: SavedBuild
): EquipConflict[] {
  const conflicts: EquipConflict[] = []
  for (const [slotKey, discId] of Object.entries(build.discIds)) {
    if (!discId) continue
    const disc = database.discs.get(discId)
    if (disc?.location && disc.location !== characterKey)
      conflicts.push({ discId, slotKey, owner: disc.location })
  }
  return conflicts
}

/** Equip a build's discs + W-Engine onto the character. */
export function equipBuild(
  database: ZzzDatabase,
  characterKey: CharacterKey,
  build: SavedBuild
): void {
  for (const discId of Object.values(build.discIds)) {
    if (!discId) continue
    const disc = database.discs.get(discId)
    if (disc) database.discs.set(discId, { location: characterKey })
  }
  const wengineKey = build.wengineSetup?.wengineKey ?? build.wengineKey ?? ''
  database.chars.set(characterKey, {
    wengineKey: isWengineKey(wengineKey) ? wengineKey : '',
    wenginePhase:
      build.wengineSetup?.wenginePhase ??
      database.chars.get(characterKey)?.wenginePhase ??
      1,
  })
}

export function deleteBuild(
  database: ZzzDatabase,
  characterKey: CharacterKey,
  name: string
): void {
  const char = database.chars.get(characterKey)
  if (!char) return
  database.chars.set(characterKey, {
    builds: (char.builds ?? []).filter((b) => b.name !== name),
  })
}

export function clearBuilds(
  database: ZzzDatabase,
  characterKey: CharacterKey
): void {
  const char = database.chars.get(characterKey)
  if (!char) return
  database.chars.set(characterKey, { builds: [] })
}
