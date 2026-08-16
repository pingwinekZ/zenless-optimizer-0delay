import { Button } from '@mantine/core'

type SolidColoredToggleButtonPartial = {
  baseColor?: string
  selectedColor?: string
  style?: React.CSSProperties
}

export type SolidColoredToggleButtonProps = SolidColoredToggleButtonPartial & {
  selected?: boolean
  value?: string
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function SolidColoredToggleButton({
  baseColor = 'secondary',
  selectedColor = 'success',
  selected = false,
  children,
  ...props
}: SolidColoredToggleButtonProps) {
  const color = selected ? selectedColor : baseColor
  return (
    <Button
      variant="filled"
      color={color}
      {...(props as any)}
      data-selected={selected || undefined}
    >
      {children}
    </Button>
  )
}
