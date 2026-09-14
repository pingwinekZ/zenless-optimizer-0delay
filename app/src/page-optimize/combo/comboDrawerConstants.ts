import type { CSSProperties } from 'react'
export const abilityGap = 5

export const abilityWidth = 88 - abilityGap

/** Width of the per-hit toggle cells in the grid (headers stay readable). */
export const comboBoxWidth = 40

export const buttonStyle = {
  fontSize: 20,
}

// Shared layout styles for combo conditional rows (plain divs replacing Mantine Flex)
export const comboRowStyle: CSSProperties = { display: 'flex', height: 45 }
export const comboColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}
