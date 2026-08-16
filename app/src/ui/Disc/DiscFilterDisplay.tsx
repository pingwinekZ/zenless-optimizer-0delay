import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  SimpleGrid,
  Stack,
  Tabs,
} from '@mantine/core'
import {
  IconBriefcase,
  IconLock,
  IconLockOpen,
  IconUserSearch,
} from '@tabler/icons-react'
import {
  BootstrapTooltip,
  SolidToggleButtonGroup,
} from '@zenless-optimizer/common/ui'
import {
  bulkCatTotal,
  handleMultiSelect,
  objKeyMap,
} from '@zenless-optimizer/common/util'
import { Suspense, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { DiscSlotKey } from '../../consts'
import {
  allDiscMainStatKeys,
  allDiscRarityKeys,
  allDiscSetKeys,
  allDiscSlotKeys,
  allDiscSubStatKeys,
  allLocationKeys,
} from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { type DiscFilterOption } from '../../util'
import { LocationFilterMultiAutocomplete } from '../Character/LocationFilterMultiAutocomplete'
import { DiscSlotToggle } from '../toggles'
import { DiscLevelSlider } from './DiscLevelSlider'
import { DiscMainStatMultiAutocomplete } from './DiscMainStatMultiAutocomplete'
import { DiscSetMultiAutocomplete } from './DiscSetMultiAutocomplete'
import { SubstatMultiAutocomplete } from './SubstatMultiAutocomplete'

const lockedValues = ['locked', 'unlocked'] as const
const excludedValues = ['excluded', 'included'] as const

const rarityHandler = handleMultiSelect([...allDiscRarityKeys])
const lineHandler = handleMultiSelect([1, 2, 3, 4])
const lockedHandler = handleMultiSelect([...lockedValues])
const excludedHandler = handleMultiSelect([...excludedValues])
interface DiscFilterDisplayProps {
  filterOption: DiscFilterOption
  filterOptionDispatch: (option: Partial<DiscFilterOption>) => void
  filteredIds: string[]
  disableSlotFilter?: boolean
  enableExclusionFilter?: boolean
  excludedIds?: string[]
}
export function DiscFilterDisplay({
  filterOption,
  filterOptionDispatch,
  filteredIds,
  disableSlotFilter = false,
  enableExclusionFilter = false,
  excludedIds = [],
}: DiscFilterDisplayProps) {
  const { t } = useTranslation(['disc', 'ui'])

  const filteredIdMap = useMemo(
    () => objKeyMap(filteredIds, (_) => true),
    [filteredIds]
  )
  const {
    discSetKeys = [],
    mainStatKeys = [],
    rarity = [],
    slotKeys = [],
    levelLow = 0,
    levelHigh = 15,
    substats = [],
    locations,
    showEquipped,
    showInventory,
    locked = [...lockedValues],
    lines = [],
    excluded = [...excludedValues],
  } = filterOption

  const { database } = useDatabaseContext()

  const {
    rarityTotal,
    slotTotal,
    lockedTotal,
    linesTotal,
    equippedTotal,
    setTotal,
    mainStatTotal,
    subStatTotal,
    locationTotal,
    excludedTotal,
  } = useMemo(() => {
    const catKeys = {
      rarityTotal: allDiscRarityKeys,
      slotTotal: allDiscSlotKeys,
      lockedTotal: ['locked', 'unlocked'],
      linesTotal: [0, 1, 2, 3, 4],
      equippedTotal: ['equipped', 'unequipped'],
      setTotal: allDiscSetKeys,
      mainStatTotal: allDiscMainStatKeys,
      subStatTotal: allDiscSubStatKeys,
      locationTotal: [...allLocationKeys, ''],
      excludedTotal: ['excluded', 'included'],
    } as const
    return bulkCatTotal(catKeys, (ctMap) =>
      database.discs.entries.forEach(([id, disc]) => {
        const { rarity, slotKey, location, setKey, mainStatKey, substats } =
          disc
        const lock = disc.lock ? 'locked' : 'unlocked'
        const lns = disc.substats.length
        const equipped = location ? 'equipped' : 'unequipped'
        const excluded = excludedIds.includes(id) ? 'excluded' : 'included'
        if (!disableSlotFilter || disc.slotKey === filterOption.slotKeys[0]) {
          ctMap['rarityTotal'][rarity].total++
          ctMap['slotTotal'][slotKey].total++
          ctMap['lockedTotal'][lock].total++
          ctMap['linesTotal'][lns] && ctMap['linesTotal'][lns].total++
          ctMap['equippedTotal'][equipped].total++
          ctMap['setTotal'][setKey].total++
          ctMap['mainStatTotal'][mainStatKey].total++
          substats.forEach((sub) => {
            const subKey = sub.key
            if (!subKey) return
            ctMap['subStatTotal'][subKey].total++
            if (filteredIdMap[id]) ctMap['subStatTotal'][subKey].current++
          })
          if (location) ctMap['locationTotal'][location].total++
          ctMap['excludedTotal'][excluded].total++
        }

        if (filteredIdMap[id]) {
          ctMap['rarityTotal'][rarity].current++
          ctMap['slotTotal'][slotKey].current++
          ctMap['lockedTotal'][lock].current++
          ctMap['linesTotal'][lns].current++
          ctMap['equippedTotal'][equipped].current++
          ctMap['setTotal'][setKey].current++
          ctMap['mainStatTotal'][mainStatKey].current++
          if (location) ctMap['locationTotal'][location].current++
          ctMap['excludedTotal'][excluded].current++
        }
      })
    )
  }, [
    database.discs.entries,
    disableSlotFilter,
    excludedIds,
    filterOption.slotKeys,
    filteredIdMap,
  ])
  return (
    <Box>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={8}>
        {/* left */}
        <Box style={{ display: 'flex', flexDirection: 'column' }}>
          {/* General */}
          <Trans t={t} i18nKey="subheadings.general" />
          <Stack gap={8}>
            <Divider />
            {/* Disc level filter */}
            <Card padding="sm" withBorder>
              <DiscLevelSlider
                levelLow={levelLow}
                levelHigh={levelHigh}
                setLow={(levelLow) => filterOptionDispatch({ levelLow })}
                setHigh={(levelHigh) => filterOptionDispatch({ levelHigh })}
                setBoth={(levelLow, levelHigh) =>
                  filterOptionDispatch({ levelLow, levelHigh })
                }
              ></DiscLevelSlider>
            </Card>
            {/* Disc rarity filter */}
            <SolidToggleButtonGroup fullWidth value={rarity} size="sm">
              {allDiscRarityKeys.map((rarityKey) => (
                <Tabs.Tab
                  key={rarityKey}
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                  value={rarityKey}
                  onClick={() =>
                    filterOptionDispatch({
                      rarity: rarityHandler(rarity, rarityKey),
                    })
                  }
                >
                  {rarityKey}
                  <Badge size="sm">{rarityTotal[rarityKey]}</Badge>
                </Tabs.Tab>
              ))}
            </SolidToggleButtonGroup>
            {/* Number of Sub stats filter */}
            <SolidToggleButtonGroup
              fullWidth
              value={lines.map(String)}
              size="sm"
            >
              {[1, 2, 3, 4].map((line) => (
                <Tabs.Tab
                  key={line}
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                  value={String(line)}
                  onClick={() =>
                    filterOptionDispatch({
                      lines: lineHandler(lines, line) as Array<1 | 2 | 3 | 4>,
                    })
                  }
                >
                  <Box style={{ whiteSpace: 'nowrap' }}>
                    {t('sub', { count: line })}
                  </Box>
                  <Badge size="sm">{linesTotal[line]}</Badge>
                </Tabs.Tab>
              ))}
            </SolidToggleButtonGroup>
            {/* Disc Slot */}
            <DiscSlotToggle
              disabled={disableSlotFilter}
              onChange={(slotKeys: DiscSlotKey[]) =>
                filterOptionDispatch({ slotKeys })
              }
              totals={slotTotal}
              value={slotKeys}
            />
          </Stack>
          <Stack gap={12} pt={12}>
            {/* Disc set dropdown */}
            <DiscSetMultiAutocomplete
              totals={setTotal}
              discSetKeys={discSetKeys}
              setDiscSetKeys={(discSetKeys) =>
                filterOptionDispatch({ discSetKeys })
              }
            />
            {/* Main stat dropdown */}
            <DiscMainStatMultiAutocomplete
              totals={mainStatTotal}
              mainStatKeys={mainStatKeys}
              setMainStatKeys={(mainStatKeys) =>
                filterOptionDispatch({ mainStatKeys })
              }
            />
            {/* Sub stat dropdown */}
            <SubstatMultiAutocomplete
              totals={subStatTotal}
              substatKeys={substats}
              setSubstatKeys={(substats) => filterOptionDispatch({ substats })}
              allSubstatKeys={[...allDiscSubStatKeys]}
            />
          </Stack>
        </Box>
        {/* right */}
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Inventory */}
          <Box>
            <Trans t={t} i18nKey="subheadings.inventory" />
            <Stack gap={8}>
              <Divider />
              {/* exclusion + locked */}
              <SolidToggleButtonGroup fullWidth value={locked} size="sm">
                {lockedValues.map((v, i) => (
                  <Tabs.Tab
                    key={v}
                    value={v}
                    style={{ display: 'flex', gap: 8 }}
                    onClick={() =>
                      filterOptionDispatch({ locked: lockedHandler(locked, v) })
                    }
                  >
                    {i ? <IconLockOpen size={18} /> : <IconLock size={18} />}
                    <Trans i18nKey={`ui:${v}`} t={t} />
                    <Badge size="sm">
                      {lockedTotal[i ? 'unlocked' : 'locked']}
                    </Badge>
                  </Tabs.Tab>
                ))}
              </SolidToggleButtonGroup>
              {/* Excluded from optimization */}
              {enableExclusionFilter && (
                <SolidToggleButtonGroup fullWidth value={excluded} size="sm">
                  {excludedValues.map((v, i) => (
                    <Tabs.Tab
                      key={v}
                      value={v}
                      style={{ display: 'flex', gap: 8 }}
                      onClick={() =>
                        filterOptionDispatch({
                          excluded: excludedHandler(excluded, v),
                        })
                      }
                    >
                      <Trans i18nKey={`ui:${v}`} t={t} />
                      <Badge size="sm">
                        {excludedTotal[i ? 'included' : 'excluded']}
                      </Badge>
                    </Tabs.Tab>
                  ))}
                </SolidToggleButtonGroup>
              )}
              {/* All inventory toggle */}
              <Button
                leftSection={<IconBriefcase size={16} />}
                color={showInventory ? 'green' : 'gray'}
                onClick={() =>
                  filterOptionDispatch({ showInventory: !showInventory })
                }
                variant={showInventory ? 'filled' : 'default'}
              >
                {t('unequippedDiscs')}{' '}
                <Badge style={{ marginLeft: 8 }} size="sm">
                  {equippedTotal['unequipped']}
                </Badge>
              </Button>
              {/* All equipped toggle */}
              <Button
                leftSection={<IconUserSearch size={16} />}
                color={showEquipped ? 'green' : 'gray'}
                onClick={() =>
                  filterOptionDispatch({ showEquipped: !showEquipped })
                }
                variant={showEquipped ? 'filled' : 'default'}
              >
                {t('equippedDiscs')}{' '}
                <Badge style={{ marginLeft: 8 }} size="sm">
                  {equippedTotal['equipped']}
                </Badge>
              </Button>
            </Stack>
            <Stack gap={12} pt={12}>
              {/* Filter characters */}
              <Suspense fallback={null}>
                <BootstrapTooltip
                  label={showEquipped ? t('locationsTooltip') : ''}
                >
                  <Box component="span">
                    <LocationFilterMultiAutocomplete
                      totals={locationTotal}
                      locations={showEquipped ? [] : locations}
                      setLocations={(locations) =>
                        filterOptionDispatch({ locations })
                      }
                      disabled={showEquipped}
                    />
                  </Box>
                </BootstrapTooltip>
              </Suspense>
            </Stack>
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
