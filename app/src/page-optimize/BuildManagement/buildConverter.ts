import type {
  CharacterKey,
  MilestoneKey,
  WengineKey,
} from '@zenless-optimizer/zzz/consts'
import { isWengineKey } from '@zenless-optimizer/zzz/consts'
import type {
  DiscIds,
  GeneratedBuild,
  ICachedCharacter,
  OptConfig,
  Team,
  TeammateDatum,
} from '@zenless-optimizer/zzz/db'
import {
  BuildSource,
  type SavedBuild,
  type SavedBuildTeamSnapshot,
  type SavedTeammateGear,
} from '@zenless-optimizer/zzz/zood'
import type { BuildPreviewOverride } from '../../page-characters/CharacterPreview'

export type EquippedSelection = {
  discIds: DiscIds
  wengineKey?: string
  value?: number
}

/** A team member with its save-time gear attached. */
export type SnapshottedTeammate = TeammateDatum & SavedTeammateGear

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

function snapshotTeam(
  team: Team | undefined,
  gear?: {
    /** Save-time gear of the main character (slot 0). */
    main: SavedTeammateGear
    /** Save-time gear of a teammate by character key. */
    of: (key: CharacterKey) => SavedTeammateGear | undefined
  }
): SavedBuildTeamSnapshot {
  if (!team) return {}
  return {
    teammates: team.teammates.map((member, i) => {
      const saved = i === 0 ? gear?.main : gear?.of(member.characterKey)
      const clone = structuredClone(member) as SnapshottedTeammate
      if (!saved) return clone
      if (saved.wengineKey !== undefined) clone.wengineKey = saved.wengineKey
      if (saved.wenginePhase !== undefined)
        clone.wenginePhase = clone.wenginePhase ?? saved.wenginePhase
      if (saved.mindscape !== undefined)
        clone.mindscape = clone.mindscape ?? saved.mindscape
      if (saved.discIds) clone.discIds = structuredClone(saved.discIds)
      return clone
    }),
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
  equipped: EquippedSelection,
  teammateGear?: {
    main: SavedTeammateGear
    of: (key: CharacterKey) => SavedTeammateGear | undefined
  }
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
    teamSnapshot: snapshotTeam(team, teammateGear),
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
  /** Team patch (teammates with save-time gear, frames incl. combo, enemy stats). */
  teamPatch?: {
    teammates: SnapshottedTeammate[]
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
          teammates: structuredClone(teammates) as SnapshottedTeammate[],
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

/**
 * Build a read-only preview override for the showcase CharacterPreview from
 * a saved build (HSR parity: CharacterPreview + savedBuildOverride).
 * Everything is shown exactly as saved — unlike the load path, nothing is
 * max-merged against the live character.
 */
export function previewOverrideFromBuild(
  characterKey: CharacterKey,
  current: { char?: ICachedCharacter; team?: Team },
  build: SavedBuild
): BuildPreviewOverride | null {
  const { char, team } = current
  const setup = build.charSetup
  if (!char && !setup) return null

  const wengineKey = build.wengineSetup?.wengineKey ?? build.wengineKey ?? ''
  const character: ICachedCharacter = {
    key: characterKey,
    level: setup?.level ?? char?.level ?? 60,
    promotion: (setup?.promotion ?? char?.promotion ?? 5) as MilestoneKey,
    mindscape: setup?.mindscape ?? char?.mindscape ?? 0,
    core: setup?.core ?? char?.core ?? 0,
    dodge: setup?.dodge ?? char?.dodge ?? 1,
    basic: setup?.basic ?? char?.basic ?? 1,
    chain: setup?.chain ?? char?.chain ?? 1,
    special: setup?.special ?? char?.special ?? 1,
    assist: setup?.assist ?? char?.assist ?? 1,
    wengineKey: (isWengineKey(wengineKey) ? wengineKey : '') as WengineKey | '',
    wenginePhase: build.wengineSetup?.wenginePhase ?? 1,
    builds: char?.builds ?? [],
    equippedDiscs: structuredClone(build.discIds),
  }

  const snap = build.teamSnapshot
  const previewTeam: Team = {
    teammates: (snap?.teammates?.length
      ? structuredClone(snap.teammates)
      : team
        ? structuredClone(team.teammates)
        : [{ characterKey }]) as TeammateDatum[],
    frames: structuredClone(
      snap?.frames ?? team?.frames ?? []
    ) as Team['frames'],
    enemyLvl: snap?.enemyLvl ?? team?.enemyLvl ?? 80,
    enemyDef: snap?.enemyDef ?? team?.enemyDef ?? 953,
    enemyStunMultiplier:
      snap?.enemyStunMultiplier ?? team?.enemyStunMultiplier ?? 150,
  }

  // Save-time teammate gear for the calculator (slots 1-2; slot 0 is the
  // main character, already covered by the character override).
  const teammateGear: Record<string, SavedTeammateGear> = {}
  for (const member of previewTeam.teammates.slice(
    1
  ) as SnapshottedTeammate[]) {
    if (!member?.characterKey) continue
    if (member.wengineKey !== undefined || member.discIds !== undefined)
      teammateGear[member.characterKey] = {
        ...(member.wengineKey !== undefined && {
          wengineKey: member.wengineKey,
        }),
        ...(member.discIds !== undefined && {
          discIds: structuredClone(member.discIds),
        }),
      }
  }

  return {
    character,
    team: previewTeam,
    discIds: structuredClone(build.discIds),
    ...(Object.keys(teammateGear).length > 0 && { teammateGear }),
  }
}
