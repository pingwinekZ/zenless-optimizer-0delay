import { Tooltip, UnstyledButton } from '@mantine/core'
import {
  IconCalculator,
  IconDisc,
  IconHome,
  IconSettings,
  IconUser,
} from '@tabler/icons-react'

import type { ReactNode } from 'react'
import classes from './Sidebar.module.css'
import { type TabKey, useTabStore } from './useTabStore'

type NavItem = {
  label: string
  icon: ReactNode
  value: TabKey
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Navigation',
    items: [
      {
        label: 'Home',
        icon: <IconHome size={18} />,
        value: 'home',
      },
      {
        label: 'Discs',
        icon: <IconDisc size={18} />,
        value: 'discs',
      },
    ],
  },
  {
    label: 'Optimization',
    items: [
      {
        label: 'Characters',
        icon: <IconUser size={18} />,
        value: 'characters',
      },
      {
        label: 'Optimize',
        icon: <IconCalculator size={18} />,
        value: 'optimize',
      },
      {
        label: 'Settings',
        icon: <IconSettings size={18} />,
        value: 'settings',
      },
    ],
  },
]

export function ExpandedNav() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <div className={classes.root}>
      {navGroups.map((group) => (
        <div key={group.label} className={classes.group}>
          <div className={classes.groupLabel}>{group.label}</div>
          {group.items.map((item) => {
            const isActive = item.value === activeTab
            return (
              <UnstyledButton
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={classes.item}
                data-active={isActive}
              >
                <div className={classes.itemIcon}>{item.icon}</div>
                <span>{item.label}</span>
              </UnstyledButton>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function CollapsedNav() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <div className={classes.root} style={{ alignItems: 'center' }}>
      {navGroups.map((group) => (
        <div
          key={group.label}
          className={classes.group}
          style={{ alignItems: 'center' }}
        >
          {group.items.map((item) => {
            const isActive = item.value === activeTab
            return (
              <Tooltip
                key={item.value}
                label={item.label}
                position="right"
                withArrow
                openDelay={300}
              >
                <UnstyledButton
                  onClick={() => setActiveTab(item.value)}
                  className={classes.itemCollapsed}
                  data-active={isActive}
                >
                  {item.icon}
                </UnstyledButton>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function MenuDrawer({ collapsed }: { collapsed: boolean }) {
  return collapsed ? <CollapsedNav /> : <ExpandedNav />
}
