import { zodTypedRecord } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { z } from 'zod'
import { allDiscSlotKeys } from '../../../consts'
import type { DiscIds, ZzzDatabase } from '../..'
import { DataManager } from '../DataManager'

const discIdValueSchema = z.union([z.string(), z.undefined()])
const discIdsSchema = zodTypedRecord(
  allDiscSlotKeys,
  discIdValueSchema
) as z.ZodType<DiscIds>

const teamSnapshotSchema = z.object({
  teammates: z.array(z.any()).optional(),
  frames: z.array(z.any()).optional(),
  enemyLvl: z.number().optional(),
  enemyDef: z.number().optional(),
  enemyStunMultiplier: z.number().optional(),
})

const savedBuildSchema = z.object({
  name: z.string(),
  value: z.number(),
  wengineKey: z.string().optional(),
  discIds: discIdsSchema,
  characterKey: z.string(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  description: z.string().optional(),

  // Full optimizer settings snapshot (used when loading a build back)
  optimizerSettings: z.record(z.string(), z.any()).optional(),
  // Team snapshot: teammates with overrides, frames with conditionals/bonus stats, enemy data
  teamSnapshot: teamSnapshotSchema.optional(),
})

export type SavedBuild = z.infer<typeof savedBuildSchema>
export type SavedBuildTeamSnapshot = z.infer<typeof teamSnapshotSchema>

export class SavedBuildDataManager extends DataManager<
  string,
  'savedBuilds',
  SavedBuild,
  SavedBuild
> {
  constructor(database: ZzzDatabase) {
    super(database, 'savedBuilds')
  }
  override validate(obj: unknown): SavedBuild | undefined {
    const result = savedBuildSchema.safeParse(obj)
    if (!result.success) return undefined

    const build = result.data
    // Validate wengineKey exists in database
    if (build.wengineKey && !this.database.wengines.get(build.wengineKey))
      build.wengineKey = undefined

    // Validate discIds exist and match slots
    build.discIds = objKeyMap(allDiscSlotKeys, (slotKey) =>
      this.database.discs.get(build.discIds[slotKey])?.slotKey === slotKey
        ? build.discIds[slotKey]
        : undefined
    ) as DiscIds

    return build
  }
  new(
    data: Omit<SavedBuild, 'createdAt' | 'updatedAt'> & {
      createdAt?: number
      updatedAt?: number
    }
  ) {
    const id = this.generateKey()
    const now = Date.now()
    this.set(id, {
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    } as SavedBuild)
    return id
  }
  update(id: string, data: Partial<SavedBuild>) {
    const existing = this.get(id)
    if (!existing) return false
    return this.set(id, {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    })
  }
  /** Export a saved build as a plain JSON object for sharing/download */
  exportBuild(id: string): object | undefined {
    const build = this.get(id)
    if (!build) return undefined
    const { createdAt, updatedAt, ...rest } = build
    return { ...rest, exportVersion: 1 }
  }
  /** Import a saved build from JSON data */
  importBuild(data: unknown): string | undefined {
    const parsed = savedBuildSchema.safeParse(data)
    if (!parsed.success) return undefined
    return this.new(parsed.data)
  }
}
