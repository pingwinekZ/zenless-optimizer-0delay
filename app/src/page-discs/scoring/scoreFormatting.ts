export function formatPct(value: number, digits = 1): string {
  if (!isFinite(value)) return ''
  return `${(value * 100).toFixed(digits)}%`
}

export function formatScorePct(value: number): string {
  return formatPct(value, 1)
}
