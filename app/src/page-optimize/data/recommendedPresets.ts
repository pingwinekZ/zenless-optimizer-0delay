import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSetKey,
  DiscSlotKey,
} from '../../consts'
import type { StatFilter, TargetTag } from '../../db'

export type RecommendedPreset = {
  id: string
  name: string
  description?: string
  /** Optimization target applied to the team's first frame */
  target: TargetTag
  /** Allowed 2-piece disc sets (disc set filter) */
  setFilter2: DiscSetKey[]
  /** Allowed 4-piece disc sets (disc set filter) */
  setFilter4: DiscSetKey[]
  /** Allowed disc main stats per slot (slots 4/5/6 filters) */
  mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
  /** Stat min/max filters (INITIAL/FINAL) to merge into the current config */
  statFilters: StatFilter[]
}

export const recommendedPresets: Partial<
  Record<CharacterKey, RecommendedPreset[]>
> = {
  Remielle: [
    {
      id: 'remielle-rainbows-end',
      name: 'Max ATK buff, Luminize DMG',
      description: 'Feathered Fate 4pc + Anomaly Proficiency 2pc',
      target: {
        sheet: 'Remielle',
        name: 'luminizeRainbowsEndDmgInst',
      },
      setFilter4: ['FeatheredFate'],
      setFilter2: ['ChaosJazz', 'FreedomBlues'],
      mainStats: {
        4: ['atk_', 'anomProf'],
        5: ['atk_'],
        6: ['atk_'],
      },
      statFilters: [
        {
          tag: { q: 'atk', qt: 'initial' },
          value: 4000,
          isMax: false,
          disabled: false,
        },
      ],
    },
  ],
}

export function getRecommendedPresets(
  characterKey: CharacterKey
): RecommendedPreset[] {
  return recommendedPresets[characterKey] ?? []
}

/**
 * Merge preset stat filters into the current config's filters.
 * Entries matching by stat key + qt + min/max are replaced; all other
 * user-configured filters are preserved.
 */
export function mergeStatFilters(
  current: StatFilter[],
  preset: StatFilter[]
): StatFilter[] {
  const result = [...current]
  for (const presetFilter of preset) {
    const { q, qt } = presetFilter.tag
    const index = result.findIndex(
      (f) => f.tag.q === q && f.tag.qt === qt && f.isMax === presetFilter.isMax
    )
    if (index >= 0) result[index] = presetFilter
    else result.push(presetFilter)
  }
  return result
}
