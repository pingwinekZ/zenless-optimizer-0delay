import {
  Box,
  Button,
  CardSection,
  Group,
  SimpleGrid,
  Text,
} from '@mantine/core'
import { IconRecycle } from '@tabler/icons-react'
import { useDataEntryBase } from '@zenless-optimizer/common/database-ui'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { bulkCatTotal } from '@zenless-optimizer/common/util'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { allSpecialityKeys, allWengineRarityKeys } from '../consts'
import { useDatabaseContext } from '../db-ui'
import { getWengineStat } from '../stats'
import { WengineRarityToggle, WengineToggle } from '../ui'

export default function WengineFilter({
  numShowing,
  total,
  wengineIds,
}: {
  numShowing: number
  total: number
  wengineIds: string[]
}) {
  const { t } = useTranslation(['page_wengine', 'ui'])
  const { database } = useDatabaseContext()
  const state = useDataEntryBase(database.displayWengine)

  const { speciality, rarity } = state

  const { wengineTotals, wengineRarityTotals } = useMemo(() => {
    const catKeys = {
      wengineTotals: [...allSpecialityKeys],
      wengineRarityTotals: [...allWengineRarityKeys],
    } as const
    return bulkCatTotal(catKeys, (ctMap) =>
      database.wengines.entries.forEach(([id, wengine]) => {
        const wengineSpeciality = getWengineStat(wengine.key).type
        const wengineRarity = getWengineStat(wengine.key).rarity
        ctMap['wengineTotals'][wengineSpeciality].total++
        ctMap['wengineRarityTotals'][wengineRarity].total++
        if (wengineIds.includes(id)) {
          ctMap['wengineTotals'][wengineSpeciality].current++
          ctMap['wengineRarityTotals'][wengineRarity].current++
        }
      })
    )
  }, [database.wengines.entries, wengineIds])

  return (
    <CardThemed>
      <CardSection style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Group>
          <Text fw={700}>{t('wengineFilterTitle')}</Text>
          <Box
            style={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>
              <strong>{numShowing}</strong> / {total}
            </Text>
          </Box>
          <Button
            size="sm"
            color="red"
            onClick={() => database.displayWengine.set({ action: 'reset' })}
            leftSection={<IconRecycle size={16} />}
          >
            <Trans t={t} i18nKey="ui:reset" />
          </Button>
        </Group>
        <Box>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={1}>
            <WengineToggle
              fullWidth
              onChange={(speciality) =>
                database.displayWengine.set({ speciality })
              }
              value={speciality}
              totals={wengineTotals}
              size="sm"
            />
            <WengineRarityToggle
              fullWidth
              onChange={(rarity) => database.displayWengine.set({ rarity })}
              value={rarity}
              totals={wengineRarityTotals}
              size="sm"
            />
          </SimpleGrid>
        </Box>
      </CardSection>
    </CardThemed>
  )
}
