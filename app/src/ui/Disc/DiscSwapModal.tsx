import {
  ActionIcon,
  Box,
  Divider,
  SimpleGrid,
  Skeleton,
  Text,
} from '@mantine/core'
import { IconCircleMinus, IconX } from '@tabler/icons-react'
import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import { useMediaQueryUp } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  ModalWrapper,
  ShowingAndSortOptionSelect,
  useInfScroll,
} from '@zenless-optimizer/common/ui'
import { filterFunction } from '@zenless-optimizer/common/util'
import { Suspense, useCallback, useMemo, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscSlotKey } from '../../consts'
import { allDiscSlotKeys } from '../../consts'
import type { ICachedDisc } from '../../db'
import { useDatabaseContext } from '../../db-ui'
import type { DiscFilterOption } from '../../util'
import { discFilterConfigs, initialDiscFilterOption } from '../../util'
import type { IDisc } from '../../zood'
import { DiscCardObj } from './DiscCard'
import { DiscFilterDisplay } from './DiscFilterDisplay'

const numToShowMap = { xs: 2 * 3, sm: 2 * 3, md: 3 * 3, lg: 4 * 3, xl: 4 * 3 }

export function DiscSwapModal({
  disc,
  onChangeId,
  slotKey,
  show,
  onClose,
}: {
  disc: ICachedDisc | undefined
  onChangeId: (id: string | null) => void
  slotKey: DiscSlotKey
  show: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(['page_characters', 'disc'])
  const { database } = useDatabaseContext()
  const discId = disc?.id

  const filterOptionReducer = useCallback(
    (state: any, action: any) => ({ ...state, ...action, slotKeys: [slotKey] }),
    [slotKey]
  )

  const [filterOption, filterOptionDispatch]: [
    DiscFilterOption,
    (action: any) => void,
  ] = useReducer(filterOptionReducer, {
    ...initialDiscFilterOption(),
    slotKeys: [slotKey],
  })

  const brPt = useMediaQueryUp()

  const filterConfigs = useMemo(() => discFilterConfigs(), [])

  const allDiscs = useDataManagerValues(database.discs)
  const totalDiscNum = allDiscs.filter(
    (s) => s.slotKey === filterOption.slotKeys[0]
  ).length
  const discsIds = useMemo(() => {
    const filterFunc = filterFunction(filterOption, filterConfigs)
    let discsIds = allDiscs.filter(filterFunc).map((disc) => disc.id)
    if (discId && database.discs.get(discId)) {
      discsIds = discsIds.filter((id) => id !== discId)
      discsIds.unshift(discId)
    }
    return discsIds
  }, [filterOption, filterConfigs, allDiscs, discId, database.discs])

  const { numShow, setTriggerElement } = useInfScroll(
    numToShowMap[brPt],
    discsIds.length
  )

  const discIdsToShow = useMemo(
    () => discsIds.slice(0, numShow),
    [discsIds, numShow]
  )

  const totalShowing =
    discsIds.length !== totalDiscNum
      ? `${discsIds.length}/${totalDiscNum}`
      : `${totalDiscNum}`

  const showingTextProps = {
    numShowing: discIdsToShow.length,
    total: totalShowing,
    t: t,
    namespace: 'disc',
  }
  const setSwapDiscId = useCallback(
    (swapDiscId: string | DiscSlotKey) => {
      if (allDiscSlotKeys.includes(swapDiscId as DiscSlotKey)) {
        onChangeId(null)
      } else if (swapDiscId) {
        onChangeId(swapDiscId)
      }
      onClose()
    },
    [onChangeId, onClose]
  )

  return (
    <ModalWrapper
      opened={show}
      onClose={onClose}
      containerProps={{ maxWidth: 'xl' }}
    >
      <CardThemed>
        <Box
          p="sm"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Text fw={700}>{t('tabEquip.swapDisc')}</Text>
          <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
            <IconX />
          </ActionIcon>
        </Box>
        <Divider />
        <Box p="sm">
          <Suspense fallback={<Skeleton width="100%" height={200} />}>
            <DiscFilterDisplay
              filterOption={filterOption}
              filterOptionDispatch={filterOptionDispatch}
              filteredIds={discsIds}
              disableSlotFilter
            />
          </Suspense>
        </Box>
        <Divider />
        <Box p="sm">
          <Box
            pb={8}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <ShowingAndSortOptionSelect showingTextProps={showingTextProps} />
          </Box>
          <Box mt={8}>
            <Suspense fallback={<Skeleton width="100%" height={1000} />}>
              <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing={8}>
                {discId && (
                  <Box>
                    <CardThemed
                      bgt="light"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Box
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSwapDiscId(slotKey)}
                      >
                        <Box
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <IconCircleMinus size={160} />
                          <Text>{t('disc:button.unequipDisc')}</Text>
                        </Box>
                      </Box>
                    </CardThemed>
                  </Box>
                )}
                {discIdsToShow.map((id) => (
                  <Box
                    key={id}
                    style={
                      discId === id
                        ? {
                            outline:
                              '4px solid var(--mantine-color-yellow-filled)',
                          }
                        : undefined
                    }
                  >
                    <DiscCardObj
                      disc={database.discs.get(id) as IDisc}
                      onClick={
                        discId === id ? undefined : () => setSwapDiscId(id)
                      }
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Suspense>
          </Box>
          {discsIds.length !== discIdsToShow.length && (
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
        </Box>
      </CardThemed>
    </ModalWrapper>
  )
}
