import type { CharacterKey, MilestoneKey, WengineKey } from '../../consts'
import { isWengineKey } from '../../consts'
import type {
  DiscIds,
  GeneratedBuild,
  ICachedCharacter,
  OptConfig,
  Team,
  TeammateDatum,
} from '../../db'
import {
  BuildSource,
  type SavedBuild,
  type SavedBuildTeamSnapshot,
} from '../../zood'

export type EquippedSelection = {
  discIds: DiscIds
  wengineKey?: string
  value?: number
}

/** Max phase wins when the W-Engine matches, otherwise take the saved one. */
export function resolveFlexibleWengine(
  savedKey: string | undefined,
  savedPhase: number | undefined,
  currentKey: WengineKey | '',
  currentPhase: number
): { wengineKey: WengineKey | ''; wenginePhase: number } {
  if (!savedKey || !isWengineKey(savedKey))
    return { wengineKey: currentKey, wenginePhase: currentPhase }
  if (savedKey === currentKey)
    return {
      wengineKey: savedKey,
      wenginePhase: Math.max(savedPhase ?? 1, currentPhase),
    }
  return { wengineKey: savedKey, wenginePhase: savedPhase ?? 1 }
}

export function resolveMindscape(
  savedMindscape: number | undefined,
  currentMindscape: number
): number {
  return Math.max(savedMindscape ?? 0, currentMindscape)
}

function snapshotTeam(team: Team | undefined): SavedBuildTeamSnapshot {
  if (!team) return {}
  return {
    teammates: structuredClone(team.teammates),
    frames: structuredClone(team.frames),
    enemyLvl: team.enemyLvl,
    enemyDef: team.enemyDef,
    enemyStunMultiplier: team.enemyStunMultiplier,
  }
}

function snapshotOptimizerSettings(
  optConfig: OptConfig | undefined
): Partial<OptConfig> | undefined {
  if (!optConfig) return undefined
  // The results link is transient; everything else restores the form.
  const settings = { ...optConfig }
  delete settings.generatedBuildListId
  return settings
}

// Precondition: char is the character being saved.
export function serializeFromOptimizer(
  name: string,
  characterKey: CharacterKey,
  char: ICachedCharacter,
  team: Team | undefined,
  optConfig: OptConfig | undefined,
  equipped: EquippedSelection
): SavedBuild {
  const now = Date.now()
  return {
    name,
    source: BuildSource.Optimizer,
    characterKey,
    discIds: structuredClone(equipped.discIds),
    wengineKey: equipped.wengineKey,
    charSetup: {
      level: char.level,
      promotion: char.promotion,
      mindscape: char.mindscape,
      core: char.core,
      dodge: char.dodge,
      basic: char.basic,
      chain: char.chain,
      special: char.special,
      assist: char.assist,
    },
    wengineSetup: {
      wengineKey: char.wengineKey,
      wenginePhase: char.wenginePhase,
    },
    ...(equipped.value !== undefined && { value: equipped.value }),
    teamSnapshot: snapshotTeam(team),
    optimizerSettings: snapshotOptimizerSettings(optConfig),
    createdAt: now,
    updatedAt: now,
  }
}

export function serializeFromCharacterTab(
  name: string,
  characterKey: CharacterKey,
  char: ICachedCharacter
): SavedBuild {
  const now = Date.now()
  return {
    name,
    source: BuildSource.Character,
    characterKey,
    discIds: structuredClone(char.equippedDiscs),
    wengineKey: char.wengineKey || undefined,
    charSetup: {
      level: char.level,
      promotion: char.promotion,
      mindscape: char.mindscape,
      core: char.core,
      dodge: char.dodge,
      basic: char.basic,
      chain: char.chain,
      special: char.special,
      assist: char.assist,
    },
    wengineSetup: {
      wengineKey: char.wengineKey,
      wenginePhase: char.wenginePhase,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export type DeserializedBuild = {
  /** Character setup patch (mindscape already maxed against current). */
  charPatch: {
    level: number
    promotion: MilestoneKey
    mindscape: number
    core: number
    dodge: number
    basic: number
    chain: number
    special: number
    assist: number
    wengineKey: WengineKey | ''
    wenginePhase: number
  }
  /** Team patch (teammates, frames incl. combo, enemy stats). */
  teamPatch?: {
    teammates: TeammateDatum[]
    frames: Team['frames']
    enemyLvl: number
    enemyDef: number
    enemyStunMultiplier: number
  }
  optimizerSettings?: Partial<OptConfig>
  /** Single-row results list to display after load. */
  generatedBuild?: GeneratedBuild
}

export function deserializeBuild(
  build: SavedBuild,
  characterKey: CharacterKey,
  current: { char: ICachedCharacter; team?: Team }
): DeserializedBuild {
  const { char } = current
  const setup = build.charSetup
  const wengine = resolveFlexibleWengine(
    build.wengineSetup?.wengineKey ?? build.wengineKey,
    build.wengineSetup?.wenginePhase,
    char.wengineKey,
    char.wenginePhase
  )
  const charPatch = {
    level: setup?.level ?? char.level,
    promotion: (setup?.promotion ?? char.promotion) as typeof char.promotion,
    mindscape: resolveMindscape(setup?.mindscape, char.mindscape),
    core: setup?.core ?? char.core,
    dodge: setup?.dodge ?? char.dodge,
    basic: setup?.basic ?? char.basic,
    chain: setup?.chain ?? char.chain,
    special: setup?.special ?? char.special,
    assist: setup?.assist ?? char.assist,
    wengineKey: wengine.wengineKey,
    wenginePhase: wengine.wenginePhase,
  }

  const hasGear =
    Object.values(build.discIds).some((id) => id) || build.wengineKey
  const generatedBuild =
    build.value !== undefined || hasGear
      ? {
          discIds: structuredClone(build.discIds),
          ...(build.wengineKey && { wengineKey: build.wengineKey }),
          value: build.value ?? 0,
        }
      : undefined

  // Character-tab builds only restore setup + gear preview, never the
  // optimizer form (HSR parity).
  if (build.source === BuildSource.Character)
    return { charPatch, generatedBuild }

  const snap = build.teamSnapshot
  const teammates =
    snap?.teammates && snap.teammates.length > 0
      ? snap.teammates
      : [{ characterKey }]
  const teamPatch =
    snap && (snap.teammates || snap.frames)
      ? {
          teammates: structuredClone(teammates) as TeammateDatum[],
          frames: structuredClone(snap.frames ?? []) as Team['frames'],
          enemyLvl: snap.enemyLvl ?? 80,
          enemyDef: snap.enemyDef ?? 953,
          enemyStunMultiplier: snap.enemyStunMultiplier ?? 150,
        }
      : undefined

  return {
    charPatch,
    teamPatch,
    optimizerSettings: build.optimizerSettings
      ? { ...build.optimizerSettings }
      : undefined,
    generatedBuild,
  }
}
