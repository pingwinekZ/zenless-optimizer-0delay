import {
  OpenCloseIDs,
  useOpenClose,
} from '@zenless-optimizer/common/react-util'
import { MenuDrawer } from './MenuDrawer'
import classes from './Sidebar.module.css'

const SIDEBAR_EXPANDED = 160
const SIDEBAR_COLLAPSED = 56

export function LayoutSider() {
  const { isOpen } = useOpenClose(OpenCloseIDs.MENU_SIDEBAR)
  const siderWidth = isOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED

  return (
    <div
      className={classes.siderBackground}
      style={{ width: siderWidth, minWidth: siderWidth }}
    >
      <div className={classes.siderPanel} style={{ top: 0 }}>
        <div className={classes.scrollContainer}>
          <MenuDrawer collapsed={!isOpen} />
        </div>
      </div>
    </div>
  )
}
