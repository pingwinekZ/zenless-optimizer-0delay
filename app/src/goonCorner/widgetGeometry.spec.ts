import type { GoonGeometry } from './widgetGeometry'
import {
  clampDragPosition,
  defaultGeometry,
  fitIntoView,
  HEADER_HEIGHT,
} from './widgetGeometry'

const DESKTOP = { width: 1280, height: 800 }

describe('defaultGeometry', () => {
  it('docks 500x500 into the bottom-right of a desktop viewport', () => {
    expect(defaultGeometry(DESKTOP)).toEqual({
      x: 764,
      y: 284,
      w: 500,
      h: 500,
    })
  })

  it('shrinks to fit a viewport smaller than the default size', () => {
    const geometry = defaultGeometry({ width: 400, height: 500 })
    expect(geometry.w).toBe(368)
    expect(geometry.h).toBe(468)
    // Fully visible, with the margin on both edges.
    expect(geometry.x + geometry.w).toBe(384)
    expect(geometry.y + geometry.h).toBe(484)
  })
})

describe('fitIntoView', () => {
  it('leaves an in-bounds box alone', () => {
    const docked: GoonGeometry = { x: 764, y: 284, w: 500, h: 500 }
    expect(fitIntoView(docked, DESKTOP)).toEqual(docked)
  })

  it('pulls an overflowing box back toward the centre', () => {
    // A collapsed bar dragged into the bottom-right corner, then expanded.
    const overflowing: GoonGeometry = { x: 1200, y: 766, w: 500, h: 500 }
    expect(fitIntoView(overflowing, DESKTOP)).toEqual({
      x: 780,
      y: 300,
      w: 500,
      h: 500,
    })
  })

  it('clamps to the origin when the widget is wider than the viewport', () => {
    const wide: GoonGeometry = { x: 764, y: 284, w: 500, h: 500 }
    expect(fitIntoView(wide, { width: 640, height: 480 })).toEqual({
      x: 140,
      y: 0,
      w: 500,
      h: 500,
    })
  })

  it('never yields negative coordinates', () => {
    const offScreen: GoonGeometry = { x: -50, y: -20, w: 500, h: 500 }
    expect(fitIntoView(offScreen, DESKTOP)).toEqual({
      x: 0,
      y: 0,
      w: 500,
      h: 500,
    })
  })
})

describe('clampDragPosition', () => {
  it('keeps the header grabbable at every edge', () => {
    expect(clampDragPosition(-40, -40, DESKTOP)).toEqual({ x: 0, y: 0 })
    expect(clampDragPosition(9999, 9999, DESKTOP)).toEqual({
      x: DESKTOP.width - 80,
      y: DESKTOP.height - HEADER_HEIGHT,
    })
  })

  it('does not clamp a position already on screen', () => {
    expect(clampDragPosition(764, 284, DESKTOP)).toEqual({ x: 764, y: 284 })
  })
})
