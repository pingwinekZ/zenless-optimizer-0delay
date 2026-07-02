import { create } from 'zustand'

export type TabKey =
  | 'home'
  | 'discs'
  | 'wengines'
  | 'characters'
  | 'optimize'
  | 'settings'

const ALL_TABS: TabKey[] = [
  'home',
  'discs',
  'wengines',
  'characters',
  'optimize',
  'settings',
]

function getInitialTab(): TabKey {
  if (typeof window === 'undefined') return 'home'
  const hash = window.location.hash.replace('#/', '')
  const tab = hash.split('?')[0] || 'home'
  if ((ALL_TABS as string[]).includes(tab)) return tab as TabKey
  return 'home'
}

interface TabState {
  activeTab: TabKey
  setActiveTab: (tab: TabKey, syncUrl?: boolean) => void
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: getInitialTab(),
  setActiveTab: (tab: TabKey, syncUrl = true) => {
    set({ activeTab: tab })
    if (syncUrl && typeof window !== 'undefined') {
      window.history.pushState({}, '', `#/${tab}`)
    }
  },
}))
