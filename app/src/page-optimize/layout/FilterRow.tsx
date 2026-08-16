import { Flex } from '@mantine/core'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FormStatTextStyled } from './FormStatTextStyled'
import { InputNumberStyled } from './InputNumberStyled'

function LazyFilterInput({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: number | undefined
  onChange: (val: number | undefined) => void
  onBlur?: () => void
  disabled?: boolean
}) {
  const [local, setLocal] = useState(value ?? ('' as any))
  const ref = useRef(value)

  useEffect(() => {
    if (ref.current !== value) {
      ref.current = value
      setLocal(value ?? ('' as any))
    }
  }, [value])

  const commit = () => {
    if (local === '' || local === undefined) {
      onChange(undefined)
    } else {
      const num = Number(local)
      if (!isNaN(num)) onChange(num)
    }
    onBlur?.()
  }

  return (
    <InputNumberStyled
      hideControls
      style={{ margin: 0, width: 63 }}
      value={local}
      onChange={(val) => setLocal(val)}
      onBlur={commit}
      disabled={disabled}
    />
  )
}

export function FilterRow({
  label,
  min,
  max,
  setMin,
  setMax,
  onBlurMin,
  onBlurMax,
  disabled,
}: {
  label: string | ReactNode
  min: number | undefined
  max: number | undefined
  setMin: (val: number | undefined) => void
  setMax: (val: number | undefined) => void
  onBlurMin?: () => void
  onBlurMax?: () => void
  disabled?: boolean
}) {
  return (
    <Flex justify="space-between" style={{ margin: 0 }}>
      <LazyFilterInput
        value={min}
        onChange={setMin}
        onBlur={onBlurMin}
        disabled={disabled}
      />
      <FormStatTextStyled>{label}</FormStatTextStyled>
      <LazyFilterInput
        value={max}
        onChange={setMax}
        onBlur={onBlurMax}
        disabled={disabled}
      />
    </Flex>
  )
}
