import { Box, Button, Flex, SimpleGrid, Skeleton, Text } from '@mantine/core'
import { IconCopy, IconPlus } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useMediaQueryUp } from '@zenless-optimizer/common/react-util'
import { useInfScroll } from '@zenless-optimizer/common/ui'
import { filterFunction } from '@zenless-optimizer/common/util'
import { Suspense, useDeferredValue, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDatabaseContext, useDisplayDisc } from '../../db-ui'
import { discFilterConfigs } from '../../util'
import { DiscCard } from './DiscCard'
import DiscFilter from './DiscFilter'
import discInventoryClasses from './DiscInventory.module.css'

const columns = { xs: 2, sm: 3, md: 4, lg: 4, xl: 6 }
const numToShowMap = { xs: 10, sm: 12, md: 24, lg: 24, xl: 24 }

export type DiscInventoryProps = {
  onAdd?: () => void
  onEdit?: (id: string) => void
  onShowDup?: () => void
}

export function DiscInventory({
  onAdd,
  onEdit,
  onShowDup,
}: DiscInventoryProps) {
  const { t } = useTranslation('disc')
  const { database } = useDatabaseContext()
  const discDisplayState = useDisplayDisc()
  const filterConfigs = useMemo(() => discFilterConfigs(), [])
  const deferredDiscDisplayState = useDeferredValue(discDisplayState)
  const allDiscs = useDataManagerValues(database.discs)
  const totalDiscsNum = allDiscs.length
  const { filterOption } = deferredDiscDisplayState
  const discIds = useMemo(
    () =>
      allDiscs
        .filter(filterFunction(filterOption, filterConfigs))
        .map((disc) => disc.id),
    [allDiscs, filterOption, filterConfigs]
  )

  const brPt = useMediaQueryUp()
  const totalShowing =
    discIds.length !== totalDiscsNum
      ? `${discIds.length}/${totalDiscsNum}`
      : totalDiscsNum
  const { numShow, setTriggerElement } = useInfScroll(
    numToShowMap[brPt],
    discIds.length
  )

  const discsIdsToShow = useMemo(
    () => discIds.slice(0, numShow),
    [discIds, numShow]
  )

  return (
    <>
      <DiscFilter
        numShowing={totalDiscsNum}
        total={totalDiscsNum}
        discIds={discIds}
      />

      <Flex className={discInventoryClasses.countRow}>
        <Text size="xs" c="dimmed">
          Showing <b>{discsIdsToShow.length}</b> out of {totalShowing} Items
        </Text>
      </Flex>

      <SimpleGrid cols={columns} spacing={8}>
        <Box>
          <Button
            fullWidth
            onClick={onAdd}
            color="blue"
            leftSection={<IconPlus size={16} />}
            size="xs"
          >
            {t('addNew')}
          </Button>
        </Box>
        <Box>
          <Button
            fullWidth
            onClick={onShowDup}
            color="blue"
            leftSection={<IconCopy size={16} />}
            size="xs"
          >
            {t('showDupes')}
          </Button>
        </Box>
      </SimpleGrid>

      <Suspense fallback={<Skeleton width="100%" height={5000} />}>
        <Box>
          <SimpleGrid cols={columns} spacing={8}>
            {discsIdsToShow.map((discId) => (
              <Box key={discId}>
                <DiscCard key={discId} discId={discId} onEdit={onEdit} />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
        {discIds.length !== discsIdsToShow.length && (
          <Skeleton
            ref={(node) => {
              if (!node) return
              setTriggerElement(node)
            }}
            width="100%"
            height={100}
            mt={8}
          />
        )}
      </Suspense>
    </>
  )
}
