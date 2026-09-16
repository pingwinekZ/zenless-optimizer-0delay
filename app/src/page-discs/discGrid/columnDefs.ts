import { getUnitStr } from '@zenless-optimizer/common/util'
import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community'
import type { TFunction } from 'i18next'
import { allDiscSubStatKeys } from '../../consts'
import { Gradient } from '../../rendering/gradient'
import type { ScoredDisc } from '../scoring/types'
import {
  DiscSetCellRenderer,
  EquippedByCellRenderer,
  formatPercent,
  formatSubstat,
  MainStatCellRenderer,
  RarityCellRenderer,
} from './cellRenderers'

const VALUE_KEYS = ['scoreCurrent', 'scoreMaxPotential'] as const
type ValueKey = (typeof VALUE_KEYS)[number]

export function buildDiscAggregations(rowData: ScoredDisc[]) {
  const min: Record<ValueKey, number> = {
    scoreCurrent: Infinity,
    scoreMaxPotential: Infinity,
  }
  const max: Record<ValueKey, number> = {
    scoreCurrent: -Infinity,
    scoreMaxPotential: -Infinity,
  }
  for (const r of rowData) {
    for (const k of VALUE_KEYS) {
      const v = r[k]
      if (typeof v !== 'number' || !isFinite(v)) continue
      if (v < min[k]) min[k] = v
      if (v > max[k]) max[k] = v
    }
  }
  return { min, max }
}

function gradientCellStyle(
  value: number,
  field: ValueKey,
  aggs: ReturnType<typeof buildDiscAggregations>
): Record<string, string> | undefined {
  return Gradient.getDiscCellStyle(value, aggs.min[field], aggs.max[field])
}

export const defaultDiscColDef: ColDef<ScoredDisc> = {
  sortable: true,
  width: 46,
  headerClass: 'discsTableHeader',
  sortingOrder: ['desc', 'asc'],
  filterParams: { maxNumConditions: 200 },
  wrapHeaderText: true,
  autoHeaderHeight: true,
  suppressHeaderMenuButton: true,
}

export function buildBaselineColDefs(t: TFunction): ColDef<ScoredDisc>[] {
  return [
    {
      colId: 'equippedBy',
      headerName: t('RelicGrid.Headers.EquippedBy'),
      flex: 1,
      minWidth: 60,
      cellRenderer: EquippedByCellRenderer,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) => p.data?.disc.location,
      sortable: true,
    },
    {
      colId: 'set',
      headerName: t('RelicGrid.Headers.Set'),
      width: 40,
      cellRenderer: DiscSetCellRenderer,
      sortable: false,
    },
    {
      colId: 'rarity',
      headerName: t('RelicGrid.Headers.Rarity'),
      width: 44,
      cellRenderer: RarityCellRenderer,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) => p.data?.disc.rarity,
    },
    {
      colId: 'level',
      headerName: t('RelicGrid.Headers.Level'),
      width: 44,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) => p.data?.disc.level,
      valueFormatter: (p: ValueFormatterParams) =>
        p.value != null ? `+${p.value}` : '',
    },
    {
      colId: 'slot',
      headerName: t('RelicGrid.Headers.Slot'),
      width: 44,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) => p.data?.disc.slotKey,
    },
    {
      colId: 'mainStat',
      headerName: t('RelicGrid.Headers.MainStat'),
      flex: 2,
      minWidth: 80,
      cellRenderer: MainStatCellRenderer,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) =>
        p.data?.disc.mainStatKey,
    },
  ]
}

export function buildSubstatColDefs(t: TFunction): ColDef<ScoredDisc>[] {
  return allDiscSubStatKeys.map((key) => {
    return {
      colId: `substat.${key}`,
      headerName: `${t(`RelicGrid.Headers.${key}` as any) || key}${getUnitStr(key)}`,
      valueGetter: (p: ValueGetterParams<ScoredDisc>) => {
        const d = p.data?.disc
        if (!d) return undefined
        const sub = d.substats.find((s) => s.key === key)
        if (!sub || !sub.key || sub.upgrades === 0) return undefined
        return sub.upgrades
      },
      valueFormatter: formatSubstat,
      flex: 1,
      minWidth: 50,
    }
  })
}

export function buildValueColDefs(
  t: TFunction,
  aggs: ReturnType<typeof buildDiscAggregations>
): ColDef<ScoredDisc>[] {
  return [
    {
      colId: 'scoreCurrent',
      field: 'scoreCurrent',
      headerName: t('RelicGrid.ValueColumns.CurrentScore'),
      flex: 1,
      minWidth: 70,
      valueFormatter: formatPercent,
      cellStyle: (p) => {
        const v = p.value
        if (typeof v !== 'number') return undefined
        return gradientCellStyle(v, 'scoreCurrent', aggs) as any
      },
    },
    {
      colId: 'scoreMaxPotential',
      field: 'scoreMaxPotential',
      headerName: t('RelicGrid.ValueColumns.MaxPotential'),
      flex: 1,
      minWidth: 70,
      valueFormatter: formatPercent,
      cellStyle: (p) => {
        const v = p.value
        if (typeof v !== 'number') return undefined
        return gradientCellStyle(v, 'scoreMaxPotential', aggs) as any
      },
    },
  ]
}

export function buildAllColDefs(
  t: TFunction,
  aggs: ReturnType<typeof buildDiscAggregations>,
  valueColumns: ReadonlyArray<string>
): ColDef<ScoredDisc>[] {
  const baseline = buildBaselineColDefs(t)
  const substats = buildSubstatColDefs(t)
  const valueDefs = buildValueColDefs(t, aggs).filter((c) =>
    valueColumns.includes(c.colId as string)
  )
  return [...baseline, ...substats, ...valueDefs]
}
