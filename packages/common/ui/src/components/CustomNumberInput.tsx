import type { ButtonProps } from '@mantine/core'
import { Button, NumberInput } from '@mantine/core'
import type { KeyboardEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'

export type CustomNumberInputProps = {
  value?: number | undefined
  onChange: (newValue: number | undefined) => void
  disabled?: boolean
  float?: boolean
  allowEmpty?: boolean
  disableNegative?: boolean
  min?: number
  max?: number
  color?: string
  sx?: Record<string, any>
  placeholder?: string
  endAdornment?: string
  inputProps?: Record<string, any>
}

const Wrapper = Button.withProps({
  variant: 'filled',
  color: 'primary',
  style: { padding: 0, overflow: 'hidden' },
})

export function CustomNumberInputButtonGroupWrapper({
  children,
  ...props
}: ButtonProps) {
  return <Wrapper {...props}>{children}</Wrapper>
}

export function CustomNumberInput({
  value = 0,
  onChange,
  disabled = false,
  float = false,
  ...props
}: CustomNumberInputProps) {
  const { min, max, sx, placeholder, endAdornment, inputProps, ...restProps } =
    props as any
  const [display, setDisplay] = useState(value.toString())

  const parseFunc = useCallback(
    (val: string) => (float ? parseFloat(val) : parseInt(val)),
    [float]
  )

  const onValidate = useCallback(() => {
    const change = (v: number) => {
      setDisplay(v.toString())
      onChange(v)
    }
    const newNum = parseFunc(display) || 0
    if (min !== undefined && newNum < min) return change(min)
    if (max !== undefined && newNum > max) return change(max)
    return change(newNum)
  }, [min, max, parseFunc, onChange, display])

  useEffect(() => setDisplay(value.toString()), [value, setDisplay])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      e.key === 'Enter' && onValidate(),
    [onValidate]
  )

  return (
    <NumberInput
      value={Number(display) || 0}
      aria-label="custom-input"
      step={float ? 0.1 : 1}
      onChange={(val) => setDisplay(String(val))}
      onBlur={onValidate}
      disabled={disabled}
      onKeyDown={onKeyDown as any}
      min={min}
      max={max}
      placeholder={placeholder}
      hideControls
      style={{
        textAlign: inputProps?.sx?.textAlign as any,
        ...sx,
      }}
      {...restProps}
    />
  )
}
