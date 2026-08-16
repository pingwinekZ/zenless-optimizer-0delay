import {
  ActionIcon,
  Box,
  Button,
  CardSection,
  Divider,
  MenuItem,
  Text,
} from '@mantine/core'
import { IconCheckbox, IconSquare, IconTrash } from '@tabler/icons-react'
import {
  CardThemed,
  ColorText,
  DropdownButton,
  NumberInputLazy,
} from '@zenless-optimizer/common/ui'
import { type UnArray } from '@zenless-optimizer/common/util'
import { useCallback, useContext } from 'react'
import type { AttributeKey } from '../../consts'
import { allAttributeKeys } from '../../consts'
import type { StatFilterTag } from '../../db'
import {
  newStatFilterTag,
  type StatFilterStatKey,
  type StatFilters,
  statFilterStatKeys,
  statFilterStatQtKeys,
} from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import type { Tag } from '../../formula'
import { qtMap, TagDisplay } from '../../formula-ui'
import { AttributeName, StatDisplay } from '../../ui'

export function StatFilterCard({ disabled = false }: { disabled?: boolean }) {
  const {
    optConfigId,
    optConfig: { statFilters },
  } = useContext(OptConfigContext)

  const { database } = useDatabaseContext()

  const setStatFilters = useCallback(
    (statFilters: StatFilters) =>
      database.optConfigs.set(optConfigId, { statFilters }),
    [database, optConfigId]
  )
  return (
    <CardThemed bgt="light">
      <CardSection
        style={{
          display: 'flex',
          gap: 1,
          justifyContent: 'space-between',
          flexDirection: 'column',
        }}
      >
        <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text fw={700}>Stat Filter</Text>
        </Box>
      </CardSection>
      <Divider />
      <CardSection>
        <StatFilterDisplay
          statFilters={statFilters}
          setStatFilters={setStatFilters}
          disabled={disabled}
        />
      </CardSection>
    </CardThemed>
  )
}

export function StatFilterDisplay({
  statFilters,
  setStatFilters,
  disabled = false,
}: {
  statFilters: StatFilters
  setStatFilters: (statFilters: StatFilters) => void
  disabled: boolean
}) {
  const setTarget = useCallback(
    (tag: StatFilterTag, oldIndex?: number) => {
      const statFilters_ = structuredClone(statFilters)
      if (typeof oldIndex === 'undefined')
        statFilters_.push({
          tag,
          value: 0,
          isMax: false,
          disabled: false,
        })
      else statFilters_[oldIndex].tag = tag
      setStatFilters(statFilters_)
    },
    [setStatFilters, statFilters]
  )

  const delTarget = useCallback(
    (index: number) => {
      const statFilters_ = structuredClone(statFilters)
      statFilters_.splice(index, 1)
      setStatFilters(statFilters_)
    },
    [setStatFilters, statFilters]
  )
  const setTargetValue = useCallback(
    (index: number, value: number) => {
      const statFilters_ = structuredClone(statFilters)
      statFilters_[index].value = value
      setStatFilters(statFilters_)
    },
    [setStatFilters, statFilters]
  )
  const setTargetisMax = useCallback(
    (index: number, isMax: boolean) => {
      const statFilters_ = structuredClone(statFilters)
      statFilters_[index].isMax = isMax
      setStatFilters(statFilters_)
    },
    [setStatFilters, statFilters]
  )
  const setTargetDisabled = useCallback(
    (index: number, disabled: boolean) => {
      const statFilters_ = structuredClone(statFilters)
      statFilters_[index].disabled = disabled
      setStatFilters(statFilters_)
    },
    [setStatFilters, statFilters]
  )
  const newTarget = (q: StatFilterStatKey) => setTarget(newStatFilterTag(q))

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {statFilters.map((statFilter, i) => (
        <StatFilterItem
          statFilter={statFilter}
          delTarget={() => delTarget(i)}
          setTarget={(tag) => setTarget(tag, i)}
          setTargetValue={(val) => setTargetValue(i, val)}
          setTargetisMax={(isMax) => setTargetisMax(i, isMax)}
          setDisabled={(disabled) => setTargetDisabled(i, disabled)}
          disabled={disabled}
          key={i + JSON.stringify(statFilter)}
        />
      ))}
      <InitialStatDropdown onSelect={newTarget} />
    </Box>
  )
}

function InitialStatDropdown({
  tag,
  onSelect,
}: {
  tag?: Tag
  onSelect: (key: (typeof statFilterStatKeys)[number]) => void
}) {
  return (
    <DropdownButton
      title={(tag && <TagDisplay tag={tag} />) ?? 'Add Stat Filter'}
    >
      {statFilterStatKeys.map((statKey) => (
        <MenuItem key={statKey} onClick={() => onSelect(statKey)}>
          <StatDisplay statKey={statKey} showPercent />
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function StatFilterItem({
  statFilter,
  delTarget,
  setTarget,
  setTargetValue,
  setTargetisMax,
  setDisabled,
  disabled,
}: {
  statFilter: UnArray<StatFilters>
  delTarget: () => void
  setTarget: (tag: StatFilterTag) => void
  setTargetValue: (value: number) => void
  setTargetisMax: (isMax: boolean) => void
  setDisabled: (disabled: boolean) => void
  disabled: boolean
}) {
  const { tag, value, isMax, disabled: valueDisabled } = statFilter

  return (
    <CardThemed>
      <CardSection style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          color={valueDisabled ? 'gray' : 'green'}
          onClick={() => setDisabled(!valueDisabled)}
          disabled={disabled}
          size="compact-sm"
        >
          {valueDisabled ? (
            <IconSquare size={16} />
          ) : (
            <IconCheckbox size={16} />
          )}
        </Button>
        <Text>
          <TagDisplay tag={tag} />
        </Text>
        <QtDropdown qt={tag.qt} setQt={(qt) => setTarget({ ...tag, qt })} />
        {tag.q === 'dmg_' && (
          <AttributeDropdown
            tag={tag}
            setAttribute={(ele) => {
              const { attribute, ...rest } = tag
              setTarget(ele ? { ...rest, attribute: ele } : rest)
            }}
          />
        )}
        <Button onClick={() => setTargetisMax(!isMax)} size="compact-sm">
          <strong>{isMax ? 'MAX' : 'MIN'}</strong>
        </Button>

        <NumberInputLazy
          float
          value={value}
          style={{ flexBasis: 150, flexGrow: 1, height: '100%' }}
          disabled={disabled}
          onChange={setTargetValue}
          placeholder="Stat Value"
          size="small"
        />
        <ActionIcon aria-label="Delete Stat Constraint" onClick={delTarget}>
          <IconTrash size={16} />
        </ActionIcon>
      </CardSection>
    </CardThemed>
  )
}
function AttributeDropdown({
  tag,
  setAttribute,
}: {
  tag: Tag
  setAttribute: (ele: AttributeKey | null) => void
}) {
  return (
    <DropdownButton
      title={
        tag.attribute ? (
          <AttributeName attribute={tag.attribute} />
        ) : (
          'No Attribute'
        )
      }
      color={tag.attribute!}
    >
      <MenuItem onClick={() => setAttribute(null)}>No Attribute</MenuItem>
      {allAttributeKeys.map((attr) => (
        <MenuItem key={attr} onClick={() => setAttribute(attr)}>
          <ColorText color={attr}>
            <AttributeName attribute={attr} />
          </ColorText>
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function QtDropdown({
  qt,
  setQt,
}: {
  qt: Tag['qt']
  setQt: (qt: (typeof statFilterStatQtKeys)[number]) => void
}) {
  return (
    <DropdownButton title={qt && qtMap[qt as keyof typeof qtMap]}>
      {statFilterStatQtKeys.map((q) => (
        <MenuItem
          key={q}
          onClick={() => setQt(q)}
          style={
            qt === q
              ? { backgroundColor: 'var(--mantine-color-blue-light)' }
              : undefined
          }
          disabled={qt === q}
        >
          {qtMap[q]}
        </MenuItem>
      ))}
    </DropdownButton>
  )
}
