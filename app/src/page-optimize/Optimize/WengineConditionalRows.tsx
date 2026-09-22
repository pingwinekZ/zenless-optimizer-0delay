import { Box, Flex, HoverCard, Select, Switch, Text } from '@mantine/core'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type {
  Field,
  Header,
  TagField,
} from '@zenless-optimizer/game-opt/sheet-ui'
import { TagFieldDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import type { CharacterKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import type { useDatabaseContext, useTeam } from '@zenless-optimizer/zzz/db-ui'
import { own } from '@zenless-optimizer/zzz/formula'
import {
  TagDisplay,
  useZzzCalcContext,
} from '@zenless-optimizer/zzz/formula-ui'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import type { ReactNode } from 'react'
import { memo } from 'react'
import {
  ConditionalText,
  conditionalAlign,
  conditionalJustify,
  condLabel,
  NumConditionalRow,
} from './conditionalUtils'
import { Frame0HoverFields } from './frame0HoverCalc'

export const WenginePassiveGroup = memo(function WenginePassiveGroup({
  wengineKey,
  header,
  fields,
  tagForPassiveFields,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  header?: Header
  fields: TagField[]
  tagForPassiveFields: Record<string, any>
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  descriptionOverride?: ReactNode
}) {
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const ns = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`
  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          <Text size="xs">{header?.text}</Text>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {header?.text}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={ns} key18={descKey} />}
        </Text>
        {fields.length > 0 && (
          <>
            <hr />
            <Box mt={4}>
              <TagContext.Provider value={tagForPassiveFields as any}>
                {fields.map((field, i) => (
                  <TagFieldDisplay
                    key={i}
                    field={{
                      ...field,
                      title: (
                        <TagDisplay tag={field.fieldRef} preventRecursion />
                      ),
                    }}
                    showZero={true}
                  />
                ))}
              </TagContext.Provider>
            </Box>
          </>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

export const WenginePassiveFieldRow = memo(function WenginePassiveFieldRow({
  wengineKey,
  field,
  tagForPassiveFields,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  field: TagField
  tagForPassiveFields: Record<string, any>
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  /** Replace the default phase description with custom content. */
  descriptionOverride?: ReactNode
}) {
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const ns = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`
  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          <Text size="xs">{field.title}</Text>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {field.title}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={ns} key18={descKey} />}
        </Text>
        <hr />
        <Box mt={4}>
          <TagContext.Provider value={tagForPassiveFields as any}>
            <TagFieldDisplay
              field={{
                ...field,
                title: <TagDisplay tag={field.fieldRef} preventRecursion />,
              }}
              showZero={true}
            />
          </TagContext.Provider>
        </Box>
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

export const WengineConditionalRow = memo(function WengineConditionalRow({
  wengineKey,
  condName,
  condData,
  team,
  database,
  mainCharKey,
  src,
  fields,
  label: labelProp,
  wenginePhase: propPhase,
  descriptionOverride,
}: {
  wengineKey: WengineKey
  condName: string
  condData: IConditionalData
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  mainCharKey: CharacterKey
  src: CharacterKey
  fields?: Field[]
  label?: ReactNode
  /** Wengine phase to use for descriptions. Defaults to calc context. */
  wenginePhase?: number
  /** Replace the default phase description with custom content. */
  descriptionOverride?: ReactNode
}) {
  const currentCond = team?.frames[0]?.conditionals?.find(
    (c) => c.sheet === wengineKey && c.condKey === condName && c.src === src
  )
  const currentValue = currentCond?.condValue ?? 0

  const setValue = (condValue: number) => {
    database.teams.setFrameConditional(
      mainCharKey,
      0,
      wengineKey as any,
      condName,
      src as any,
      null,
      condValue
    )
  }

  const label = labelProp ?? condLabel(condName, `wengine_${wengineKey}`)

  // Determine current wengine phase for description
  // Use the prop from parent (which may resolve from teammate data)
  // instead of always reading the calc context (which gives the main char)
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const descNs = `wengine_${wengineKey}_gen`
  const descKey = `phaseDescs.${phase - 1}`

  const rowContent = (
    <>
      {condData.type === 'bool' && (
        <Flex justify={conditionalJustify} align={conditionalAlign}>
          <Switch
            style={{ marginRight: 5 }}
            checked={currentValue > 0}
            onChange={(e) => setValue(e.currentTarget.checked ? 1 : 0)}
            size="xs"
          />
          <ConditionalText>{label}</ConditionalText>
        </Flex>
      )}
      {condData.type === 'num' && (
        <NumConditionalRow
          label={label}
          value={currentValue}
          min={condData.min ?? 0}
          max={condData.max ?? 10}
          step={condData.int_only ? 1 : 0.1}
          onChange={setValue}
        />
      )}
      {condData.type === 'list' && (
        <Flex justify={conditionalJustify} align={conditionalAlign}>
          <Select
            style={{ minWidth: 80, width: 80, marginRight: 5 }}
            maxDropdownHeight={500}
            comboboxProps={{ keepMounted: false }}
            data={condData.list.map((item, index) => ({
              label: item,
              value: String(index),
            }))}
            value={String(currentValue)}
            onChange={(v) => setValue(Number(v) || 0)}
            size="xs"
          />
          <ConditionalText>{label}</ConditionalText>
        </Flex>
      )}
      {condData.type !== 'bool' &&
        condData.type !== 'num' &&
        condData.type !== 'list' && (
          <Text size="xs" c="dimmed">
            {label}: unsupported type
          </Text>
        )}
    </>
  )

  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Box
          style={{
            cursor: 'default',
            borderRadius: 'var(--mantine-radius-sm)',
            border: '1px solid var(--mantine-color-default-border)',
            padding: '4px 6px',
          }}
        >
          {rowContent}
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {label}
        </Text>
        <Text size="sm" mb={8}>
          {descriptionOverride ?? <GameDesc ns={descNs} key18={descKey} />}
        </Text>
        {fields && fields.length > 0 && (
          <Box opacity={currentValue === 0 ? 0.5 : undefined}>
            {currentValue > 0 && <hr />}
            <Frame0HoverFields
              sheet={wengineKey}
              condKey={condName}
              src={src}
              dst={null}
              currentValue={currentValue}
              mainCharKey={mainCharKey}
              fields={fields}
              showZero={currentValue === 0}
            />
          </Box>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})
