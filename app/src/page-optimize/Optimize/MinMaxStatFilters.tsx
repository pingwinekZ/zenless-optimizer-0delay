import { Flex } from '@mantine/core'
import type { MutableRefObject } from 'react'
import { useCallback, useContext } from 'react'
import type { StatFilterStatKey, StatFilters } from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { FilterRow, FormStatTextStyled, HeaderText } from '../layout'

const statFilterStatKeys: StatFilterStatKey[] = [
  'hp',
  'def',
  'atk',
  'crit_',
  'crit_dmg_',
  'pen',
  'enerRegen',
  'anomProf',
  'anomMas',
  'impact',
  'sheerForce',
]

const statLabels: Partial<Record<StatFilterStatKey, string>> = {
  hp: 'HP',
  def: 'DEF',
  atk: 'ATK',
  crit_: 'CR',
  crit_dmg_: 'CD',
  pen: 'PEN',
  enerRegen: 'ERR',
  anomProf: 'AP',
  anomMas: 'AM',
  impact: 'Impact',
  sheerForce: 'SF',
}

export function MinMaxStatFilters({
  disabled = false,
  qt = 'final',
  statFiltersRef,
}: {
  disabled?: boolean
  qt?: 'initial' | 'combat' | 'final'
  statFiltersRef: MutableRefObject<StatFilters>
}) {
  const {
    optConfigId,
    optConfig: { statFilters = [] },
  } = useContext(OptConfigContext)

  const { database } = useDatabaseContext()

  const save = useCallback(
    (updated: StatFilters) => {
      database.optConfigs.set(optConfigId, { statFilters: updated })
      statFiltersRef.current = updated
    },
    [database, optConfigId, statFiltersRef]
  )

  const headerLabel =
    qt === 'initial' ? 'INITIAL' : qt === 'combat' ? 'COMBAT' : 'FINAL'

  const mutate = useCallback(
    (statKey: StatFilterStatKey, val: number | undefined, isMax: boolean) => {
      const updated = structuredClone(statFilters)
      if (val === undefined) {
        save(updated.filter((f) => !(f.tag.q === statKey && f.tag.qt === qt)))
      } else {
        const idx = updated.findIndex(
          (f) => f.tag.q === statKey && f.tag.qt === qt && f.isMax === isMax
        )
        if (idx >= 0) {
          updated[idx].value = val
        } else {
          updated.push({
            tag: { q: statKey, qt },
            value: val,
            isMax,
            disabled: false,
          })
        }
        save(updated)
      }
    },
    [qt, statFilters, save]
  )

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Stat min / max filters - {headerLabel}</HeaderText>

      <Flex direction="column" gap={7}>
        {statFilterStatKeys.map((statKey) => {
          const minFilter = statFilters.find(
            (f) => f.tag.q === statKey && f.tag.qt === qt && !f.isMax
          )
          const maxFilter = statFilters.find(
            (f) => f.tag.q === statKey && f.tag.qt === qt && f.isMax
          )
          return (
            <FilterRow
              key={statKey}
              label={
                <FormStatTextStyled>{statLabels[statKey]}</FormStatTextStyled>
              }
              min={minFilter?.value}
              max={maxFilter?.value}
              setMin={(val) => mutate(statKey, val, false)}
              setMax={(val) => mutate(statKey, val, true)}
              disabled={disabled}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
