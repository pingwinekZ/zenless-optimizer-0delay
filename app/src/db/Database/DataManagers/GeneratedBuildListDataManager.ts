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
  new(data: GeneratedBuildList) {
    const id = this.generateKey()
    this.set(id, { ...data })
    return id
  }
}
