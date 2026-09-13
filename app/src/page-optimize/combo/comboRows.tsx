import { Button, Flex, Select, Slider, Switch } from '@mantine/core'
import { IconCircleMinus, IconCirclePlus } from '@tabler/icons-react'
import { memo, useMemo } from 'react'
import type { TeamConditional } from '../../db'
import { getConditional } from '../../formula'
import { condLabel } from '../Optimize/conditionalUtils'
import {
  abilityWidth,
  buttonStyle,
  comboColumnStyle,
  comboRowStyle,
} from './comboDrawerConstants'
import {
  derivePartitions,
  hashOf,
  useComboDrawerStore,
} from './useComboDrawerStore'

const flexRow: React.CSSProperties = { display: 'flex' }

export const boxWidth = abilityWidth + 1

const BoxComponent = memo(function BoxComponent({
  active,
  index,
  disabled,
  dataKey,
  partition,
  unselectable,
}: {
  active: boolean
  index: number
  disabled: boolean
  dataKey: string
  partition: boolean
  unselectable?: boolean
}) {
  let classnames: string
  if (disabled) {
    classnames = 'disabledSelect'
  } else {
    if (unselectable) {
      classnames = active
        ? 'unselectable selected defaultShaded'
        : 'unselectable defaultShaded'
    } else {
      classnames = active ? 'selectable selected' : 'selectable'
    }
    if (index === 0) {
      classnames += ' defaultShaded'
    }
    if (partition && active) {
      classnames += ' partitionShaded'
    }
  }

  return (
    <div
      className={classnames}
      data-key={dataKey}
      style={{ width: boxWidth, marginLeft: -1, marginTop: -1 }}
    />
  )
})

function BoxArray({
  values,
  boxValues,
  actionCount,
  dataKeys,
  partition,
  unselectable,
}: {
  /** Display value per column (index 0 = default). */
  values: number[]
  /** Value this box represents per column (for active state). */
  boxValues: number[]
  actionCount: number
  dataKeys: string[]
  partition: boolean
  unselectable?: boolean
}) {
  return (
    <div style={flexRow}>
      {values.map((value, index) => (
        <BoxComponent
          dataKey={dataKeys[index]!}
          key={index}
          active={value === boxValues[index]}
          disabled={index > actionCount}
          index={index}
          partition={partition}
          unselectable={unselectable}
        />
      ))}
    </div>
  )
}

/** Stable empty array for zustand selectors (fresh literals retrigger renders). */
const EMPTY_VALUES: number[] = []

export type CellKey = {
  hash: string
  index: number
  kind: 'bool' | 'partition'
  /** Absolute value to set (bool cells use toggle direction instead). */
  value: number
}

export function cellKey(key: CellKey): string {
  return JSON.stringify(key)
}

function BooleanRow({ cond }: { cond: TeamConditional }) {
  const hash = hashOf(cond)
  const def = useComboDrawerStore((s) => s.defaults[hash] ?? 0)
  const arr = useComboDrawerStore((s) => s.values[hash])
  const setDefault = useComboDrawerStore((s) => s.setDefault)
  const actionCount = useComboDrawerStore((s) => s.hits.length)

  const display = useMemo(() => [def, ...(arr ?? [])], [def, arr])
  const boxValues = useMemo(() => display.map(() => 1), [display])
  const dataKeys = useMemo(
    () =>
      display.map((_, i) =>
        cellKey({ hash, index: i, kind: 'bool', value: i === 0 ? def : 0 })
      ),
    [hash, display, def]
  )

  return (
    <div style={comboRowStyle}>
      <Flex style={{ width: 275, marginRight: 10 }} align="center">
        <Flex w={210} align="center">
          <Switch
            size="xs"
            checked={def !== 0}
            onChange={(e) => setDefault(hash, e.currentTarget.checked ? 1 : 0)}
            label={condLabel(cond.condKey, cond.sheet)}
          />
        </Flex>
      </Flex>
      <BoxArray
        values={display.map((v) => (v !== 0 ? 1 : 0))}
        boxValues={boxValues}
        actionCount={actionCount}
        dataKeys={dataKeys}
        partition={false}
      />
    </div>
  )
}

function PartitionRow({
  cond,
  partitionValue,
  isDefault,
}: {
  cond: TeamConditional
  partitionValue: number
  isDefault: boolean
}) {
  const hash = hashOf(cond)
  const def = useComboDrawerStore((s) => s.defaults[hash] ?? 0)
  const arr = useComboDrawerStore((s) => s.values[hash] ?? EMPTY_VALUES)
  const setPartitionValue = useComboDrawerStore((s) => s.setPartitionValue)
  const addPartition = useComboDrawerStore((s) => s.addPartition)
  const deletePartition = useComboDrawerStore((s) => s.deletePartition)
  const actionCount = useComboDrawerStore((s) => s.hits.length)
  const condData = getConditional(cond.sheet as never, cond.condKey)

  const display = useMemo(() => [def, ...arr], [def, arr])
  const boxValues = useMemo(
    () => display.map(() => partitionValue),
    [display, partitionValue]
  )
  const dataKeys = useMemo(
    () =>
      display.map((_, i) =>
        cellKey({ hash, index: i, kind: 'partition', value: partitionValue })
      ),
    [hash, display, partitionValue]
  )

  const candidates = useMemo(() => {
    if (!condData || condData.type !== 'num') return []
    const min = Math.ceil(condData.min ?? 0)
    const max = Math.floor(condData.max ?? 10)
    const out: number[] = []
    for (let v = min; v <= max; v++) out.push(v)
    return out
  }, [condData])

  return (
    <div style={comboRowStyle}>
      <Flex style={{ width: 275, marginRight: 10 }} align="center" gap={5}>
        {condData?.type === 'list' ? (
          <Select
            size="xs"
            style={{ width: 210 }}
            data={condData.list.map((label, i) => ({
              value: String(i),
              label,
            }))}
            value={String(partitionValue)}
            onChange={(v) =>
              v !== null && setPartitionValue(hash, partitionValue, Number(v))
            }
            aria-label={cond.condKey}
          />
        ) : (
          <Slider
            key={`${partitionValue}`}
            style={{ width: 210 }}
            size="xs"
            min={condData?.type === 'num' ? (condData.min ?? 0) : 0}
            max={condData?.type === 'num' ? (condData.max ?? 10) : 10}
            step={condData?.type === 'num' && !condData.int_only ? 0.1 : 1}
            value={partitionValue}
            onChange={(v) => setPartitionValue(hash, partitionValue, v)}
            label={(v) => `${cond.condKey}: ${v}`}
            aria-label={cond.condKey}
          />
        )}
        <Button
          variant="transparent"
          p={0}
          leftSection={
            isDefault ? (
              <IconCirclePlus style={buttonStyle} />
            ) : (
              <IconCircleMinus style={buttonStyle} />
            )
          }
          onClick={() => {
            if (isDefault) {
              if (condData?.type === 'list') {
                addPartition(
                  hash,
                  condData.list.map((_, i) => i)
                )
              } else {
                addPartition(hash, candidates)
              }
            } else {
              deletePartition(hash, partitionValue)
            }
          }}
          aria-label={isDefault ? 'Add partition' : 'Remove partition'}
        />
      </Flex>
      <BoxArray
        values={display}
        boxValues={boxValues}
        actionCount={actionCount}
        dataKeys={dataKeys}
        partition={!isDefault}
      />
    </div>
  )
}

function NumberOrSelectRow({ cond }: { cond: TeamConditional }) {
  const hash = hashOf(cond)
  const def = useComboDrawerStore((s) => s.defaults[hash] ?? 0)
  const arr = useComboDrawerStore((s) => s.values[hash] ?? EMPTY_VALUES)
  const extra = useComboDrawerStore((s) => s.extraValues[hash] ?? EMPTY_VALUES)

  const partitions = useMemo(
    () => derivePartitions(def, arr, extra),
    [def, arr, extra]
  )

  return (
    <div style={comboColumnStyle}>
      <PartitionDivider />
      {partitions.map((value) => (
        <PartitionRow
          key={value}
          cond={cond}
          partitionValue={value}
          isDefault={value === def}
        />
      ))}
      <PartitionDivider bottom />
    </div>
  )
}

function PartitionDivider({ bottom }: { bottom?: boolean }) {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--border-subtle)',
        marginBlock: bottom ? '2px 0' : '0 2px',
        marginLeft: 285,
      }}
    />
  )
}

const groupRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 8,
  background: 'var(--layer-3)',
  borderRadius: 6,
}

function RowForCond({ cond }: { cond: TeamConditional }) {
  const condData = getConditional(cond.sheet as never, cond.condKey)
  if (!condData || condData.type === 'bool') return <BooleanRow cond={cond} />
  return <NumberOrSelectRow cond={cond} />
}

export function CondGroupRow({
  sheet,
  conds,
}: {
  sheet: string
  conds: TeamConditional[]
}) {
  return (
    <div style={groupRowStyle}>
      <div style={{ width: 80, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{sheet}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>
          {conds.length} buff{conds.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}
      >
        {conds.map((c) => (
          <RowForCond key={hashOf(c)} cond={c} />
        ))}
      </div>
    </div>
  )
}
