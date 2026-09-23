/** Diff arrow palette + number formatting shared by the analysis cards. */

export const DIFF_GREEN = '#95ef90'
export const DIFF_RED = '#ff97a9'

export function arrowColor(increase: boolean): string {
  return increase ? DIFF_GREEN : DIFF_RED
}

export function arrowDirection(increase: boolean): string {
  return increase ? '▲' : '▼'
}

/** Rounded, locale-grouped integer (`1234567` → `1,234,567`). */
export function formatInt(value: number): string {
  return Math.round(value).toLocaleString()
}

/**
 * Drop insignificant trailing zeros: `10.00` → `10`, `10.50` → `10.5`.
 * Whole numbers (no decimal point) are returned untouched.
 */
export function trimTrailingZeros(text: string): string {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text
}

/** Ratio → `12.3%` / `10%` (no padded zeros). */
export function formatPercent(value: number, digits = 1): string {
  return `${trimTrailingZeros((value * 100).toFixed(digits))}%`
}

/**
 * Buff-row value: percent buffs read as `10%` / `7.5%`, flat stats as rounded
 * locale-grouped integers (matching hsr-optimizer's `formatBuffValue`).
 */
export function formatBuffValue(
  value: number,
  isPercent: boolean,
  digits = 2
): string {
  if (isPercent) return `${trimTrailingZeros((value * 100).toFixed(digits))}%`
  return formatInt(value)
}

/** Signed rounded integer (`+12` / `−12`). */
export function formatSignedInt(value: number): string {
  return `${value >= 0 ? '+' : '−'}${formatInt(Math.abs(value))}`
}
