import { Button, ButtonGroup } from '@mantine/core'
import type { ReactNode } from 'react'
import {
  CustomNumberInput,
  CustomNumberInputButtonGroupWrapper,
} from './CustomNumberInput'
import { TextButton } from './TextButton'

type StatInputInput = {
  name: ReactNode
  children?: ReactNode
  value: number
  placeholder?: string
  defaultValue?: number
  onValueChange: (newValue: number | undefined) => void
  percent?: boolean
  disabled?: boolean
  onReset?: () => void
}

export function StatInput({
  name,
  children,
  value,
  placeholder,
  defaultValue = 0,
  onValueChange,
  percent = false,
  disabled = false,
  onReset,
  ...restProps
}: StatInputInput) {
  return (
    <ButtonGroup {...(restProps as any)} style={{ display: 'flex' }}>
      {children}
      <TextButton style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
        {name}
      </TextButton>
      <CustomNumberInputButtonGroupWrapper
        style={{ flexBasis: '10em', flexGrow: 1 }}
      >
        <CustomNumberInput
          sx={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}
          inputProps={{ sx: { textAlign: 'right' } } as any}
          float={percent}
          placeholder={placeholder}
          value={value}
          onChange={onValueChange}
          disabled={disabled}
          endAdornment={percent ? '%' : undefined}
        />
      </CustomNumberInputButtonGroupWrapper>
      <Button
        style={{ flexShrink: 2 } as any}
        size="compact-sm"
        color="gray"
        onClick={() => (onReset ? onReset() : onValueChange(defaultValue))}
        disabled={disabled || value === defaultValue}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </Button>
    </ButtonGroup>
  )
}
