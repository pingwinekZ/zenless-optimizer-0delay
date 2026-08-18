import {
  Box,
  Drawer,
  Flex,
  HoverCard,
  Select,
  Switch,
  Text,
} from '@mantine/core'
import { stableArr } from '@zenless-optimizer/common/util'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import { TagFieldDisplay } from '@zenless-optimizer/game-opt/sheet-ui'
import {
  isValidElement,
  type ReactNode,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { discDefIcon } from '../../assets'
import { allDiscSetKeys, discSetNames } from '../../consts'
import type { TeamConditional } from '../../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../../db-ui'
import { conditionals } from '../../formula'
import { CharCalcMockCountProvider, discUiSheets } from '../../formula-ui'
import { GameDesc, i18n } from '../../i18n'

const cardStyle: React.CSSProperties = {
  borderRadius: 6,
  backgroundColor: 'var(--layer-2)',
  padding: '8px 10px',
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--mantine-color-default-border)',
}

export function FormSetConditionals({
  show,
  onClose,
}: {
  show: boolean
  onClose: () => void
}) {
  const [hasOpened, setHasOpened] = useState(false)
  if (show && !hasOpened) setHasOpened(true)

  return (
    <Drawer
      opened={show}
      onClose={onClose}
      title="Conditional set effects"
      position="right"
      size={550}
      keepMounted
    >
      {hasOpened && <FormSetConditionalsContent />}
    </Drawer>
  )
}

function FormSetConditionalsContent() {
  useEffect(() => {
    i18n.loadNamespaces(allDiscSetKeys.map((key) => `disc_${key}_gen`))
  }, [])

  const character = useCharacterContext()
  const team = useTeam(character?.key)
  const teamConditionals =
    team?.frames[0]?.conditionals ?? stableArr<TeamConditional>()

  const discOptions = useMemo(() => {
    const items: React.ReactNode[] = []
    for (const key of allDiscSetKeys) {
      const sheetConditionals = (conditionals as Record<string, unknown>)[
        key
      ] as Record<string, IConditionalData> | undefined
      if (!sheetConditionals) continue
      const entries = Object.entries(sheetConditionals)
      if (entries.length === 0) continue
      items.push(
        <DiscSetConditionalCard key={key} sheet={key} condEntries={entries} />
      )
    }
    return items
  }, [])

  if (!character) return null
  return (
    // Mock all disc set counts so conditional buff fields always display
    // their nominal values, even for sets the character hasn't equipped.
    <CharCalcMockCountProvider
      character={character}
      conditionals={teamConditionals}
    >
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
        }}
      >
        {discOptions}
      </Box>
    </CharCalcMockCountProvider>
  )
}

type CondInfoEntry = {
  label: ReactNode
  description?: ReactNode
  descKey: string
  fields: Field[]
}

/**
 * Extract labels, description keys, and buff fields from the disc UI sheet
 * for each conditional.
 */
function useCondInfo(sheet: string) {
  return useMemo(() => {
    const discSheet = (discUiSheets as Record<string, unknown>)[sheet] as
      | Record<
          string,
          {
            documents: Array<{
              type: string
              conditional?: {
                metadata: { name: string }
                label?: unknown
                description?: unknown
                fields?: Field[]
              }
            }>
          }
        >
      | undefined
    if (!discSheet) return undefined

    const result: Record<string, CondInfoEntry> = {}

    for (const blockKey of ['2', '4'] as const) {
      const block = discSheet[blockKey]
      if (!block) continue
      const descKey = `desc${blockKey}`

      for (const doc of block.documents) {
        if (doc.type !== 'conditional' || !doc.conditional) continue
        const condName = doc.conditional.metadata.name
        const existing = result[condName]

        // Use first found label (don't overwrite)
        const label =
          doc.conditional.label && typeof doc.conditional.label !== 'function'
            ? (doc.conditional.label as ReactNode)
            : undefined
        const description =
          doc.conditional.description &&
          typeof doc.conditional.description !== 'function'
            ? (doc.conditional.description as ReactNode)
            : undefined

        if (!existing) {
          result[condName] = {
            label: label ?? resolveCondLabel(sheet, condName),
            description,
            descKey,
            fields: doc.conditional.fields ?? [],
          }
        } else {
          if (!existing.label && label) existing.label = label
          if (!existing.description && description)
            existing.description = description
          existing.fields.push(...(doc.conditional.fields ?? []))
        }
      }
    }

    // Ensure every conditional has a label
    const sheetConditionals = (conditionals as Record<string, unknown>)[
      sheet
    ] as Record<string, IConditionalData> | undefined
    if (sheetConditionals) {
      for (const condName of Object.keys(sheetConditionals)) {
        if (!result[condName]) {
          result[condName] = {
            label: resolveCondLabel(sheet, condName),
            descKey: 'desc4',
            fields: [],
          }
        }
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }, [sheet])
}

function DiscSetConditionalCard({
  sheet,
  condEntries,
}: {
  sheet: string
  condEntries: [string, IConditionalData][]
}) {
  const character = useCharacterContext()!
  const team = useTeam(character.key)
  const condInfo = useCondInfo(sheet)

  const currentValues = useMemo(() => {
    const vals: Record<string, number> = {}
    for (const [condName, condData] of condEntries) {
      const currentCond = team?.frames[0]?.conditionals?.find(
        (c) => c.sheet === sheet && c.condKey === condName
      )
      const defaultVal =
        condData.type === 'bool'
          ? 1
          : condData.type === 'num'
            ? (condData.max ?? 10)
            : 0
      vals[condName] = currentCond?.condValue ?? defaultVal
    }
    return vals
  }, [team, sheet, condEntries])

  return (
    <Box style={cardStyle}>
      {/* Row 1: icon + set name */}
      <Flex gap={6} align="center" mb={6}>
        <img
          src={discDefIcon(sheet as any)}
          style={{ width: 24, height: 24, display: 'block', flexShrink: 0 }}
          alt=""
        />
        <Text
          size="xs"
          fw={600}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {discSetNames[sheet as keyof typeof discSetNames] ?? sheet}
        </Text>
      </Flex>

      {/* Rows 2+: toggle under the icon, one conditional per row */}
      <Flex direction="column" gap={3}>
        {condEntries.map(([condName, condData]) => {
          const info = condInfo?.[condName]
          return (
            <CondRow
              key={condName}
              sheet={sheet}
              condName={condName}
              condData={condData}
              currentValue={currentValues[condName]}
              label={info?.label}
              description={info?.description}
              descKey={info?.descKey}
              fields={info?.fields}
            />
          )
        })}
      </Flex>
    </Box>
  )
}

function CondRow({
  sheet,
  condName,
  condData,
  currentValue,
  label,
  description,
  descKey,
  fields,
}: {
  sheet: string
  condName: string
  condData: IConditionalData
  currentValue: number
  label?: ReactNode
  description?: ReactNode
  descKey?: string
  fields?: Field[]
}) {
  const character = useCharacterContext()!
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(
    () => ({ ...outerTag, src: character.key }),
    [outerTag, character.key]
  )
  const row = (
    <Flex align="center" gap={4}>
      <Box style={{ flexShrink: 0 }}>
        <ConditionalInput
          sheet={sheet}
          condName={condName}
          condData={condData}
          currentValue={currentValue}
        />
      </Box>
      {label && (
        <Text size="xs" c="dimmed" style={{ lineHeight: 1.3, minWidth: 0 }}>
          {label}
        </Text>
      )}
    </Flex>
  )

  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={200}
      closeDelay={150}
    >
      <HoverCard.Target>{row}</HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {label}
        </Text>
        <CondDescription
          sheet={sheet}
          description={description}
          descKey={descKey}
        />
        {fields && fields.length > 0 && (
          <Box opacity={currentValue === 0 ? 0.5 : undefined}>
            {currentValue > 0 && <hr />}
            <Box mt={4}>
              <TagContext.Provider value={tagForFields as any}>
                {fields.map(
                  (field, i) =>
                    'fieldRef' in field && (
                      <TagFieldDisplay
                        key={i}
                        field={field}
                        showZero={currentValue === 0}
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
          </Box>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

/**
 * Resolve the i18n key from a `ch(key)` Translate element.
 */
function translateKey(node: ReactNode): string | undefined {
  if (
    isValidElement(node) &&
    node.props &&
    typeof node.props === 'object' &&
    'key18' in node.props
  )
    return (node.props as { key18?: string }).key18
  return undefined
}

/**
 * Render a conditional's description. Sliced descriptions are locale keys
 * rendered through GameDesc (full GameText formatting incl. green number
 * highlighting); unsliced sets fall back to the set's full desc2/desc4 text.
 */
function CondDescription({
  sheet,
  description,
  descKey,
}: {
  sheet: string
  description?: ReactNode
  descKey?: string
}) {
  const descKey18 = description ? translateKey(description) : undefined
  if (descKey18) {
    return (
      <Text size="sm" mb={8}>
        <Suspense fallback={null}>
          <GameDesc ns={`disc_${sheet}`} key18={descKey18} />
        </Suspense>
      </Text>
    )
  }
  if (description) {
    return (
      <Text size="sm" mb={8} style={{ whiteSpace: 'pre-wrap' }}>
        {description}
      </Text>
    )
  }
  if (!descKey) return null
  return (
    <Text size="sm" mb={8}>
      <Suspense fallback={null}>
        <GameDesc ns={`disc_${sheet}_gen`} key18={descKey} />
      </Suspense>
    </Text>
  )
}

/**
 * Resolve a human-readable label for a disc set conditional by trying
 * several i18n key patterns in the disc set's locale namespace.
 */
function resolveCondLabel(sheet: string, condName: string): string {
  const ns = `disc_${sheet}`
  // Try the raw key first
  let translated = i18n.t(condName, { ns })
  if (typeof translated === 'string' && translated !== condName)
    return translated
  // Try common prefixes used in disc set locale files
  for (const prefix of ['set4_cond_', 'set2_cond_', 'cond']) {
    const key = `${prefix}${condName}`
    translated = i18n.t(key, { ns })
    if (typeof translated === 'string' && translated !== key) return translated
  }
  // Fallback: format the raw name
  return condName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function ConditionalInput({
  sheet,
  condName,
  condData,
  currentValue: propCurrentValue,
}: {
  sheet: string
  condName: string
  condData: IConditionalData
  currentValue: number
}) {
  const character = useCharacterContext()!
  const { database } = useDatabaseContext()
  const currentValue = propCurrentValue

  const setValue = (condValue: number) => {
    database.teams.setFrameConditional(
      character.key,
      0,
      sheet as any,
      condName,
      character.key as any,
      null,
      condValue
    )
  }

  if (condData.type === 'bool') {
    return (
      <Switch
        checked={currentValue > 0}
        onChange={(e) => setValue(e.currentTarget.checked ? 1 : 0)}
        size="xs"
      />
    )
  }

  if (condData.type === 'num') {
    const min = condData.min ?? 0
    const max = condData.max ?? 10
    const options = Array.from({ length: max - min + 1 }, (_, i) => ({
      label: String(min + i),
      value: String(min + i),
    }))
    return (
      <Select
        data={options}
        value={String(currentValue)}
        onChange={(v) => setValue(v != null ? Number(v) : 0)}
        size="xs"
        style={{ width: 50 }}
        comboboxProps={{ keepMounted: false, width: 160 }}
      />
    )
  }

  return null
}
