import { create } from 'zustand'

export enum OpenCloseIDs {
  MENU_SIDEBAR = 'MENU_SIDEBAR',
  SETTINGS_DRAWER = 'SETTINGS_DRAWER',
}

type OpenCloseState = Record<OpenCloseIDs, boolean>

const openCloseStore = create<OpenCloseState>(() => ({
  [OpenCloseIDs.MENU_SIDEBAR]: true,
  [OpenCloseIDs.SETTINGS_DRAWER]: false,
}))

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
