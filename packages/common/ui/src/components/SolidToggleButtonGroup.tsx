import { SegmentedControl } from '@mantine/core'

export type SolidToggleButtonGroupProps = {
  baseColor?: string
  selectedColor?: string
  fullWidth?: boolean
  value?: string | string[]
  onChange?: (value: string) => void
  exclusive?: boolean
  disabled?: boolean
  size?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function SolidToggleButtonGroup({
  value,
  onChange,
  children,
  ...props
}: SolidToggleButtonGroupProps) {
  const data = Array.isArray(children)
    ? children.map((child: any) => ({
        value: child.props.value,
        label: child.props.children,
      }))
    : []

  return (
    <SegmentedControl
      value={value}
      onChange={(v) => onChange?.(v)}
      data={data}
      {...(props as any)}
    />
  )
}
