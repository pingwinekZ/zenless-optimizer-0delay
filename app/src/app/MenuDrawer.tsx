import { Tooltip, UnstyledButton } from '@mantine/core'
import {
  IconCalculator,
  IconDisc,
  IconHome,
  IconSettings,
  IconUser,
} from '@tabler/icons-react'

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import classes from './Sidebar.module.css'
import { type TabKey, useTabStore } from './useTabStore'

type NavItem = {
  value: TabKey
  label: string
  icon: ReactNode
}

type NavGroup = {
  label: string
  items: NavItem[]
}

// ---- Expanded sidebar ----

function SidebarNavExpanded({
  groups,
  activeKey,
  onNavigate,
}: {
  groups: NavGroup[]
  activeKey: TabKey
  onNavigate: (item: NavItem) => void
}) {
  const navRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLButtonElement>(null)
  const [indicatorVisible, setIndicatorVisible] = useState(false)

  const moveIndicator = useCallback((el: HTMLElement | null) => {
    if (!el || !navRef.current || !indicatorRef.current) return
    const navRect = navRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const top = elRect.top - navRect.top
    indicatorRef.current.style.transform = `translateY(${top}px)`
    indicatorRef.current.style.height = `${elRect.height}px`
    setIndicatorVisible(true)
  }, [])

  // Snap the indicator to the active item
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      moveIndicator(highlightedRef.current)
    })
    return () => cancelAnimationFrame(frame)
  }, [activeKey, moveIndicator])

  // Reposition the indicator when layout shifts (e.g. sidebar expand/collapse)
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const ro = new ResizeObserver(() => {
      moveIndicator(highlightedRef.current)
    })
    ro.observe(nav)
    // Also observe all nav items so position shifts from items above are caught
    nav.querySelectorAll('button').forEach((el) => ro.observe(el))
    return () => ro.disconnect()
  }, [moveIndicator])

  return (
    <div ref={navRef} className={classes.root}>
      <div
        ref={indicatorRef}
        className={classes.indicator}
        style={{ opacity: indicatorVisible ? 1 : 0 }}
      />

      {groups.map((group) => (
        <div key={group.label} className={classes.group}>
          <div className={classes.groupLabel}>{group.label}</div>
          <div className={classes.groupItems}>
            {group.items.map((item) => {
              const isActive = item.value === activeKey
              return (
                <UnstyledButton
                  key={item.value}
                  ref={isActive ? highlightedRef : undefined}
                  className={classes.item}
                  data-active={isActive || undefined}
                  // `onClick` (not hsr's `onMouseDown`) so keyboard activation
                  // of the <button> also navigates.
                  onClick={() => onNavigate(item)}
                >
                  <div className={classes.itemIcon}>{item.icon}</div>
                  <span className={classes.itemLabel}>{item.label}</span>
                </UnstyledButton>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Collapsed sidebar (icon-only with tooltips) ----

function SidebarNavCollapsed({
  groups,
  activeKey,
  onNavigate,
}: {
  groups: NavGroup[]
  activeKey: TabKey
  onNavigate: (item: NavItem) => void
}) {
  return (
    <div className={classes.rootCollapsed}>
      {groups.map((group) => (
        <div key={group.label} className={classes.group}>
          <div className={classes.groupItems}>
            {group.items.map((item) => {
              const isActive = item.value === activeKey
              return (
                <Tooltip
                  key={item.value}
                  label={item.label}
                  position="right"
                  withArrow
                  openDelay={300}
                >
                  <UnstyledButton
                    className={classes.itemCollapsed}
                    data-active={isActive || undefined}
                    onClick={() => onNavigate(item)}
                  >
                    <div className={classes.itemIcon}>{item.icon}</div>
                  </UnstyledButton>
                </Tooltip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Main component ----

export function MenuDrawer({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation('sidebar')
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  const groups: NavGroup[] = useMemo(
    () => [
      {
        // Staged for later use. Empty groups are filtered out below, so this
        // only shows up once it has items.
        label: t('Tools.Title', 'Tools'),
        items: [],
      },
      {
        label: t('Optimization.Title', 'Optimization'),
        items: [
          {
            value: 'optimize',
            label: t('Optimization.Optimizer', 'Optimize'),
            icon: <IconCalculator size={16} />,
          },
          {
            value: 'characters',
            label: t('Optimization.Characters', 'Characters'),
            icon: <IconUser size={16} />,
          },
          {
            value: 'discs',
            label: t('Optimization.Discs', 'Discs'),
            icon: <IconDisc size={16} />,
          },
          {
            value: 'settings',
            label: t('Optimization.Settings', 'Settings'),
            icon: <IconSettings size={16} />,
          },
        ],
      },
      {
        label: t('Links.Title', 'Links'),
        items: [
          {
            value: 'home',
            label: t('Links.Home', 'Home'),
            icon: <IconHome size={16} />,
          },
        ],
      },
    ],
    [t]
  )

  // Empty groups (staged categories) render nothing at all, label included
  const visibleGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups]
  )

  const handleNavigate = useCallback(
    (item: NavItem) => {
      setActiveTab(item.value)
    },
    [setActiveTab]
  )

  return (
    <div className={classes.wrapper}>
      {collapsed ? (
        <SidebarNavCollapsed
          groups={visibleGroups}
          activeKey={activeTab}
          onNavigate={handleNavigate}
        />
      ) : (
        <SidebarNavExpanded
          groups={visibleGroups}
          activeKey={activeTab}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}
