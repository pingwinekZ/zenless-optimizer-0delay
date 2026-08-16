/**
 * Vanilla JS cell renderers for AG Grid in the Optimizer grid.
 *
 * These use the ICellRendererComp pattern (getGui) instead of React components
 * to avoid React mount/unmount overhead during grid scroll virtualization.
 */
import type { ICellRendererComp, ICellRendererParams } from 'ag-grid-community'
import { discDefIcon } from '../../assets'

// ── Disc Set Image Cache ──
// Pre-warm disc set images from the assets module
const setImageCache = new Map<string, string>()

function getSetImage(setKey: string): string | undefined {
  let url = setImageCache.get(setKey)
  if (url === undefined) {
    try {
      url = discDefIcon(setKey as any)
      if (url) {
        setImageCache.set(setKey, url)
        // Pre-warm browser image cache
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

// ── DOM helpers ──

const CELL_CENTER_CSS =
  'display:flex;justify-content:center;align-items:center;gap:4px;height:100%'

function centeredDiv(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText = CELL_CENTER_CSS
  return div
}

function createImg(src: string, width = 28, height = 28): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.width = width
  img.height = height
  img.style.borderRadius = '6px'
  img.style.objectFit = 'cover'
  return img
}

// ── Disc Set Cell Renderer ──
// Shows up to 2 disc set icons (identifying the 2-set and 4-set bonuses)

export class DiscSetCellRenderer implements ICellRendererComp {
  private eGui!: HTMLElement

  init(params: ICellRendererParams) {
    const data = params.data as { discSetIds?: string[] } | undefined
    if (!data) {
      this.eGui = document.createElement('span')
      return
    }

    const div = centeredDiv()

    // If we have pre-computed set keys, use them
    const discSetIds = data.discSetIds ?? []
    if (discSetIds.length > 0) {
      for (const setKey of discSetIds.slice(0, 2)) {
        const url = getSetImage(setKey)
        if (url) {
          div.appendChild(createImg(url))
        }
      }
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
