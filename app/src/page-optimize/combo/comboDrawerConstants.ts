import type { CSSProperties } from 'react'

export const abilityGap = 5
export const abilityWidth = 88 - abilityGap

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
