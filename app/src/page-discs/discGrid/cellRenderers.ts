import type {
  ICellRendererComp,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community'
import { discDefIcon } from '../../assets'
import {
  type DiscRarityKey,
  rarityColor as discRarityColor,
  statKeyTextMap,
} from '../../consts'

const setImageCache = new Map<string, string>()

function getSetImage(setKey: string): string | undefined {
  let url = setImageCache.get(setKey)
  if (url === undefined) {
    try {
      url = discDefIcon(setKey as any)
      if (url) {
        setImageCache.set(setKey, url)
        const img = new Image()
        img.src = url
      }
    } catch {
      setImageCache.set(setKey, '')
      return undefined
    }
  }
  return url || undefined
}

const CENTER_CSS =
  'display:flex;justify-content:center;align-items:center;gap:4px;height:100%'

function centeredDiv(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText = CENTER_CSS
  return div
}

function createImg(src: string, size = 26): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.width = size
  img.height = size
  img.style.borderRadius = '4px'
  img.style.objectFit = 'cover'
  return img
}

export class DiscSetCellRenderer implements ICellRendererComp {
  private eGui!: HTMLElement
  init(params: ICellRendererParams) {
    const data = params.data as { disc?: { setKey?: string } } | undefined
    if (!data) {
      this.eGui = document.createElement('span')
      return
    }
    const div = centeredDiv()
    const setKey = data.disc?.setKey
    if (setKey) {
      const url = getSetImage(setKey)
      if (url) div.appendChild(createImg(url))
    }
    this.eGui = div
  }
  getGui() {
    return this.eGui
  }
  refresh() {
    return false
  }
}

const rarityHex: Record<DiscRarityKey, string> = {
  S: '#FF9100',
  A: '#E900FF',
  B: '#14a9fe',
}

export class RarityCellRenderer implements ICellRendererComp {
  private eGui!: HTMLElement
  init(params: ICellRendererParams) {
    const data = params.data as
      | { disc?: { rarity?: DiscRarityKey } }
      | undefined
    const rarity = data?.disc?.rarity
    const span = document.createElement('span')
    span.style.cssText = `font-weight:700;color:${rarity ? rarityHex[rarity] : '#fff'}`
    span.textContent = rarity ?? ''
    this.eGui = span
  }
  getGui() {
    return this.eGui
  }
  refresh() {
    return false
  }
}

export class EquippedByCellRenderer implements ICellRendererComp {
  private eGui!: HTMLElement
  init(params: ICellRendererParams) {
    const data = params.data as { disc?: { location?: string } } | undefined
    const location = data?.disc?.location
    const span = document.createElement('span')
    span.style.cssText = CENTER_CSS
    span.style.fontSize = '11px'
    span.style.opacity = location ? '1' : '0.45'
    span.textContent = location || '—'
    this.eGui = span
  }
  getGui() {
    return this.eGui
  }
  refresh() {
    return false
  }
}

export class MainStatCellRenderer implements ICellRendererComp {
  private eGui!: HTMLElement
  init(params: ICellRendererParams) {
    const data = params.data as { disc?: { mainStatKey?: string } } | undefined
    const mainStatKey = data?.disc?.mainStatKey
    const span = document.createElement('span')
    span.style.cssText = CENTER_CSS
    span.style.fontSize = '12px'
    span.textContent = mainStatKey
      ? (statKeyTextMap[mainStatKey] ?? mainStatKey)
      : ''
    this.eGui = span
  }
  getGui() {
    return this.eGui
  }
  refresh() {
    return false
  }
}

export function formatSubstat(p: ValueFormatterParams): string {
  const v = p.value
  if (v == null) return ''
  return String(v)
}

export function formatPercent(p: ValueFormatterParams): string {
  const v = p.value
  if (v == null) return ''
  if (typeof v !== 'number' || !isFinite(v)) return ''
  return `${(v * 100).toFixed(1)}%`
}

export function formatFloor(p: ValueFormatterParams): string {
  const v = p.value
  if (v == null) return ''
  if (typeof v !== 'number') return ''
  return String(Math.floor(v))
}

export function formatMainStatValue(p: ValueFormatterParams): string {
  const v = p.value
  if (v == null || typeof v !== 'number') return ''
  return String(Math.floor(v))
}

export { discRarityColor }
