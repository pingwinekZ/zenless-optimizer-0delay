import { getUnitStr } from '@zenless-optimizer/common/util'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscRarityKey,
  DiscSetKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  allCharacterKeys,
  allDiscMainStatKeys,
  allDiscRarityKeys,
  allDiscSetKeys,
  allDiscSlotKeys,
  allDiscSubStatKeys,
  discSetNames,
} from '../../consts'
import { MultiSelectPills } from '../../page-optimize'
import { CharIconCircle } from '../../ui'
import {
  useDiscTabStore,
  type ValueColumnField,
} from '../discGrid/useDiscTabStore'
import { type FilterOption, FilterPill } from './FilterPill'
import classes from './topBar.module.css'

const DISC_LEVEL_OPTIONS: number[] = [0, 3, 6, 9, 12, 15]

export function FilterPillBar() {
  const {
    filters,
    setFilter,
    valueColumns,
    setValueColumns,
    excludedCharacters,
    setExcludedCharacters,
  } = useDiscTabStore(
    useShallow((s) => ({
      filters: s.filters,
      setFilter: s.setFilter,
      valueColumns: s.valueColumns,
      setValueColumns: s.setValueColumns,
      excludedCharacters: s.excludedCharacters,
      setExcludedCharacters: s.setExcludedCharacters,
    }))
  )

  const handlers = useMemo(
    () => ({
      slot: setFilter('slot'),
      set: setFilter('set'),
      rarity: setFilter('rarity'),
      level: setFilter('level'),
      equipped: setFilter('equipped'),
      mainStat: setFilter('mainStat'),
      subStat: setFilter('subStat'),
    }),
    [setFilter]
  )

  const { t } = useTranslation('discTab')
  const { t: tk } = useTranslation('statKey_gen')

  const valueColumnOptions = useMemo(
    () => [
      {
        group: t('RelicGrid.ValueColumns.GroupLabel'),
        items: [
          {
            value: 'scoreCurrent',
            label: t('RelicGrid.ValueColumns.CurrentScore'),
          },
          {
            value: 'scoreMaxPotential',
            label: t('RelicGrid.ValueColumns.MaxPotential'),
          },
        ],
      },
    ],
    [t]
  )

  const slotOptions: FilterOption<DiscSlotKey>[] = useMemo(
    () => allDiscSlotKeys.map((s) => ({ value: s, label: s })),
    []
  )

  const setOptions: FilterOption<DiscSetKey>[] = useMemo(
    () =>
      allDiscSetKeys.map((s) => ({
        value: s,
        label: discSetNames[s] ?? s,
      })),
    []
  )

  const rarityOptions: FilterOption<DiscRarityKey>[] = useMemo(
    () => allDiscRarityKeys.map((r) => ({ value: r, label: r })),
    []
  )

  const levelOptions: FilterOption<number>[] = useMemo(
    () => DISC_LEVEL_OPTIONS.map((lv) => ({ value: lv, label: `+${lv}` })),
    []
  )

  const equippedOptions: FilterOption<boolean>[] = useMemo(
    () => [
      { value: true, label: t('RelicFilterBar.Equipped') },
      { value: false, label: t('RelicFilterBar.Unequipped') },
    ],
    [t]
  )

  const mainStatOptions: FilterOption<DiscMainStatKey>[] = useMemo(
    () =>
      allDiscMainStatKeys.map((m) => ({
        value: m,
        label: `${tk(m)}${getUnitStr(m)}`,
      })),
    [tk]
  )

  const subStatOptions: FilterOption<DiscSubStatKey>[] = useMemo(
    () =>
      allDiscSubStatKeys.map((s) => ({
        value: s,
        label: `${tk(s)}${getUnitStr(s)}`,
      })),
    [tk]
  )

  const excludedCharactersSet = useMemo(
    () => new Set<CharacterKey>(excludedCharacters),
    [excludedCharacters]
  )

  const onExcludedCharactersChange = (next: Set<CharacterKey>) => {
    setExcludedCharacters([...next])
  }

  const characterExclusionData = useMemo(
    () =>
      allCharacterKeys.map((ck) => ({
        value: ck,
        label: ck,
        leftSection: <CharIconCircle characterKey={ck} />,
      })),
    []
  )

  return (
    <div className={classes.pillColumn}>
      <div className={classes.pillGrid}>
        <FilterPill
          label={t('RelicFilterBar.Part')}
          options={slotOptions}
          selected={filters.slot}
          onChange={handlers.slot}
        />
        <FilterPill
          label={t('RelicFilterBar.Set')}
          options={setOptions}
          selected={filters.set}
          onChange={handlers.set}
          searchable
        />
        <FilterPill
          label={t('RelicFilterBar.Rarity')}
          options={rarityOptions}
          selected={filters.rarity}
          onChange={handlers.rarity}
        />
        <FilterPill
          label={t('RelicFilterBar.Level')}
          options={levelOptions}
          selected={filters.level}
          onChange={handlers.level}
        />
        <FilterPill
          label={t('RelicFilterBar.Equipped')}
          options={equippedOptions}
          selected={filters.equipped}
          onChange={handlers.equipped}
        />
        <FilterPill
          label={t('RelicFilterBar.Mainstat')}
          options={mainStatOptions}
          selected={filters.mainStat}
          onChange={handlers.mainStat}
          searchable
        />
        <div className={classes.pillDouble}>
          <FilterPill
            label={t('RelicFilterBar.Substat')}
            options={subStatOptions}
            selected={filters.subStat}
            onChange={handlers.subStat}
            searchable
            columns={2}
          />
        </div>
        <div className={classes.pillDouble}>
          <MultiSelectPills
            size="xs"
            value={Array.from(excludedCharactersSet)}
            onChange={(values: string[]) =>
              onExcludedCharactersChange(new Set(values as CharacterKey[]))
            }
            data={characterExclusionData}
            placeholder={t('RelicFilterBar.ExcludedCharacters')}
            clearable
            maxDisplayedValues={0}
          />
        </div>
        <div className={classes.pillDouble}>
          <MultiSelectPills
            size="xs"
            value={valueColumns}
            onChange={(values: string[]) =>
              setValueColumns(values as ValueColumnField[])
            }
            data={valueColumnOptions.flatMap((g) => g.items)}
            placeholder={t('RelicFilterBar.ValueColumns')}
            clearable
            maxDisplayedValues={0}
          />
        </div>
      </div>
    </div>
  )
}
