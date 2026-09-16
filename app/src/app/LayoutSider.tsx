import {
  OpenCloseIDs,
  useOpenClose,
} from '@zenless-optimizer/common/react-util'
import { HEADER_HEIGHT } from './Header'
import { MenuDrawer } from './MenuDrawer'
import classes from './Sidebar.module.css'
import { useScrollLockState } from './scrollController'

const SIDEBAR_EXPANDED = 160
const SIDEBAR_COLLAPSED = 56

export function LayoutSider() {
  const { isLocked, offset } = useScrollLockState()
  const { isOpen } = useOpenClose(OpenCloseIDs.MENU_SIDEBAR)
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
          top: isLocked && offset > HEADER_HEIGHT ? offset - HEADER_HEIGHT : 0,
        }}
      >
        <div className={classes.scrollContainer}>
          <MenuDrawer collapsed={!isOpen} />
        </div>
      </div>
    </div>
  )
}
