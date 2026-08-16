import { zodTypedRecord } from '@zenless-optimizer/common/database'
import { z } from 'zod'
import { allDiscSlotKeys } from '../../../consts'
import type { DiscIds } from '../../Interfaces/IDbDisc'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

const discIdValueSchema = z.union([z.string(), z.undefined()])
const discIdsSchema = zodTypedRecord(
  allDiscSlotKeys,
  discIdValueSchema
) as z.ZodType<DiscIds>

const characterBuildSchema = z.object({
  name: z.string(),
  characterKey: z.string(),
  wengineKey: z.string(),
  wenginePhase: z.number().int().min(1).max(5),
  discIds: discIdsSchema,
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
})

export type CharacterBuild = z.infer<typeof characterBuildSchema>

export class CharacterBuildDataManager extends DataManager<
  string,
  'characterBuilds',
  CharacterBuild,
  CharacterBuild
> {
  constructor(database: ZzzDatabase) {
    super(database, 'characterBuilds')
  }
  override validate(obj: unknown): CharacterBuild | undefined {
    const result = characterBuildSchema.safeParse(obj)
    if (!result.success) return undefined
    return result.data
  }

  new(
    data: Omit<CharacterBuild, 'createdAt' | 'updatedAt'> & {
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
    } as CharacterBuild)
    return id
  }

  update(id: string, data: Partial<CharacterBuild>) {
    const existing = this.get(id)
    if (!existing) return false
    return this.set(id, {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    })
  }

  /**
   * Get all builds associated with a character key.
   */
  getByCharacterKey(characterKey: string): CharacterBuild[] {
    return this.values.filter((b) => b.characterKey === characterKey)
  }

  /**
   * Duplicate an existing build with a new name.
   */
  duplicate(id: string, newName: string): string | undefined {
    const existing = this.get(id)
    if (!existing) return undefined
    return this.new({
      ...existing,
      name: newName,
    })
  }
}
