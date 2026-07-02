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
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import {
  TagFieldDisplay,
  TextFieldDisplay,
} from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { memo, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import {
  useCharacter,
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '../../db-ui'
import { conditionals } from '../../formula'
import { TagDisplay } from '../../formula-ui'
import { GameDesc, GameText, i18n } from '../../i18n'
import { HeaderText } from '../layout'

function renderDescription(desc: ReactNode): ReactNode {
  if (typeof desc === 'string') return <GameText text={desc} />
  return desc
}

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

function getMindscapeRequirement(condName: string): number | null {
  const match = condName.match(/^m([1-6])/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

function precisionRound(number: number): number {
  if (number < 1) return Math.round(number * 1000) / 1000
  return Math.round(number * 10) / 10
}

export function CharacterConditionalsDisplay({
  characterKey,
  mindscapeOverride,
  conditionalFields,
  conditionalDescriptions,
  conditionalLabels,
  showZeroFields = false,
  passiveFields,
  showPassives = false,
}: {
  characterKey: CharacterKey
  mindscapeOverride?: number
  conditionalFields?: Record<string, Field[]>
  conditionalDescriptions?: Record<string, ReactNode>
  conditionalLabels?: Record<string, ReactNode>
  showZeroFields?: boolean
  passiveFields?: {
    fields: Field[]
    /** 0 = always available, 1-6 = requires that mindscape level */
    mindscape: number
    sectionKey: string
    /** Optional paragraph index within the section's description */
    paragraph?: number
    /** Optional group title shown instead of first field's title */
    groupTitle?: ReactNode
  }[]
  showPassives?: boolean
}) {
  const { t } = useTranslation('charNames_gen')
  const mainChar = useCharacterContext()!
  const { database } = useDatabaseContext()
  const team = useTeam(mainChar.key)
  const effectiveMindscape = mindscapeOverride ?? mainChar.mindscape

  const allConditionals = conditionals as Record<string, unknown>
  const charConditionals = allConditionals[characterKey] as
    | Record<string, IConditionalData>
    | undefined

  if (!charConditionals) {
    console.log(
      '[CharacterConditionalsDisplay] No conditionals for',
      characterKey,
      'Available keys:',
      Object.keys(allConditionals).slice(0, 10)
    )
    return (
      <Text size="xs" c="dimmed">
        No conditionals
      </Text>
    )
  }

  const condEntries = Object.entries(charConditionals).sort(([, a], [, b]) => {
    const aReq = (a as IConditionalData).mindscapeRequirement ?? 0
    const bReq = (b as IConditionalData).mindscapeRequirement ?? 0
    return aReq - bReq
  })
  const visiblePassives = passiveFields ?? []
  const hasPassives = visiblePassives.length > 0
  if (condEntries.length === 0 && !hasPassives) {
    return (
      <Text size="xs" c="dimmed">
        No conditionals
      </Text>
    )
  }

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>{t(characterKey)} Conditionals</HeaderText>
      {hasPassives && showPassives && (
        <Flex direction="column" gap={2}>
          {visiblePassives.map((entry, i) => (
            <PassiveFieldRow
              key={i}
              characterKey={characterKey}
              fields={entry.fields}
              sectionKey={entry.sectionKey}
              paragraph={entry.paragraph}
              groupTitle={entry.groupTitle}
              disabled={effectiveMindscape < entry.mindscape}
            />
          ))}
        </Flex>
      )}
      {condEntries
        .filter(([condName]) => {
          // If conditionalFields is provided and this condName has no entry,
          // all its fields were self-buffs — skip the entire conditional
          if (conditionalFields && !conditionalFields[condName]) return false
          return true
        })
        .map(([condName, condData]) => (
          <CharacterConditionalRow
            key={condName}
            characterKey={characterKey}
            condName={condName}
            condData={condData}
            team={team}
            database={database}
            mainCharKey={mainChar.key}
            mindscape={effectiveMindscape}
            fields={conditionalFields?.[condName]}
            description={conditionalDescriptions?.[condName]}
            label={conditionalLabels?.[condName]}
            showZeroFields={showZeroFields}
          />
        ))}
    </Flex>
  )
}

const CharacterConditionalRow = memo(function CharacterConditionalRow({
  characterKey,
  condName,
  condData,
  team,
  database,
  mainCharKey,
  mindscape,
  fields,
  description,
  label: labelProp,
  showZeroFields = false,
}: {
  characterKey: CharacterKey
  condName: string
  condData: IConditionalData
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  mainCharKey: CharacterKey
  mindscape: number
  fields?: Field[]
  description?: ReactNode
  label?: ReactNode
  showZeroFields?: boolean
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(
    () => ({ ...outerTag, src: characterKey }),
    [outerTag, characterKey]
  )
  const currentCond = team?.frames[0]?.conditionals?.find(
    (c) =>
      c.sheet === characterKey &&
      c.condKey === condName &&
      c.src === characterKey
  )
  const currentValue = currentCond?.condValue ?? 0

  const mindscapeRequirement =
    condData.mindscapeRequirement ?? getMindscapeRequirement(condName)
  const isMindscapeDisabled =
    mindscapeRequirement !== null && mindscape < mindscapeRequirement

  const displayValue = currentValue

  const setValue = (condValue: number) => {
    if (isMindscapeDisabled) return
    database.teams.setFrameConditional(
      mainCharKey,
      0,
      characterKey as any,
      condName,
      characterKey as any,
      null,
      condValue
    )
  }

  const label = labelProp ?? condLabel(condName, `char_${characterKey}`)

  const rowContent = (
    <>
      {condData.type === 'bool' && (
        <Flex justify={conditionalJustify} align={conditionalAlign}>
          <Switch
            style={{ marginRight: 5 }}
            checked={displayValue > 0}
            onChange={(e) => setValue(e.currentTarget.checked ? 1 : 0)}
            size="xs"
            disabled={isMindscapeDisabled}
          />
          <ConditionalText
            style={isMindscapeDisabled ? { opacity: 0.5 } : undefined}
          >
            {label}
          </ConditionalText>
        </Flex>
      )}
      {condData.type === 'num' && (
        <NumConditionalRow
          label={label}
          value={displayValue}
          min={condData.min ?? 0}
          max={condData.max ?? 10}
          step={condData.int_only ? 1 : 0.1}
          onChange={setValue}
          disabled={isMindscapeDisabled}
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
            value={String(displayValue)}
            onChange={(v) => setValue(Number(v) || 0)}
            size="xs"
            disabled={isMindscapeDisabled}
          />
          <ConditionalText
            style={isMindscapeDisabled ? { opacity: 0.5 } : undefined}
          >
            {label}
          </ConditionalText>
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
            {renderDescription(description)}
          </Text>
        )}
        {(displayValue > 0 || isMindscapeDisabled) &&
          fields &&
          fields.length > 0 && (
            <Box opacity={isMindscapeDisabled ? 0.5 : undefined}>
              <hr />
              <Box mt={4}>
                <TagContext.Provider value={tagForFields as any}>
                  {fields.map(
                    (field, i) =>
                      'fieldRef' in field && (
                        <TagFieldDisplay
                          key={i}
                          field={field}
                          showZero={isMindscapeDisabled ? true : showZeroFields}
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
})

const NumConditionalRow = memo(function NumConditionalRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (val: number) => void
  disabled?: boolean
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
            disabled={disabled}
          />
        </div>
        <ConditionalText
          style={{
            lineHeight: '16px',
            opacity: disabled ? 0.5 : undefined,
          }}
        >
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
          disabled={disabled}
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

const passiveSectionToDescKey = (
  sectionKey: string,
  fieldName?: string | null,
  coreLevel?: number
): string | null => {
  if (sectionKey === 'core') {
    // Both core and ability documents are merged into 'core' by createCoreAndAbilitySheet.
    // Ability field names start with 'ability_' — show the ability description for those.
    if (fieldName?.startsWith('ability_')) return 'ability.desc'
    return `core.desc.${coreLevel ?? 0}`
  }
  if (sectionKey === 'potential') return 'potential.desc.0'
  const m = sectionKey.match(/^m([1-6])$/)
  if (m) return `mindscapes.${m[1]}.desc`
  return null
}

const PassiveFieldRow = memo(function PassiveFieldRow({
  characterKey,
  fields,
  sectionKey,
  paragraph,
  groupTitle,
  disabled = false,
}: {
  characterKey: CharacterKey
  fields: Field[]
  sectionKey: string
  paragraph?: number
  groupTitle?: ReactNode
  disabled?: boolean
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(
    () => ({ ...outerTag, src: characterKey }),
    [outerTag, characterKey]
  )
  const char = useCharacter(characterKey)
  const coreLevel = char?.core ?? 0
  const firstFieldRef =
    fields.length > 0 && 'fieldRef' in fields[0] ? fields[0].fieldRef : null
  const descKey = useMemo(() => {
    const baseKey = passiveSectionToDescKey(
      sectionKey,
      firstFieldRef?.name,
      coreLevel
    )
    if (paragraph !== undefined && baseKey) return `${baseKey}.${paragraph}`
    return baseKey
  }, [sectionKey, firstFieldRef?.name, paragraph, coreLevel])
  const ns = `char_${characterKey}_gen`
  const displayTitle = groupTitle ?? fields[0]?.title
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
            fontSize: 11,
            lineHeight: '16px',
          }}
        >
          <Text size="sm" opacity={disabled ? 0.5 : undefined}>
            {displayTitle}
          </Text>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {displayTitle}
        </Text>
        {descKey && (
          <Text size="sm" mb={8}>
            {firstFieldRef?.name?.startsWith('ability_') ? (
              <>
                <div style={{ marginBottom: 8 }}>
                  <GameDesc ns={ns} key18="ability.desc.0" />
                </div>
                <GameDesc ns={ns} key18={descKey} />
              </>
            ) : (
              <GameDesc ns={ns} key18={descKey} />
            )}
          </Text>
        )}
        <Box opacity={disabled ? 0.5 : undefined}>
          <hr />
          <Box mt={4}>
            <TagContext.Provider value={tagForFields as any}>
              {fields.map((field, i) =>
                'fieldRef' in field ? (
                  <TagFieldDisplay
                    key={i}
                    field={{
                      ...field,
                      title:
                        i === 0 && !groupTitle ? (
                          <TagDisplay tag={field.fieldRef} preventRecursion />
                        ) : (
                          field.title
                        ),
                    }}
                    showZero={true}
                  />
                ) : (
                  <TextFieldDisplay
                    key={i}
                    field={
                      disabled && 'fieldValue' in field
                        ? { ...field, fieldValue: 0 }
                        : field
                    }
                  />
                )
              )}
            </TagContext.Provider>
          </Box>
        </Box>
      </HoverCard.Dropdown>
    </HoverCard>
  )
})
