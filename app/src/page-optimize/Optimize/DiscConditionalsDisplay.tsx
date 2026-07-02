import {
  Box,
  Flex,
  HoverCard,
  NumberInput,
  Select,
  Slider,
  Switch,
  Text,
} from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import { TagFieldDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { memo, Suspense, useContext, useMemo, useState } from 'react'
import { discDefIcon } from '../../assets'
import type { CharacterKey, DiscSetKey } from '../../consts'
import { discSetNames } from '../../consts'
import { useCharacterContext, useDatabaseContext, useTeam } from '../../db-ui'
import { buffs as allBuffs, conditionals } from '../../formula'
import { discUiSheets } from '../../formula-ui'
import { GameDesc, i18n } from '../../i18n'
import { HeaderText } from '../layout'

const inputWidth = 61
const numberWidth = 55
const sliderWidth = 155

const conditionalJustify = 'flex-start'
const conditionalAlign = 'center'

function ConditionalText({
  style,
  children,
}: {
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return <div style={{ whiteSpace: 'pre-line', ...style }}>{children}</div>
}

function condLabel(key: string, ns: string): string {
  const translated = i18n.t(key, { ns })
  if (typeof translated === 'string' && translated !== key) return translated
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function precisionRound(number: number): number {
  if (number < 1) return Math.round(number * 1000) / 1000
  return Math.round(number * 10) / 10
}

export function DiscConditionalsDisplay({
  activeSets,
  teammateKey,
}: {
  activeSets: Partial<Record<DiscSetKey, 2 | 4>>
  teammateKey: CharacterKey
}) {
  const mainChar = useCharacterContext()!
  const { database } = useDatabaseContext()
  const team = useTeam(mainChar.key)

  const allConditionals = conditionals as Record<
    string,
    Record<string, IConditionalData>
  >

  // Filter to active sets that have conditionals for their active count (2p or 4p).
  // A 4p set implies the 2p effect is also active, so include both blocks.
  const activeSetKeys = Object.keys(activeSets) as DiscSetKey[]
  const setsWithConditionals = activeSetKeys.filter((setKey) => {
    const count = activeSets[setKey]
    if (!count) return false
    const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
    return blocksToScan.some((blockKey) => {
      const block = discUiSheets[setKey]?.[blockKey]
      return block?.documents.some(
        (doc) => doc.type === 'conditional' && !!doc.conditional
      )
    })
  })

  if (setsWithConditionals.length === 0) return null

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Disc Conditionals</HeaderText>
      {setsWithConditionals.map((setKey) => {
        const count = activeSets[setKey]!
        const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
        const visibleCondNames = new Set<string>()
        for (const blockKey of blocksToScan) {
          const block = discUiSheets[setKey]?.[blockKey]
          if (!block) continue
          for (const doc of block.documents) {
            if (doc.type === 'conditional' && doc.conditional) {
              visibleCondNames.add(doc.conditional.metadata.name)
            }
          }
        }
        const condEntries = Object.entries(
          allConditionals[setKey] ?? {}
        ).filter(([condName]) => visibleCondNames.has(condName))
        return (
          <DiscSetSection
            key={setKey}
            setKey={setKey}
            count={count}
            condEntries={condEntries}
            teamKey={mainChar.key}
            team={team}
            database={database}
            teammateKey={teammateKey}
          />
        )
      })}
    </Flex>
  )
}

function DiscSetSection({
  setKey,
  count,
  condEntries,
  teamKey,
  team,
  database,
  teammateKey,
}: {
  setKey: DiscSetKey
  count: 2 | 4
  condEntries: [string, IConditionalData][]
  teamKey: CharacterKey
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  teammateKey: CharacterKey
}) {
  // Extract conditional fields from the active block of the disc UI sheet
  // (e.g. 4p fields only when 4p is equipped). A 4p set also includes the 2p
  // effect, so scan both blocks when count === 4.
  // When viewing as a teammate, only include team-wide buffs.
  // Uses buff metadata to determine team-wide status since disc UI sheets
  // use tagToTagField which doesn't include the team flag.
  const discConditionalFields = useMemo(() => {
    const sheet = discUiSheets[setKey]
    if (!sheet) return undefined
    // Look up disc buff metadata to determine team-wide status
    const discBuffs = (allBuffs as any)[setKey] as
      | Record<string, { team?: boolean }>
      | undefined
    function isBuffFieldTeamWide(f: Field): boolean {
      if ('team' in f) return f.team !== false
      if (discBuffs && 'fieldRef' in f && f.fieldRef?.name) {
        const buff = discBuffs[f.fieldRef.name]
        if (buff) return buff.team !== false
      }
      return false
    }
    const isTeammateView = !!(teammateKey && teammateKey !== teamKey)
    const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
    const result: Record<string, Field[]> = {}
    for (const blockKey of blocksToScan) {
      const block = sheet[blockKey]
      if (!block) continue
      for (const doc of block.documents) {
        if (
          doc.type === 'conditional' &&
          doc.conditional?.fields &&
          doc.conditional.fields.length > 0
        ) {
          const condName = doc.conditional.metadata.name
          const fields = doc.conditional.fields
          if (isTeammateView) {
            // Collect only fields that match entries in the buff metadata
            // (or have an explicit team flag). Fields that don't match any
            // buff entry (e.g., Duration formulas) can't be used to determine
            // team status.
            const matchingBuffFields = fields.filter((f) => {
              if ('team' in f) return true
              if (discBuffs && 'fieldRef' in f && f.fieldRef?.name)
                return !!discBuffs[f.fieldRef.name]
              return false
            })
            // If no buff fields to judge by (e.g., empty/absent buff metadata,
            // or the conditional only has formula fields like Duration),
            // we can't determine team status — show the conditional.
            const hasTeamBuff =
              matchingBuffFields.length === 0
                ? true
                : matchingBuffFields.some((f) => isBuffFieldTeamWide(f))
            if (!hasTeamBuff) continue
            // Include team-wide buff fields and informational fields
            // (fields that don't match any entry in the buff metadata).
            const teamFields = fields.filter(
              (f) =>
                // If no buff metadata, include everything
                !discBuffs ||
                // Include informational fields not found in buff metadata
                !(
                  'fieldRef' in f &&
                  f.fieldRef?.name &&
                  discBuffs[f.fieldRef.name]
                ) ||
                // Or include team-wide buff fields
                isBuffFieldTeamWide(f)
            )
            if (teamFields.length === 0) continue
            if (!result[condName]) result[condName] = []
            result[condName].push(...teamFields)
          } else {
            // Main character view: include all fields
            if (!result[condName]) result[condName] = []
            result[condName].push(...fields)
          }
        }
      }
    }
    // When in teammate view, return result even if empty so the caller
    // can distinguish "no UI sheet" (undefined) from "all fields filtered" ({}).
    if (isTeammateView) return result
    return Object.keys(result).length > 0 ? result : undefined
  }, [setKey, count, teammateKey, teamKey])

  // Extract set bonus description keys (e.g. "desc2", "desc4") from disc UI
  // sheet blocks that have both a text document and a conditional document.
  const discCondDescriptions = useMemo(() => {
    const sheet = discUiSheets[setKey]
    if (!sheet) return undefined
    const result: Record<string, string> = {}
    const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
    for (const blockKey of blocksToScan) {
      const block = sheet[blockKey]
      if (!block) continue
      const hasText = block.documents.some((doc) => doc.type === 'text')
      if (!hasText) continue
      for (const doc of block.documents) {
        if (doc.type === 'conditional' && doc.conditional) {
          const condName = doc.conditional.metadata.name
          if (!result[condName]) result[condName] = `desc${blockKey}`
        }
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }, [setKey, count])

  // Extract localized labels from disc UI sheet
  const discCondLabels = useMemo(() => {
    const sheet = discUiSheets[setKey]
    if (!sheet) return undefined
    const result: Record<string, ReactNode> = {}
    const blocksToScan: Array<'2' | '4'> = count === 4 ? ['2', '4'] : ['2']
    for (const blockKey of blocksToScan) {
      const block = sheet[blockKey]
      if (!block) continue
      for (const doc of block.documents) {
        if (doc.type === 'conditional' && doc.conditional?.label) {
          const condName = doc.conditional.metadata.name
          const label = doc.conditional.label
          if (typeof label === 'function') continue
          result[condName] = label
        }
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }, [setKey, count])

  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" gap={4} mb={2}>
        <ImgIcon src={discDefIcon(setKey)} size={1.4} />
        <Text size="xs" fw={600}>
          {discSetNames[setKey] ?? setKey}
        </Text>
      </Flex>
      {condEntries
        .filter(([condName]) => {
          if (discConditionalFields && !discConditionalFields[condName])
            return false
          return true
        })
        .map(([condName, condData]) => (
          <DiscSetConditionalRow
            key={condName}
            setKey={setKey}
            condName={condName}
            condData={condData}
            teamKey={teamKey}
            team={team}
            database={database}
            teammateKey={teammateKey}
            fields={discConditionalFields?.[condName]}
            label={discCondLabels?.[condName]}
            description={discCondDescriptions?.[condName]}
          />
        ))}
    </Flex>
  )
}

const DiscSetConditionalRow = memo(function DiscSetConditionalRow({
  setKey,
  condName,
  condData,
  teamKey,
  team,
  database,
  teammateKey,
  fields,
  label: labelProp,
  description,
}: {
  setKey: DiscSetKey
  condName: string
  condData: IConditionalData
  teamKey: CharacterKey
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  teammateKey: CharacterKey
  fields?: Field[]
  label?: ReactNode
  description?: string
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(
    () => ({ ...outerTag, src: teammateKey }),
    [outerTag, teammateKey]
  )
  const currentCond = team?.frames[0]?.conditionals?.find(
    (c) => c.sheet === setKey && c.condKey === condName && c.src === teammateKey
  )
  const defaultVal =
    condData.type === 'bool'
      ? teammateKey && teammateKey !== teamKey
        ? 0
        : 1
      : condData.type === 'num'
        ? teammateKey && teammateKey !== teamKey
          ? 0
          : (condData.max ?? 10)
        : 0
  const currentValue = currentCond?.condValue ?? defaultVal

  const setValue = (condValue: number) => {
    database.teams.setFrameConditional(
      teamKey,
      0,
      setKey as any,
      condName,
      teammateKey as any,
      null,
      condValue
    )
  }

  const label = labelProp ?? condLabel(condName, `disc_${setKey}`)

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
            transition: 'border-color 0.15s',
          }}
        >
          {rowContent}
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {label}
        </Text>
        {description && (
          <Text size="sm" mb={8} style={{ whiteSpace: 'pre-wrap' }}>
            <Suspense fallback={null}>
              <GameDesc ns={`disc_${setKey}_gen`} key18={description} />
            </Suspense>
          </Text>
        )}
        {currentValue > 0 && fields && fields.length > 0 && (
          <>
            <hr />
            <Box mt={4}>
              <TagContext.Provider value={tagForFields as any}>
                {fields.map(
                  (field, i) =>
                    'fieldRef' in field && (
                      <TagFieldDisplay
                        key={i}
                        field={field}
                        rowSx={{
                          paddingTop: 1,
                          paddingBottom: 1,
                          gap: 6,
                        }}
                      />
                    )
                )}
              </TagContext.Provider>
            </Box>
          </>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

const NumConditionalRow = memo(function NumConditionalRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (val: number) => void
}) {
  const [dragState, setDragState] = useState<number | undefined>(undefined)
  const displayValue = dragState ?? value

  return (
    <Flex direction="column" style={{ marginBottom: 0 }}>
      <Flex justify={conditionalJustify} align={conditionalAlign}>
        <div style={{ minWidth: inputWidth, display: 'block' }}>
          <NumberInput
            min={min}
            max={max}
            hideControls
            style={{ width: numberWidth }}
            styles={{ input: { height: 24, minHeight: 24 } }}
            onChange={(newValue) => {
              if (newValue != null && typeof newValue === 'number') {
                onChange(newValue)
              }
            }}
            value={precisionRound(displayValue)}
          />
        </div>
        <ConditionalText style={{ lineHeight: '16px' }}>
          {label}
        </ConditionalText>
      </Flex>

      <Flex align="center" gap={5} h={14}>
        <Slider
          min={min}
          max={max}
          step={step}
          style={{
            minWidth: sliderWidth,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 1,
          }}
          label={(val) => `${precisionRound(val ?? 0)}`}
          onChange={(newValue) => {
            setDragState(newValue)
          }}
          onChangeEnd={(newValue) => {
            setDragState(undefined)
            onChange(newValue)
          }}
          value={(displayValue ?? min) as number}
        />
        <ConditionalText
          style={{
            minWidth: 20,
            marginBottom: 2,
            textAlign: 'center',
          }}
        >
          {`${precisionRound(max)}`}
        </ConditionalText>
      </Flex>
    </Flex>
  )
})
