import { NumberInput } from '@mantine/core'
import type { FocusEvent } from 'react'
import { useEffect, useState } from 'react'

/**
 * A number input that only triggers `onChange` when it is blurred (unfocused) or if not multi-line, the enter key.
 * Allows parsing of numbers as both integers and float, respects `inputProps.min` and `inputProps.max`.
 */
export function NumberInputLazy({
  value: valueProp,
  onChange,
  float = false,
  ...props
}: {
  value: number
  float?: boolean
  onChange: (value: number) => void
} & Omit<React.ComponentProps<typeof NumberInput>, 'value' | 'onChange'>) {
  const [value, setValue] = useState(valueProp?.toString())
  const min = (props as any).min
  const max = (props as any).max

  useEffect(() => {
    setValue(valueProp?.toString())
  }, [valueProp])

  const saveValue = () => {
    const normalizedValue = float ? value.replace(',', '.') : value
    let num = float ? parseFloat(normalizedValue) : parseInt(normalizedValue)
    if (isNaN(num)) {
      num = 0
      setValue(num.toString())
    }
    if (min !== undefined && num < min) {
      onChange(min)
      setValue(min.toString())
      return
    }
    if (max !== undefined && num > max) {
      onChange(max)
      setValue(max.toString())
      return
    }
    onChange(num)
  }

  const handleChange = (val: string | number) => {
    const strVal = String(val)
    if (strVal.match(float ? /[^0-9.,-]/ : /[^0-9-]/)) return
    setValue(strVal)
  }

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select()
  }

  return (
    <NumberInput
      value={value ? Number(value) : 0}
      onChange={handleChange}
      onBlur={saveValue}
      onFocus={onFocus}
      onKeyDown={(e: any) => e.key === 'Enter' && saveValue()}
      hideControls
      {...(props as any)}
      inputMode="numeric"
    />
  )
}
