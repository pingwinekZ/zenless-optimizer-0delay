import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum OpenCloseIDs {
  MENU_SIDEBAR = 'MENU_SIDEBAR',
  SETTINGS_DRAWER = 'SETTINGS_DRAWER',
}

type OpenCloseState = Record<OpenCloseIDs, boolean>

const openCloseStore = create<OpenCloseState>()(
  persist<OpenCloseState>(
    () => ({
      [OpenCloseIDs.MENU_SIDEBAR]: true,
      [OpenCloseIDs.SETTINGS_DRAWER]: false,
    }),
    {
      // Persists UI toggles (e.g. sidebar expanded/collapsed) across reloads.
      name: 'openclose-store-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<OpenCloseState> | undefined
        return {
          ...current,
          ...(typeof p?.[OpenCloseIDs.MENU_SIDEBAR] === 'boolean'
            ? { [OpenCloseIDs.MENU_SIDEBAR]: p[OpenCloseIDs.MENU_SIDEBAR] }
            : {}),
          ...(typeof p?.[OpenCloseIDs.SETTINGS_DRAWER] === 'boolean'
            ? {
                [OpenCloseIDs.SETTINGS_DRAWER]: p[OpenCloseIDs.SETTINGS_DRAWER],
              }
            : {}),
        }
      },
    }
  )
)

export function setOpen(id: OpenCloseIDs) {
  openCloseStore.setState({ [id]: true })
}

export function setClose(id: OpenCloseIDs) {
  openCloseStore.setState({ [id]: false })
}

export function toggle(id: OpenCloseIDs) {
  openCloseStore.setState((s) => ({ [id]: !s[id] }))
}

export function useIsOpen(id: OpenCloseIDs) {
  return openCloseStore((s) => s[id])
}

export function useOpenCloseActions(id: OpenCloseIDs) {
  return {
    open: () => setOpen(id),
    close: () => setClose(id),
    toggle: () => toggle(id),
  }
}

export function useOpenClose(id: OpenCloseIDs) {
  const isOpen = useIsOpen(id)
  const actions = useOpenCloseActions(id)
  return { ...actions, isOpen }
}
