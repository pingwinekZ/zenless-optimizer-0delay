import {
  CheckIcon,
  CloseButton,
  Combobox,
  Group,
  Input,
  Pill,
  PillsInput,
  useCombobox,
} from '@mantine/core'
import { useMemo, useState } from 'react'
import classes from './MultiSelectPills.module.css'

type SimpleOption = { value: string; label: string }
type DataItem = SimpleOption

const compactPillStyle = { '--pill-height': '20px' }

export function MultiSelectPills({
  data,
  value,
  onChange,
  placeholder,
  clearable = false,
  maxDisplayedValues = 2,
  style,
  leftSection,
  leftSectionWidth,
  renderOption,
  size,
}: {
  data: DataItem[]
  value: string[]
  onChange: (val: string[]) => void
  placeholder?: string
  clearable?: boolean
  maxDisplayedValues?: number
  style?: React.CSSProperties
  leftSection?: React.ReactNode
  leftSectionWidth?: number
  renderOption?: (option: SimpleOption, active: boolean) => React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}) {
  const compact = size === 'xs'
  const compactHeight = compact ? 30 : undefined

  const heightStyles = useMemo(() => {
    if (compactHeight == null) return undefined
    const inputStyle: React.CSSProperties = {
      minHeight: compactHeight,
      height: compactHeight,
      paddingTop: 0,
      paddingBottom: 0,
      display: 'flex',
      alignItems: 'center',
      ...(leftSectionWidth != null
        ? { paddingLeft: leftSectionWidth + 4 }
        : {}),
    }
    return { input: inputStyle }
  }, [compactHeight, leftSectionWidth])

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  })

  const [search, setSearch] = useState('')

  const labelMap = useMemo(
    () => new Map(data.map((o) => [o.value, o.label])),
    [data]
  )

  const handleValueSelect = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
    )
  }

  const handleValueRemove = (val: string) => {
    onChange(value.filter((v) => v !== val))
  }

  const max = maxDisplayedValues
  const visibleValues =
    max === 0 ? [] : value.slice(0, max >= value.length ? max : max - 1)
  const overflowCount = value.length - visibleValues.length

  const pillStyle = compactHeight != null ? compactPillStyle : undefined
  const pills = visibleValues.map((item) => (
    <Pill
      key={item}
      style={pillStyle}
      withRemoveButton
      onRemove={() => handleValueRemove(item)}
    >
      {labelMap.get(item) ?? item}
    </Pill>
  ))

  const searchLower = search.toLowerCase().trim()

  function matchesSearch(opt: SimpleOption) {
    return !searchLower || opt.label.toLowerCase().includes(searchLower)
  }

  function renderOptionItem(opt: SimpleOption) {
    const active = value.includes(opt.value)
    return (
      <Combobox.Option
        value={opt.value}
        key={opt.value}
        active={active}
        className={active ? classes.activeOption : undefined}
      >
        <Group gap="sm" justify="space-between" wrap="nowrap">
          <span>{renderOption ? renderOption(opt, active) : opt.label}</span>
          {active && <CheckIcon size={12} />}
        </Group>
      </Combobox.Option>
    )
  }

  const showClear = clearable && value.length > 0

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput
          pointer
          size={compact ? undefined : size}
          styles={heightStyles}
          onClick={() => combobox.toggleDropdown()}
          leftSection={leftSection}
          leftSectionWidth={leftSectionWidth}
          rightSection={
            showClear ? (
              <CloseButton
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange([])
                }}
              />
            ) : undefined
          }
          style={style}
        >
          <Pill.Group
            style={{
              flexWrap: 'nowrap',
              overflow: 'hidden',
              alignItems: 'center',
              gap: compactHeight != null ? 4 : undefined,
            }}
          >
            {value.length > 0 ? (
              <>
                {pills}
                {overflowCount > 0 && (
                  <Pill style={pillStyle}>+{overflowCount}</Pill>
                )}
              </>
            ) : (
              !search && (
                <Input.Placeholder
                  style={{
                    height: 'var(--pill-height, 22px)',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'absolute',
                  }}
                >
                  {placeholder}
                </Input.Placeholder>
              )
            )}

            <Combobox.EventsTarget>
              <PillsInput.Field
                type={combobox.dropdownOpened ? undefined : 'hidden'}
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value)
                  combobox.updateSelectedOptionIndex()
                }}
                onBlur={() => combobox.closeDropdown()}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Backspace' &&
                    value.length > 0 &&
                    !search
                  ) {
                    event.preventDefault()
                    handleValueRemove(value[value.length - 1])
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options style={{ overflowY: 'auto' }}>
          {combobox.dropdownOpened &&
            data.filter(matchesSearch).map(renderOptionItem)}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
