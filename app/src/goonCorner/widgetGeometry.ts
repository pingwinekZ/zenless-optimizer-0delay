/**
 * Geometry maths for the Goon Corner widget, kept pure (the viewport is passed
 * in) so it can be unit-tested without a DOM.
 */

export interface GoonGeometry {
  x: number
  y: number
  w: number
  h: number
}

export interface ViewportSize {
  width: number
  height: number
}

export const DEFAULT_SIZE = 500
export const MIN_WIDTH = 320
export const MIN_HEIGHT = 400
export const HEADER_HEIGHT = 34
export const COLLAPSED_WIDTH = 260
export const VIEWPORT_MARGIN = 16

/** Width of the widget that must stay grabbable while dragging. */
const DRAG_KEEP = 80

/** Bottom-right docked default for a first run. */
export function defaultGeometry(viewport: ViewportSize): GoonGeometry {
  const w = Math.min(
    DEFAULT_SIZE,
    Math.max(MIN_WIDTH, viewport.width - VIEWPORT_MARGIN * 2)
  )
  const h = Math.min(
    DEFAULT_SIZE,
    Math.max(MIN_HEIGHT, viewport.height - VIEWPORT_MARGIN * 2)
  )
  return {
    w,
    h,
    x: Math.max(0, viewport.width - w - VIEWPORT_MARGIN),
    y: Math.max(0, viewport.height - h - VIEWPORT_MARGIN),
  }
}

/**
 * Clamp a geometry so the whole box sits inside the viewport.
 *
 * Drag clamping only guarantees the collapsed header is grabbable, so a widget
 * parked in a corner can overflow once its body is shown. Clamping fixes that
 * by growing back toward the centre: a box hanging off the right/bottom edge
 * lands on `x = width - w` / `y = height - h`, which pins that edge in place.
 */
export function fitIntoView(
  geometry: GoonGeometry,
  viewport: ViewportSize
): GoonGeometry {
  return {
    ...geometry,
    x: Math.min(
      Math.max(0, geometry.x),
      Math.max(0, viewport.width - geometry.w)
    ),
    y: Math.min(
      Math.max(0, geometry.y),
      Math.max(0, viewport.height - geometry.h)
    ),
  }
}

/**
 * Drag clamp: keep `DRAG_KEEP` px of the widget on screen so it can always be
 * dragged back, even when the caller deliberately parks it at an edge.
 */
export function clampDragPosition(
  x: number,
  y: number,
  viewport: ViewportSize
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(0, x), Math.max(0, viewport.width - DRAG_KEEP)),
    y: Math.min(Math.max(0, y), Math.max(0, viewport.height - HEADER_HEIGHT)),
  }
}
