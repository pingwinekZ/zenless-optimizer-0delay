import { Accordion } from '@mantine/core'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDatabaseContext } from '../db-ui'
import { BottomDock } from './bottomDock/BottomDock'
import DupModal from './DupModal'
import { DiscGrid } from './discGrid/DiscGrid'
import classes from './pageDiscs.module.css'
import { RecentDiscs } from './recentDiscs/RecentDiscs'
import { TopBar } from './topBar/TopBar'

export default function PageDiscs() {
  const [showDup, onShowDup, onHideDup] = useBoolState(false)
  const { database } = useDatabaseContext()
  const allDiscs = useDataManagerValues(database.discs)
  const { t } = useTranslation('discTab')

  const hasRecent = useMemo(() => allDiscs.length > 0, [allDiscs.length])

  return (
    <div className={classes.container}>
      <TopBar />
      {hasRecent && (
        <div className={classes.accordionWrapper}>
          <Accordion
            defaultValue={['1']}
            multiple
            chevronPosition="right"
            variant="default"
            transitionDuration={200}
            styles={{
              control: {
                fontSize: 18,
                alignItems: 'baseline',
                background: 'var(--layer-1)',
              },
              content: { paddingBlock: 0, paddingBottom: 10 },
              chevron: { paddingInlineStart: 12 },
            }}
          >
            <Accordion.Item value="1">
              <Accordion.Control>
                {t('RecentlyUpdatedRelics.Header')}
              </Accordion.Control>
              <Accordion.Panel>
                <Suspense fallback={null}>
                  <RecentDiscs />
                </Suspense>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>
      )}
      <DiscGrid />
      <BottomDock onShowDup={onShowDup} />
      <Suspense fallback={null}>
        <DupModal show={showDup} onHide={onHideDup} setDiscToEdit={() => {}} />
      </Suspense>
    </div>
  )
}
