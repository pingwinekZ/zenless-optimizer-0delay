import { Button, Flex, Select, Switch } from '@mantine/core'
import { IconCircleMinus, IconCirclePlus } from '@tabler/icons-react'
import { memo, useMemo } from 'react'
import type { TeamConditional } from '../../db'
import { getConditional } from '../../formula'
import { NumConditionalRow } from '../Optimize/conditionalUtils'
import {
  buttonStyle,
  comboBoxWidth,
  comboColumnStyle,
  comboRowStyle,
} from './comboDrawerConstants'
import {
  ComboSheetIcon,
  ComboSheetName,
  CondLabelWithHover,
  comboCondLabel,
  isComboRowLocked,
} from './comboLabels'
import {
  derivePartitions,
  hashOf,
  useComboDrawerStore,
} from './useComboDrawerStore'

const flexRow: React.CSSProperties = { display: 'flex' }

export const boxWidth = comboBoxWidth

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
      style={{
        width: boxWidth,
        boxSizing: 'border-box',
        marginLeft: -1,
        marginTop: -1,
      }}
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
  /** Locked rows (e.g. mindscape requirement unmet) skip edits. */
  locked?: boolean
}

export function cellKey(key: CellKey): string {
  return JSON.stringify(key)
}

function BooleanRow({
  cond,
  locked,
}: {
  cond: TeamConditional
  locked: boolean
}) {
  const hash = hashOf(cond)
  const def = useComboDrawerStore((s) => s.defaults[hash] ?? 0)
  const arr = useComboDrawerStore((s) => s.values[hash])
  const setBooleanDefault = useComboDrawerStore((s) => s.setBooleanDefault)
  const actionCount = useComboDrawerStore((s) => s.hits.length)
  const members = useComboDrawerStore((s) => s.members)

  const display = useMemo(() => [def, ...(arr ?? [])], [def, arr])
  const boxValues = useMemo(() => display.map(() => 1), [display])
  const dataKeys = useMemo(
    () =>
      display.map((_, i) =>
        cellKey({
          hash,
          index: i,
          kind: 'bool',
          value: i === 0 ? def : 0,
          locked,
        })
      ),
    [hash, display, def, locked]
  )

  return (
    <div style={comboRowStyle}>
      <Flex style={{ width: 275, marginRight: 10 }} align="center">
        <Flex
          w={210}
          align="center"
          style={locked ? { opacity: 0.5 } : undefined}
        >
          <CondLabelWithHover
            sheet={cond.sheet}
            condKey={cond.condKey}
            members={members}
          >
            <Switch
              size="xs"
              checked={def !== 0}
              disabled={locked}
              onChange={(e) =>
                setBooleanDefault(hash, e.currentTarget.checked ? 1 : 0)
              }
              label={comboCondLabel(cond.sheet, cond.condKey)}
            />
          </CondLabelWithHover>
        </Flex>
      </Flex>
      <BoxArray
        values={display.map((v) => (v !== 0 ? 1 : 0))}
        boxValues={boxValues}
        actionCount={actionCount}
        dataKeys={dataKeys}
        partition={false}
        unselectable={locked}
      />
    </div>
  )
}

function PartitionRow({
  cond,
  partitionValue,
  isDefault,
  locked,
}: {
  cond: TeamConditional
  partitionValue: number
  isDefault: boolean
  locked: boolean
}) {
  const hash = hashOf(cond)
  const def = useComboDrawerStore((s) => s.defaults[hash] ?? 0)
  const arr = useComboDrawerStore((s) => s.values[hash] ?? EMPTY_VALUES)
  const setPartitionValue = useComboDrawerStore((s) => s.setPartitionValue)
  const addPartition = useComboDrawerStore((s) => s.addPartition)
  const deletePartition = useComboDrawerStore((s) => s.deletePartition)
  const actionCount = useComboDrawerStore((s) => s.hits.length)
  const members = useComboDrawerStore((s) => s.members)
  const condData = getConditional(cond.sheet as never, cond.condKey)

  const display = useMemo(() => [def, ...arr], [def, arr])
  const boxValues = useMemo(
    () => display.map(() => partitionValue),
    [display, partitionValue]
  )
  const dataKeys = useMemo(
    () =>
      display.map((_, i) =>
        cellKey({
          hash,
          index: i,
          kind: 'partition',
          value: partitionValue,
          locked,
        })
      ),
    [hash, display, partitionValue, locked]
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
        <div
          style={{
            width: 210,
            ...(locked ? { opacity: 0.5 } : undefined),
          }}
        >
          <CondLabelWithHover
            sheet={cond.sheet}
            condKey={cond.condKey}
            members={members}
          >
            {condData?.type === 'list' ? (
              <>
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {comboCondLabel(cond.sheet, cond.condKey)}
                </div>
                <Select
                  size="xs"
                  disabled={locked}
                  data={condData.list.map((label, i) => ({
                    value: String(i),
                    label,
                  }))}
                  value={String(partitionValue)}
                  onChange={(v) =>
                    v !== null &&
                    setPartitionValue(hash, partitionValue, Number(v))
                  }
                  aria-label={cond.condKey}
                />
              </>
            ) : (
              <NumConditionalRow
                label={comboCondLabel(cond.sheet, cond.condKey)}
                value={partitionValue}
                min={condData?.type === 'num' ? (condData.min ?? 0) : 0}
                max={condData?.type === 'num' ? (condData.max ?? 10) : 10}
                step={condData?.type === 'num' && !condData.int_only ? 0.1 : 1}
                onChange={(v) => setPartitionValue(hash, partitionValue, v)}
                disabled={locked}
              />
            )}
          </CondLabelWithHover>
        </div>
        <Button
          variant="transparent"
          p={0}
          disabled={locked}
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
        unselectable={locked}
      />
    </div>
  )
}

function NumberOrSelectRow({
  cond,
  locked,
}: {
  cond: TeamConditional
  locked: boolean
}) {
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
          locked={locked}
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
  const members = useComboDrawerStore((s) => s.members)
  const locked = isComboRowLocked(cond, members)
  if (!condData || condData.type === 'bool')
    return <BooleanRow cond={cond} locked={locked} />
  return <NumberOrSelectRow cond={cond} locked={locked} />
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
      <div
        style={{
          width: 110,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ComboSheetIcon sheetKey={sheet} />
        <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
          <ComboSheetName sheetKey={sheet} />
        </div>
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
