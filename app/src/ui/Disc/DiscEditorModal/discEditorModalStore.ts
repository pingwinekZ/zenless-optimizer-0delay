import { create } from 'zustand'
import type { DiscEditorConfig } from './discEditorModalTypes'

type DiscEditorModalState = {
  open: boolean
  config: DiscEditorConfig | null
  openOverlay: (config: DiscEditorConfig) => void
  closeOverlay: () => void
}

export const useDiscEditorModalStore = create<DiscEditorModalState>((set) => ({
  open: false,
  config: null,
  openOverlay: (config) => set({ open: true, config }),
  closeOverlay: () => set({ open: false }),
}))
