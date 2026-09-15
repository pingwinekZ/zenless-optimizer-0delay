import { zodTypedRecord } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { z } from 'zod'
import { allDiscSlotKeys } from '../consts'
import type { DiscIds } from '../db/Interfaces/IDbDisc'

export enum BuildSource {
  Character = 'character',
  Optimizer = 'optimizer',
}

const discIdValueSchema = z.union([z.string(), z.undefined()])
// JSON drops undefined values, so stored discIds may omit empty slots.
// Fill them before validation.
const discIdsSchema = z.preprocess(
  (v) => ({
    ...objKeyMap(allDiscSlotKeys, () => undefined),
    ...((v ?? {}) as Record<string, string | undefined>),
  }),
  zodTypedRecord(allDiscSlotKeys, discIdValueSchema)
) as z.ZodType<DiscIds>

const charSetupSchema = z.object({
  level: z.number().int(),
  promotion: z.number().int(),
  mindscape: z.number().int(),
  core: z.number().int(),
  dodge: z.number().int(),
  basic: z.number().int(),
  chain: z.number().int(),
  special: z.number().int(),
  assist: z.number().int(),
})

const wengineSetupSchema = z.object({
  wengineKey: z.string(),
  wenginePhase: z.number().int(),
})

// Frames carry the full combo state (frames[0].tag.{rotation, comboType,
// comboKind, comboStateJson}) plus conditionals/bonusStats. They are
// validated strictly when applied via TeamDataManager, so the stored shape
// is intentionally loose here to stay forward-compatible.
const teamSnapshotSchema = z.object({
  teammates: z.array(z.any()).optional(),
  frames: z.array(z.any()).optional(),
  enemyLvl: z.number().optional(),
  enemyDef: z.number().optional(),
  enemyStunMultiplier: z.number().optional(),
})

export const savedBuildSchema = z.object({
  name: z.string(),
  source: z.nativeEnum(BuildSource).catch(BuildSource.Optimizer),
  characterKey: z.string(),
  discIds: discIdsSchema,
  wengineKey: z.string().optional(),
  charSetup: charSetupSchema.optional(),
  wengineSetup: wengineSetupSchema.optional(),
  // Optimization result value; absent when saved from the bare form
  value: z.number().optional(),
  description: z.string().optional(),
  // Full optimizer settings snapshot (used when loading a build back)
  optimizerSettings: z.record(z.string(), z.any()).optional(),
  // Team snapshot: teammates with overrides, frames with conditionals,
  // bonus stats and combo state, enemy data
  teamSnapshot: teamSnapshotSchema.optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
})

export type SavedBuild = z.infer<typeof savedBuildSchema>
export type SavedBuildTeamSnapshot = z.infer<typeof teamSnapshotSchema>
export type SavedBuildCharSetup = z.infer<typeof charSetupSchema>
export type SavedBuildWengineSetup = z.infer<typeof wengineSetupSchema>

/**
 * Per-teammate gear captured at save time (HSR parity: SavedTeammate carries
 * eidolon + lightCone + sets). Stored on teamSnapshot.teammates entries,
 * which are otherwise loosely typed, so old builds without gear simply
 * fall back to live database state.
 */
export type SavedTeammateGear = {
  wengineKey?: string
  wenginePhase?: number
  mindscape?: number
  discIds?: DiscIds
}

export function parseSavedBuild(obj: unknown): SavedBuild | undefined {
  const result = savedBuildSchema.safeParse(obj)
  return result.success ? result.data : undefined
}
