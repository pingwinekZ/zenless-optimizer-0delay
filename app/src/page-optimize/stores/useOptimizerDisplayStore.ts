import { create } from 'zustand'
import type { DiscIds } from '../../db'
import { initialMenuState } from '../layout/optimizerMenuIds'

export interface PinnedBuild {
  buildId: string // composite id from OptimizerGrid row
  index: number
  value: number
  wengineKey?: string
  discIds: DiscIds
}

interface OptimizerDisplayState {
  menuState: Record<string, boolean>
  setMenuState: (menuState: Record<string, boolean>) => void

  // Sidebar permutation state
  permutationDetails: Record<string, { count: number; total: number }>
  permutations: number
  permutationsSearched: number
  permutationsResults: number
  setPermutationDetails: (
    details: Record<string, { count: number; total: number }>
  ) => void
  setPermutations: (n: number) => void
  setPermutationsSearched: (n: number) => void
  setPermutationsResults: (n: number) => void

  // Optimization progress
  optimizationInProgress: boolean
  optimizerStartTime: number | null
  optimizerEndTime: number | null
  optimizerProgress: number
  setOptimizationInProgress: (inProgress: boolean) => void
  setOptimizerStartTime: (time: number | null) => void
  setOptimizerEndTime: (time: number | null) => void
  setOptimizerProgress: (progress: number) => void

  // Build management
  pinnedBuilds: PinnedBuild[]
  addPinnedBuild: (build: PinnedBuild) => void
  removePinnedBuild: (buildId: string) => void
  clearPinnedBuilds: () => void

  // Build comparison
  comparisonMode: boolean
  setComparisonMode: (mode: boolean) => void
  compareBuildIndex: number | null
  setCompareBuildIndex: (index: number | null) => void

  // Stat simulation
  simulationEnabled: boolean
  setSimulationEnabled: (enabled: boolean) => void
}

export const useOptimizerDisplayStore = create<OptimizerDisplayState>(
  (set) => ({
    menuState: initialMenuState,
    setMenuState: (menuState) => set({ menuState }),

    permutationDetails: {},
    permutations: 0,
    permutationsSearched: 0,
    permutationsResults: 0,
    setPermutationDetails: (permutationDetails) => set({ permutationDetails }),
    setPermutations: (permutations) => set({ permutations }),
    setPermutationsSearched: (permutationsSearched) =>
      set({ permutationsSearched }),
    setPermutationsResults: (permutationsResults) =>
      set({ permutationsResults }),

    optimizationInProgress: false,
    optimizerStartTime: null,
    optimizerEndTime: null,
    optimizerProgress: 0,
    setOptimizationInProgress: (optimizationInProgress) =>
      set({ optimizationInProgress }),
    setOptimizerStartTime: (optimizerStartTime) => set({ optimizerStartTime }),
    setOptimizerEndTime: (optimizerEndTime) => set({ optimizerEndTime }),
    setOptimizerProgress: (optimizerProgress) => set({ optimizerProgress }),

    // Build management
    pinnedBuilds: [],
    addPinnedBuild: (build) =>
      set((state) => {
        if (state.pinnedBuilds.find((b) => b.buildId === build.buildId))
          return state
        return { pinnedBuilds: [...state.pinnedBuilds, build] }
      }),
    removePinnedBuild: (buildId) =>
      set((state) => ({
        pinnedBuilds: state.pinnedBuilds.filter((b) => b.buildId !== buildId),
      })),
    clearPinnedBuilds: () => set({ pinnedBuilds: [] }),

    comparisonMode: false,
    setComparisonMode: (comparisonMode) => set({ comparisonMode }),
    compareBuildIndex: null,
    setCompareBuildIndex: (compareBuildIndex) => set({ compareBuildIndex }),

    // Stat simulation
    simulationEnabled: false,
    setSimulationEnabled: (simulationEnabled) => set({ simulationEnabled }),
  })
)
