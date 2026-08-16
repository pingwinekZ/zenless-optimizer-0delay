import { useDataManagerValues } from '@zenless-optimizer/common/database-ui'
import {
  AllCommunityModule,
  type GetRowIdParams,
  type GridOptions,
  type IRowNode,
  type IsExternalFilterPresentParams,
  ModuleRegistry,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { useDatabaseContext } from '../../db-ui'
import { doesDiscPassFilters } from '../scoring/discFilters'
import { scoreDiscs } from '../scoring/scoreDiscs'
import type { ScoredDisc } from '../scoring/types'
import {
  buildAllColDefs,
  buildDiscAggregations,
  defaultDiscColDef,
} from './columnDefs'
import { useDiscTabStore } from './useDiscTabStore'

ModuleRegistry.registerModules([AllCommunityModule])

const gridOptions: GridOptions<ScoredDisc> = {
  rowHeight: 33,
  rowBuffer: 15,
  suppressDragLeaveHidesColumns: true,
  suppressScrollOnNewData: true,
  suppressMultiSort: true,
  suppressNoRowsOverlay: true,
  getRowId: (params: GetRowIdParams<ScoredDisc>) => params.data.id,
}

export function DiscGrid() {
  const { database } = useDatabaseContext()
  const allDiscs = useDataManagerValues(database.discs)
  const { t } = useTranslation('discTab')

  const gridRef = useRef<AgGridReact<ScoredDisc>>(null)

  const { focusCharacter, filters, valueColumns, setSelectedDiscsIds } =
    useDiscTabStore(
      useShallow((s) => ({
        focusCharacter: s.focusCharacter,
        filters: s.filters,
        valueColumns: s.valueColumns,
        setSelectedDiscsIds: s.setSelectedDiscsIds,
      }))
    )

  const scored: ScoredDisc[] = useMemo(() => {
    const discs = allDiscs.map((d) => d)
    const ids = allDiscs.map((d) => d.id)
    return scoreDiscs(discs, ids, focusCharacter, database)
  }, [allDiscs, focusCharacter, database])

  const aggregations = useMemo(() => buildDiscAggregations(scored), [scored])

  const columnDefs = useMemo(
    () => buildAllColDefs(t, aggregations, valueColumns),
    [t, aggregations, valueColumns]
  )

  const isExternalFilterPresent = useCallback(
    (_params: IsExternalFilterPresentParams<ScoredDisc>) => {
      return !Object.values(filters).every((filter) => filter.length === 0)
    },
    [filters]
  )

  const doesExternalFilterPass = useCallback(
    (node: IRowNode<ScoredDisc>) => {
      const disc = node.data?.disc
      if (!disc) return false
      return doesDiscPassFilters(disc, filters)
    },
    [filters]
  )

  const onSelectionChanged = useCallback(() => {
    const rows = gridRef.current?.api?.getSelectedRows() ?? []
    setSelectedDiscsIds(rows.map((r) => r.id))
  }, [setSelectedDiscsIds])

  return (
    <div
      id="discGrid"
      className="ag-theme-balham ag-theme-balham-dark"
      style={{
        width: '100%',
        minHeight: 300,
        height: 600,
        overflow: 'hidden',
        resize: 'vertical',
        boxShadow: 'var(--shadow-card-flat)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--layer-2)',
      }}
    >
      <AgGridReact<ScoredDisc>
        ref={gridRef}
        rowData={scored}
        columnDefs={columnDefs}
        defaultColDef={defaultDiscColDef}
        gridOptions={gridOptions}
        onSelectionChanged={onSelectionChanged}
        isExternalFilterPresent={isExternalFilterPresent}
        doesExternalFilterPass={doesExternalFilterPass}
        headerHeight={48}
        animateRows
        rowSelection={{
          mode: 'multiRow',
          checkboxes: false,
          headerCheckbox: false,
          enableClickSelection: true,
        }}
      />
    </div>
  )
}
