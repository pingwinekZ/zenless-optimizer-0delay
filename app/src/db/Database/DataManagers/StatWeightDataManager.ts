import { deepFreeze } from '@zenless-optimizer/common/util'
import { z } from 'zod'
import type { CharacterKey } from '../../../consts'
import type { ZzzDatabase } from '../Database'
import { DataManager } from '../DataManager'

export type StatWeightOverride = {
  substatWeights: Partial<Record<string, number | null>>
  mainStats: Partial<Record<string, string[]>>
}

const initWeightOverride: StatWeightOverride = deepFreeze({
  substatWeights: {},
  mainStats: {},
})

const weightOverrideSchema = z.object({
  substatWeights: z.record(z.string(), z.number().nullable().optional()),
  mainStats: z.record(z.string(), z.array(z.string())),
})

export class StatWeightDataManager extends DataManager<
  CharacterKey,
  'statWeights',
  StatWeightOverride,
  StatWeightOverride
> {
  constructor(database: ZzzDatabase) {
    super(database, 'statWeights')
  }
  override validate(obj: unknown): StatWeightOverride | undefined {
    const result = weightOverrideSchema.safeParse(obj)
    return result.success ? result.data : undefined
  }

  override toStorageKey(key: string): string {
    return `${this.goKeySingle}_${key}`
  }
  override toCacheKey(key: string): CharacterKey {
    return key.split(`${this.goKeySingle}_`)[1] as CharacterKey
  }

  override get(key: CharacterKey): StatWeightOverride {
    return this.data[key] ?? initWeightOverride
  }

  resetCharacter(key: CharacterKey) {
    this.set(key, { substatWeights: {}, mainStats: {} })
  }

  resetAll() {
    for (const key of Object.keys(this.data)) {
      this.set(key as CharacterKey, {
        substatWeights: {},
        mainStats: {},
      })
    }
  }
}
