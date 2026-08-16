import { Box, Button, Flex, Skeleton, Text } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { t } from 'i18next'
import { Suspense, useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useDatabaseContext, useDisplayDisc } from '../../db-ui'
import type { DiscFilterOption } from '../../util'
import discFilterClasses from './DiscFilter.module.css'
import { DiscFilterDisplay } from './DiscFilterDisplay'

export default function DiscFilter({
  numShowing,
  total,
  discIds,
}: {
  numShowing: number
  total: number
  discIds: string[]
}) {
  const database = useDatabaseContext().database
  const { filterOption } = useDisplayDisc()
  const filterOptionDispatch = useCallback(
    (option: Partial<DiscFilterOption>) =>
      database.displayDisc.set({
        filterOption: {
          ...filterOption,
          ...option,
        },
      }),
    [database, filterOption]
  )
  return (
    <Suspense fallback={<Skeleton width="100%" height={300} />}>
      <Box className={discFilterClasses.card}>
        <Flex className={discFilterClasses.cardHeader}>
          <Text size="sm" fw={700}>
            {t('discFilter')}
          </Text>
          <Flex align="center" gap={8}>
            <Text size="xs" c="dimmed">
              <strong>{numShowing}</strong> / {total}
            </Text>
            <Button
              size="xs"
              color="red"
              onClick={() => database.displayDisc.set({ action: 'reset' })}
              leftSection={<IconRefresh size={14} />}
              variant="default"
            >
              <Trans t={t} i18nKey="ui:reset" />
            </Button>
          </Flex>
        </Flex>
        <Box className={discFilterClasses.cardBody}>
          <Suspense fallback={<Skeleton width="100%" height={400} />}>
            <DiscFilterDisplay
              filterOption={filterOption}
              filterOptionDispatch={filterOptionDispatch}
              filteredIds={discIds}
            />
          </Suspense>
        </Box>
      </Box>
    </Suspense>
  )
}
