import { getUnitStr } from '@zenless-optimizer/common/util'
import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community'
import type { TFunction } from 'i18next'
import { allDiscSubStatKeys } from '../../consts'
import type { ScoredDisc } from '../scoring/types'
import {
  DiscSetCellRenderer,
  EquippedByCellRenderer,
  formatPercent,
  formatSubstat,
  MainStatCellRenderer,
  RarityCellRenderer,
} from './cellRenderers'

const STAT_COLORS = ['#5A1A06', '#343127', '#38821F']

function getGradientColor(
  value: number,
  min: number,
  max: number
): string | undefined {
  if (value == null || min == null || max == null) return undefined
  if (max === min) return STAT_COLORS[1]
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  if (t < 0.5) return lerpColor(STAT_COLORS[0], STAT_COLORS[1], t / 0.5)
  return lerpColor(STAT_COLORS[1], STAT_COLORS[2], (t - 0.5) / 0.5)
}

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16)
  const bh = parseInt(b.replace('#', ''), 16)
  const ar = (ah >> 16) & 0xff,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff
  const br = (bh >> 16) & 0xff,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `#${((1 << 24) | (rr << 16) | (rg << 8) | rb).toString(16).slice(1)}`
}

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
  if (value == null) return undefined
  const min = aggs.min[field]
  const max = aggs.max[field]
  if (min == null || max == null) return undefined
  const color = getGradientColor(value, min, max)
  if (!color) return undefined
  return { '--cell-bg': color }
}

export const defaultDiscColDef: ColDef<ScoredDisc> = {
  sortable: true,
  sortingOrder: ['desc', 'asc'],
  wrapHeaderText: true,
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
