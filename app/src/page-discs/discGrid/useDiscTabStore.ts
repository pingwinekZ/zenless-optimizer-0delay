import { create } from 'zustand'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'

export type ValueColumnField = 'scoreCurrent' | 'scoreMaxPotential'

export const allValueColumnFields: ValueColumnField[] = [
  'scoreCurrent',
  'scoreMaxPotential',
]

export const defaultValueColumns: ValueColumnField[] = [
  'scoreCurrent',
  'scoreMaxPotential',
]

export type DiscTabFilters = {
  slot: DiscSlotKey[]
  set: DiscSetKey[]
  rarity: DiscRarityKey[]
  level: number[]
  equipped: boolean[]
  mainStat: DiscMainStatKey[]
  subStat: DiscSubStatKey[]
}

const defaultFilters: DiscTabFilters = {
  slot: [],
  set: [],
  rarity: [],
  level: [],
  equipped: [],
  mainStat: [],
  subStat: [],
}

interface DiscTabStateValues {
  focusCharacter: CharacterKey | null
  selectedDiscId: string | null
  selectedDiscsIds: string[]
  valueColumns: ValueColumnField[]
  excludedCharacters: CharacterKey[]
  filters: DiscTabFilters
}

interface DiscTabStateActions {
  setFocusCharacter: (character: CharacterKey | null) => void
  setSelectedDiscsIds: (ids: string[]) => void
  setValueColumns: (cols: ValueColumnField[]) => void
  setExcludedCharacters: (characters: CharacterKey[]) => void
  setFilters: (filters: DiscTabFilters) => void
  setFilter: <K extends keyof DiscTabFilters>(
    key: K
  ) => (value: DiscTabFilters[K]) => void
  resetFilters: () => void
}

type DiscTabState = DiscTabStateActions & DiscTabStateValues

const useDiscTabStoreBase = create<DiscTabState>((set, get) => ({
  focusCharacter: null,
  selectedDiscId: null,
  selectedDiscsIds: [],
  valueColumns: defaultValueColumns,
  excludedCharacters: [],
  filters: {
    slot: [],
    set: [],
    rarity: [],
    level: [],
    equipped: [],
    mainStat: [],
    subStat: [],
  },
  setFocusCharacter: (focusCharacter) => set({ focusCharacter }),
  setSelectedDiscsIds: (ids) => {
    const newSelectedId = ids.at(-1) ?? null
    const currentIds = get().selectedDiscsIds
    if (
      newSelectedId === get().selectedDiscId &&
      ids.length === currentIds.length &&
      ids.every((id, i) => id === currentIds[i])
    )
      return
    set({ selectedDiscId: newSelectedId, selectedDiscsIds: [...ids] })
  },
  setValueColumns: (cols) => set({ valueColumns: [...cols] }),
  setExcludedCharacters: (characters) =>
    set({ excludedCharacters: [...characters] }),
  setFilters: (filters) => set({ filters }),
  setFilter: (key) => (value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: cloneFilters(defaultFilters) }),
}))

function cloneFilters(filters: DiscTabFilters): DiscTabFilters {
  return {
    slot: [...filters.slot],
    set: [...filters.set],
    rarity: [...filters.rarity],
    level: [...filters.level],
    equipped: [...filters.equipped],
    mainStat: [...filters.mainStat],
    subStat: [...filters.subStat],
  }
}

export const useDiscTabStore = useDiscTabStoreBase
