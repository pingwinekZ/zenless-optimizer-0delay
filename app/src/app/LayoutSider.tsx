import { ActionIcon, Flex } from '@mantine/core'
import { IconMenu2, IconX } from '@tabler/icons-react'
import {
  OpenCloseIDs,
  useOpenClose,
} from '@zenless-optimizer/common/react-util'
import { MenuDrawer } from './MenuDrawer'
import classes from './Sidebar.module.css'
import { useScrollLockState } from './scrollController'

const SIDEBAR_EXPANDED = 160
const SIDEBAR_COLLAPSED = 56

export function LayoutSider() {
  const { isLocked, offset } = useScrollLockState()
  const { isOpen, toggle } = useOpenClose(OpenCloseIDs.MENU_SIDEBAR)
  const siderWidth = isOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED

  return (
    <div
      className={classes.siderBackground}
      style={{ width: siderWidth, minWidth: siderWidth }}
    >
      <div
        className={classes.siderPanel}
        style={{
          // A sticky panel can't follow the document once the scroll lock pins
          // the body, so it is positioned manually against the scroll offset.
          position: isLocked ? 'relative' : 'sticky',
          top: isLocked ? offset : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Flex align="center" style={{ height: 48, flexShrink: 0 }}>
          <Flex
            align="center"
            justify="center"
            style={{ width: 56, minWidth: 56 }}
          >
            <ActionIcon
              variant="transparent"
              onClick={toggle}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <IconX size={16} /> : <IconMenu2 size={16} />}
            </ActionIcon>
          </Flex>
        </Flex>
        <div
          className={classes.scrollContainer}
          style={{ flex: 1, minHeight: 0, height: 'auto' }}
        >
          <MenuDrawer collapsed={!isOpen} />
        </div>
      </div>
    </div>
  )
}
