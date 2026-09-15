import { zodTypedRecord } from '@zenless-optimizer/common/database'
import { objKeyMap } from '@zenless-optimizer/common/util'
import { z } from 'zod'
import { allDiscSlotKeys } from '../../../consts'
import type { DiscIds, ZzzDatabase } from '../..'
import { DataManager } from '../DataManager'

const discIdValueSchema = z.union([z.string(), z.undefined()])
// JSON drops undefined values, so stored discIds may omit empty slots.
// Fill them before validation, otherwise entries with empty slots vanish.
const discIdsSchema = z.preprocess(
  (v) => ({
    ...objKeyMap(allDiscSlotKeys, () => undefined),
    ...((v ?? {}) as Record<string, string | undefined>),
  }),
  zodTypedRecord(allDiscSlotKeys, discIdValueSchema)
) as z.ZodType<DiscIds>

const generatedBuildSchema = z.object({
  value: z.number(),
  wengineKey: z.string().optional(),
  discIds: discIdsSchema,
})

export type GeneratedBuild = z.infer<typeof generatedBuildSchema>

const generatedBuildListSchema = z.object({
  builds: z.array(generatedBuildSchema).catch([]),
  buildDate: z.number().int().catch(0),
})

export type GeneratedBuildList = z.infer<typeof generatedBuildListSchema>

/**
 * How many generated builds are kept in storage per optimizer result set.
 *
 * The solver can return up to `maxBuildsToShow` rows (as many as 50000), and
 * the whole list is regenerable by re-running the optimizer, so persisting all
 * of them - for every character - is one of the fastest ways to exhaust the
 * 5MB localStorage budget. The full list stays in memory and in exports; only
 * the stored copy is capped, so a reload restores the top rows of the last
 * run instead of all of it.
 */
export const maxPersistedGeneratedBuilds = 100

export class GeneratedBuildListDataManager extends DataManager<
  string,
  'generatedBuildList',
  GeneratedBuildList,
  GeneratedBuildList
> {
  constructor(database: ZzzDatabase) {
    super(database, 'generatedBuildList')
  }
  override validate(obj: unknown): GeneratedBuildList | undefined {
    const result = generatedBuildListSchema.safeParse(obj)
    if (!result.success) return undefined

    const { builds: rawBuilds, buildDate } = result.data

    // Validate builds with database lookups
    const builds: GeneratedBuild[] = rawBuilds.map((build) => {
      const { discIds: discIdsRaw, value } = build
      let { wengineKey } = build

      // Validate wengineKey is a valid key
      if (wengineKey && !this.database.wengines.get(wengineKey))
        wengineKey = undefined

      // Validate discIds - ensure each disc exists and matches its slot
      // Synthetic theoretical discs (prefixed with 'theoretical_') bypass the
      // database lookup since they exist only in React state.
      const discIds = objKeyMap(allDiscSlotKeys, (slotKey) => {
        const id = discIdsRaw[slotKey]
        if (!id) return undefined
        if (id.startsWith('theoretical_') || id.startsWith('recipe_')) return id
        return this.database.discs.get(id)?.slotKey === slotKey ? id : undefined
      })

      return { discIds, wengineKey, value }
    })

    return {
      builds,
      buildDate,
    }
  }
  override saveStorageEntry(key: string, cached: GeneratedBuildList): void {
    super.saveStorageEntry(
      key,
      cached.builds.length > maxPersistedGeneratedBuilds
        ? {
            ...cached,
            builds: cached.builds.slice(0, maxPersistedGeneratedBuilds),
          }
        : cached
    )
  }

  new(data: GeneratedBuildList) {
    const id = this.generateKey()
    this.set(id, { ...data })
    return id
  }
}
