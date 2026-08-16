import {
  Box,
  CardSection,
  Group,
  SimpleGrid,
  Skeleton,
  TextInput,
} from '@mantine/core'
import {
  useDataEntryBase,
  useDataManagerValues,
} from '@zenless-optimizer/common/database-ui'
import { useMediaQueryUp } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  ShowingAndSortOptionSelect,
  useInfScroll,
} from '@zenless-optimizer/common/ui'
import { filterFunction, sortFunction } from '@zenless-optimizer/common/util'
import type { ChangeEvent } from 'react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WengineSortKey } from '../db'
import { useDatabaseContext } from '../db-ui'
import {
  WengineCard,
  wengineFilterConfigs,
  wengineSortConfigs,
  wengineSortMap,
} from '../ui'
import WengineFilter from './WengineFilter'

const columns = { xs: 2, sm: 3, md: 4, lg: 4, xl: 6 }
const numToShowMap = { xs: 10, sm: 12, md: 24, lg: 24, xl: 24 }

const sortKeys = Object.keys(wengineSortMap)
export default function PageWengine() {
  const { t } = useTranslation(['page_wengine', 'ui'])
  const { database } = useDatabaseContext()
  const displayWengine = useDataEntryBase(database.displayWengine)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const { sortType, ascending, speciality, rarity } = displayWengine

  const allWegines = useDataManagerValues(database.wengines)
  const totalWengineNum = allWegines.length
  const wengineIds = useMemo(
    () =>
      allWegines
        .filter(
          filterFunction(
            {
              speciality,
              rarity,
              name: deferredSearchTerm,
            },
            wengineFilterConfigs()
          )
        )
        .sort(
          sortFunction(
            wengineSortMap[sortType as WengineSortKey] ?? [],
            ascending,
            wengineSortConfigs()
          )
        )
        .map((key) => key.id),
    [allWegines, speciality, rarity, deferredSearchTerm, sortType, ascending]
  )

  const brPt = useMediaQueryUp()

  const { numShow, setTriggerElement } = useInfScroll(
    numToShowMap[brPt],
    wengineIds.length
  )
  const wenginesIdsToShow = useMemo(
    () => wengineIds.slice(0, numShow),
    [wengineIds, numShow]
  )

  // Pagination
  const totalShowing =
    wengineIds.length !== totalWengineNum
      ? `${wengineIds.length}/${totalWengineNum}`
      : `${totalWengineNum}`

  const showingTextProps = {
    numShowing: wenginesIdsToShow.length,
    total: totalShowing,
    t: t,
    namespace: 'page_wengine',
  }

  const sortByButtonProps = {
    sortKeys: [...sortKeys],
    value: sortType,
    onChange: (sortType: string) =>
      database.displayWengine.set({ sortType: sortType as WengineSortKey }),
    ascending: ascending,
    onChangeAsc: (ascending: boolean) =>
      database.displayWengine.set({ ascending }),
  }
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <WengineFilter
        numShowing={wengineIds.length}
        total={totalWengineNum}
        wengineIds={wengineIds}
      />
      <CardThemed>
        <CardSection
          style={{ display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          <Group>
            <TextInput
              autoFocus
              size="sm"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              label={t('wengineName')}
            />
            <ShowingAndSortOptionSelect
              showingTextProps={showingTextProps}
              sortByButtonProps={sortByButtonProps}
            />
          </Group>
        </CardSection>
      </CardThemed>
      <Box>
        <SimpleGrid cols={columns} spacing={1}>
          {wenginesIdsToShow.map((wengineId) => (
            <WengineCard key={wengineId} wengineId={wengineId} />
          ))}
        </SimpleGrid>
      </Box>
      {wengineIds.length !== wenginesIdsToShow.length && (
        <Skeleton
          ref={(node) => {
            if (!node) return
            setTriggerElement(node)
          }}
          style={{ borderRadius: 1 }}
          width="100%"
          height={100}
        />
      )}
    </Box>
  )
}
