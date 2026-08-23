import { ActionIcon, Box, Divider, Stack, Text } from '@mantine/core'
import { IconHelp } from '@tabler/icons-react'
import {
  BootstrapTooltip,
  type CardBackgroundColor,
  ColorText,
} from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  truncateToFixed,
  valueString,
} from '@zenless-optimizer/common/util'
import type { CalcMeta, Read, Tag } from '@zenless-optimizer/game-opt/engine'
import {
  CalcContext,
  DebugReadContext,
  TagContext,
} from '@zenless-optimizer/game-opt/formula-ui'
import type { CalcResult } from '@zenless-optimizer/pando/engine'
import { read } from '@zenless-optimizer/pando/engine'
import type { ReactNode } from 'react'
import React, { useCallback, useContext, useMemo } from 'react'
import {
  FormulaTextCacheContext,
  FormulaTextContext,
  FullTagDisplayContext,
  TagRowSxContext,
} from '../context'
import type { Field, TagField, TextField } from '../types'

const bgColorMap = {
  normal: 'var(--layer-2)',
  light: 'var(--layer-3)',
  dark: 'var(--layer-1)',
} as const

export function FieldsDisplay({
  fields,
  bgt = 'normal',
}: {
  fields: Field[]
  bgt?: CardBackgroundColor
}) {
  const palette = bgColorMap[bgt] || 'var(--layer-2)'
  return (
    <div style={{ margin: 0 }}>
      {fields.map((field, i) => (
        <div
          key={i}
          style={{
            backgroundColor: i % 2 === 0 ? palette : 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <FieldDisplay field={field} />
        </div>
      ))}
    </div>
  )
}

function FieldDisplay({
  field,
  component = 'div',
}: {
  field: Field
  component?: React.ElementType
}) {
  if ('fieldValue' in field)
    return <TextFieldDisplay field={field} component={component} />
  if ('fieldRef' in field) {
    return <TagFieldDisplay field={field} component={component} />
  }
  return null
}

export function TextFieldDisplay({
  field,
  component,
}: {
  field: TextField
  component?: React.ElementType
}) {
  const { title, subtitle, variant, toFixed, fieldValue, unit } = field
  const titleEle = <span>{title}</span>
  const subtitleEle = subtitle && <span> {subtitle}</span>
  return (
    <Box
      component={component as any}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 4,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      <Text
        span
        style={{
          color: variant ? `var(--mantine-color-${variant}-filled)` : undefined,
        }}
      >
        {titleEle}
        {subtitleEle}
      </Text>
      <Text span>
        {typeof fieldValue === 'number' && toFixed !== undefined
          ? truncateToFixed(fieldValue, toFixed)
          : fieldValue}
        {unit}
      </Text>
    </Box>
  )
}

export function TagFieldDisplay({
  field,
  emphasize,
  showZero = import.meta.env.DEV,
  calcRead: calcReadOverride,
  rowSx,
  onClickFormula,
  onMouseEnter,
  onMouseLeave,
}: {
  field: TagField
  component?: React.ElementType
  emphasize?: boolean

  // Show field, even if the value is zero
  showZero?: boolean
  /** Use when `listFormulas` returns a full `Read`. */
  calcRead?: Read
  rowSx?: Record<string, any>
  /** Override help-icon click; pass a no-op to disable debug read. */
  onClickFormula?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const calc = useContext(CalcContext)
  const contextTag = useContext(TagContext)
  const getTagRowSx = useContext(TagRowSxContext)
  const { setRead } = useContext(DebugReadContext)
  const contextRowSx = getTagRowSx?.(field.fieldRef)
  const fieldRead = useMemo(
    () => calcReadOverride ?? read(field.fieldRef),
    [calcReadOverride, field.fieldRef]
  )

  const defaultHelpClick = useCallback(
    () => setRead(fieldRead),
    [fieldRead, setRead]
  )
  const onClick = onClickFormula ?? defaultHelpClick
  // const compareCalc: null | Calculator = null //TODO: compare calcs
  if (!calc) return null
  // if (!calc && !compareCalc) return null

  const valueCalcRes = calc.withTag(contextTag).compute(fieldRead)
  // const compareValueCalcRes: CalcResult<number, CalcMeta> | null = null

  // const { setFormulaData } = useContext(FormulaDataContext)
  const { multi, icon, title, subtitle } = field
  const multiDisplay = multi && <span>{multi}&#215;</span>

  const calcValue = valueCalcRes.val
  const compareCalcValue = 0 //TODO: compare calcs

  if (!showZero && !calcValue && !compareCalcValue) return null

  let fieldVal = false as ReactNode
  const unit = getUnitStr(fieldRead.tag['q'] || fieldRead.tag['name'] || '')

  const diff = calcValue - compareCalcValue
  const pctDiff =
    compareCalcValue &&
    unit !== '%' &&
    (calcValue > 100 || compareCalcValue > 100)
      ? valueString(diff / compareCalcValue, '%')
      : null

  fieldVal = (
    <>
      <span>{valueString(calcValue, unit)}</span>
      {Math.abs(diff) > 0.0001 && !!compareCalcValue && (
        <BootstrapTooltip
          label={
            <Text>
              Compare to <strong>{valueString(compareCalcValue, unit)}</strong>
            </Text>
          }
        >
          <ColorText
            color={diff > 0 ? 'success' : 'error'}
            style={{
              display: 'flex',
              gap: '0.125rem',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <span>
              ({diff > 0 ? '+' : ''}
              {valueString(diff, unit)})
            </span>
            {!!pctDiff && (
              <span>
                ({diff > 0 ? '+' : ''}
                {pctDiff})
              </span>
            )}
          </ColorText>
        </BootstrapTooltip>
      )}
    </>
  )

  const mergedSx: Record<string, any> = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 4,
    boxShadow: emphasize ? '0px 0px 0px 2px red inset' : undefined,
    paddingTop: 2,
    paddingBottom: 2,
  }
  const extraSx = [
    ...(contextRowSx
      ? Array.isArray(contextRowSx)
        ? contextRowSx
        : [contextRowSx]
      : []),
    ...(rowSx ? (Array.isArray(rowSx) ? rowSx : [rowSx]) : []),
  ]
  extraSx.forEach((sx) => Object.assign(mergedSx, sx))

  return (
    <div
      style={mergedSx}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Text
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          marginRight: 'auto',
        }}
      >
        {icon}
        {title}
        {subtitle}
      </Text>
      <Text
        style={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        {multiDisplay}
        {fieldVal}
      </Text>
      <FormulaHelpIcon computed={valueCalcRes} onClick={onClick} />
    </div>
  )
}
function FormulaHelpIcon({
  computed,
  onClick,
}: {
  computed: CalcResult<number, CalcMeta<Tag, string>>
  onClick?: () => void
}) {
  const FullTagDisplay = useContext(FullTagDisplayContext)
  const formulaText = useContext(FormulaTextContext)
  const formulaTextCache = useContext(FormulaTextCacheContext)
  const tag = computed.meta.tag
  const name = tag?.['name'] || tag?.['q'] || ''
  const valDisplay = valueString(computed.val, getUnitStr(name))
  const fText = useMemo(
    () => formulaText(computed as any, formulaTextCache),
    [computed, formulaText, formulaTextCache]
  )
  if (!tag) return null
  return (
    <BootstrapTooltip
      label={
        <div>
          <div style={{ display: 'flex', gap: 4 }}>
            <FullTagDisplay tag={tag} />
            <span>{valDisplay}</span>
          </div>
          <Divider />
          <div>{fText?.formula}</div>

          <Stack style={{ paddingLeft: 4, paddingTop: 4 }}>
            {fText?.deps.map((dep, i) => (
              <div key={i}>
                <div>{dep.name}</div>
                <Divider />
                <div> {dep.formula}</div>
              </div>
            ))}
          </Stack>
        </div>
      }
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        size="xs"
        onClick={onClick}
        style={{ cursor: 'help' }}
      >
        <IconHelp size={16} />
      </ActionIcon>
    </BootstrapTooltip>
  )
}
