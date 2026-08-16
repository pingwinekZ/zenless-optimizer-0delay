import { Select } from '@mantine/core'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

export type GeneralAutocompleteOption<T extends string> = {
  key: T
  label: string
  grouper?: string | number
  color?: string
  favorite?: boolean
  alternateNames?: string[]
}

type GeneralAutocompletePropsBase<T extends string> = {
  label?: string
  toImg: (v: T) => React.JSX.Element | undefined
  toExItemLabel?: (v: T) => ReactNode
  toExLabel?: (v: T) => ReactNode
}

export type GeneralAutocompleteProps<T extends string> =
  GeneralAutocompletePropsBase<T> & {
    valueKey: T | null
    onChange: (v: T | null) => void
    options: GeneralAutocompleteOption<T>[]
  } & Omit<
      React.ComponentProps<typeof Select>,
      'data' | 'value' | 'onChange' | 'renderOption'
    >

export function GeneralAutocomplete<T extends string>({
  options,
  valueKey,
  label,
  onChange,
  toImg,
  toExItemLabel,
  ...selectProps
}: GeneralAutocompleteProps<T>) {
  const data = useMemo(
    () =>
      options.map((opt) => ({
        value: opt.key,
        label: opt.label,
        disabled: false,
      })),
    [options]
  )

  return (
    <Select
      label={label}
      data={data}
      value={valueKey}
      onChange={(v) => onChange(v as T | null)}
      searchable
      autoComplete="new-password"
      leftSection={typeof valueKey === 'string' ? toImg(valueKey) : undefined}
      {...(selectProps as any)}
    />
  )
}

export type GeneralAutocompleteMultiProps<T extends string> =
  GeneralAutocompletePropsBase<T> & {
    valueKeys: T[]
    onChange: (v: T[]) => void
    options: GeneralAutocompleteOption<T>[]
    groupBy?: (option: GeneralAutocompleteOption<T>) => string
    renderGroup?: (params: {
      group: string
      children: React.ReactNode
    }) => React.ReactElement | null
  } & Omit<
      React.ComponentProps<typeof Select>,
      'data' | 'value' | 'onChange' | 'renderOption' | 'groupBy' | 'renderGroup'
    >

export function GeneralAutocompleteMulti<T extends string>({
  options,
  valueKeys: keys,
  label,
  onChange,
  toImg,
  toExItemLabel,
  groupBy,
  renderGroup,
  ...selectProps
}: GeneralAutocompleteMultiProps<T>) {
  const data = useMemo(
    () =>
      options.map((opt) => ({
        value: opt.key,
        label: opt.label,
        disabled: false,
        grouper: opt.grouper,
      })),
    [options]
  )

  return (
    <Select
      label={label}
      data={data}
      value={keys}
      onChange={(v) => {
        if (v === null) return onChange([])
        const vals = Array.isArray(v) ? v : [v]
        onChange(vals as T[])
      }}
      searchable
      multiple
      autoComplete="new-password"
      {...(groupBy ? { groupBy: groupBy as any } : {})}
      {...(renderGroup ? { renderGroup: renderGroup as any } : {})}
      {...(selectProps as any)}
    />
  )
}
