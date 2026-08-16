import { TextInput } from '@mantine/core'
import { useState } from 'react'
import { usePrev } from '../hooks'

/**
 * A text input that only triggers `onChange` when it is blurred (unfocused) or if not multi-line, the enter key.
 */
export function TextFieldLazy<T extends string | undefined | null>({
  value: valueProp,
  onChange,
  ...props
}: {
  value: T
  onChange: (value: T) => void
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChange'>) {
  const [value, setValue] = useState(valueProp)

  if (usePrev(valueProp) !== valueProp) setValue(valueProp)

  const saveValue = () => onChange(value)

  return (
    <TextInput
      value={value ?? ''}
      onChange={(e) => setValue(e.currentTarget.value as T)}
      onBlur={saveValue}
      onKeyDown={(e) => e.key === 'Enter' && saveValue()}
      {...(props as any)}
    />
  )
}
