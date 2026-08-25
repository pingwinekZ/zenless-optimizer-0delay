import { Box, Flex, HoverCard, Select, Switch, Text } from '@mantine/core'
import { ColorText } from '@zenless-optimizer/common/ui'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type {
  Field,
  FieldsDocument,
} from '@zenless-optimizer/game-opt/sheet-ui'
import {
  TagFieldDisplay,
  TextFieldDisplay,
} from '@zenless-optimizer/game-opt/sheet-ui'
import type { ReactNode } from 'react'
import { memo, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type AttributeKey,
  type CharacterKey,
  elementalData,
} from '../../consts'
import {
  useCharacter,
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '../../db-ui'
import { buffs, conditionals } from '../../formula'
import { charSheets, TagDisplay } from '../../formula-ui'
import {
  EffectiveMindscapeContext,
  SkillGameDesc,
  usePotentialDescKey,
} from '../../formula-ui/char/sheetUtil'
import { buffAppliesToMainUnit } from '../../formula-ui/teammate'
import { GameDesc, GameText } from '../../i18n'
import { getCharStat } from '../../stats'
import { ElementIcon } from '../../svgicons'
import { HeaderText } from '../layout'
import {
  ConditionalText,
  conditionalAlign,
  conditionalJustify,
  condLabel,
  NumConditionalRow,
} from './conditionalUtils'

const SECTION_ORDER = [
  'unique',
  'basic',
  'dodge',
  'assist',
  'special',
  'chain',
  'core',
  'ability',
  'potential',
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
] as const

const LUMIFLUX_TEXT_COLOR = '#FFA9DD'
const FLUX_TEXT_COLOR = '#D9A600'

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  unique: 'Unique',
  basic: 'Basic Attack',
  dodge: 'Dodge',
  assist: 'Assist',
  special: 'Special',
  chain: 'Chain Attack',
  core: 'Core',
  ability: 'Additional Ability',
  potential: 'Potential',
  m1: 'M1',
  m2: 'M2',
  m3: 'M3',
  m4: 'M4',
  m5: 'M5',
  m6: 'M6',
}

type PassiveEntry = {
  fields: Field[]
  mindscape: number
  sectionKey: string
  paragraph?: number
  descKey?: string
  groupTitle?: ReactNode
  description?: ReactNode
}

type SectionConditional = {
  condName: string
  condData: IConditionalData
  fields?: Field[]
  description?: ReactNode
  label?: ReactNode
  linked?: string | string[]
  maxByMindscape?: Record<number, number>
  noDimWhenZero?: boolean
}

type SectionGroup = {
  sectionKey: string
  conditionals: SectionConditional[]
  passives: PassiveEntry[]
}

function renderDescription(desc: ReactNode): ReactNode {
  if (typeof desc === 'string') return <GameText text={desc} />
  return desc
}

function getMindscapeRequirement(condName: string): number | null {
  const match = condName.match(/^m([1-6])/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

function passiveSectionToDescKey(
  sectionKey: string,
  fieldName: string | null | undefined,
  coreLevel: number,
  potential: number
): string | null {
  if (sectionKey === 'core') {
    if (fieldName?.startsWith('ability_')) return 'ability.desc'
    return `core.desc.${coreLevel ?? 0}`
  }
  if (sectionKey === 'potential') return `potential.desc.${potential}`
  const m = sectionKey.match(/^m([1-6])$/)
  if (m) return `mindscapes.${m[1]}.desc`
  return null
}

function extractCharConditionalFields(
  characterKey: CharacterKey,
  teammateKey: CharacterKey | undefined,
  potential: number
): Record<string, Field[]> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const charBuffs = (buffs as any)[characterKey] as
    | Record<string, { team?: boolean }>
    | undefined
  const isTeammateView = !!teammateKey
  const result: Record<string, Field[]> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional) {
        const condName = doc.conditional.metadata.name
        const fields = (doc.conditional.fields ?? []).filter(
          (f) => !('minPotential' in f) || (f.minPotential ?? 0) <= potential
        )
        if (isTeammateView) {
          const teamFields = fields.filter((f) => {
            if ('team' in f) {
              if (f.team !== false) return true
              return false
            }
            if ('fieldRef' in f && f.fieldRef?.name) {
              const buff = charBuffs?.[f.fieldRef.name]
              if (buff?.team !== undefined) {
                if (buff.team) return true
                return false
              }
              return buffAppliesToMainUnit(f.fieldRef)
            }
            return false
          })
          if (teamFields.length === 0 && !doc.conditional.showInTeammateView)
            return
          if (!result[condName]) result[condName] = []
          const seenKeys = new Set(
            result[condName]
              .map((f) =>
                'fieldRef' in f
                  ? `${f.fieldRef?.q ?? ''}|${f.fieldRef?.damageType1 ?? ''}|${f.fieldRef?.damageType2 ?? ''}|${f.fieldRef?.name ?? ''}`
                  : undefined
              )
              .filter(Boolean)
          )
          for (const field of teamFields) {
            if ('fieldRef' in field) {
              const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}|${field.fieldRef?.name ?? ''}`
              if (!key || !seenKeys.has(key)) {
                seenKeys.add(key)
                result[condName].push(field)
              }
            } else {
              result[condName].push(field)
            }
          }
        } else {
          // Seed directStrike: hide vanguard-only conditional from own view
          if (characterKey === 'Seed' && condName === 'directStrike') return
          // Remielle m1: hide squad-only Anomaly DMG conditional from own view
          if (characterKey === 'Remielle' && condName === 'phaseFlow_m1') return
          if (!result[condName]) result[condName] = []
          const seenKeys = new Set(
            result[condName]
              .map((f) =>
                'fieldRef' in f
                  ? `${f.fieldRef?.q ?? ''}|${f.fieldRef?.damageType1 ?? ''}|${f.fieldRef?.damageType2 ?? ''}|${f.fieldRef?.name ?? ''}`
                  : undefined
              )
              .filter(Boolean)
          )
          for (const field of fields) {
            // Zhao m2: hide team ATK from main character view
            if (
              characterKey === 'Zhao' &&
              'fieldRef' in field &&
              field.fieldRef?.name === 'm2_team_atk_'
            )
              continue
            // Seed m2: hide vanguard DEF Ignore from main character view
            if (
              characterKey === 'Seed' &&
              'fieldRef' in field &&
              field.fieldRef?.name === 'm2_vanguard_defIgn_'
            )
              continue
            if ('fieldRef' in field) {
              const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}|${field.fieldRef?.name ?? ''}`
              if (!key || !seenKeys.has(key)) {
                seenKeys.add(key)
                result[condName].push(field)
              }
            } else {
              result[condName].push(field)
            }
          }
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function extractCharConditionalDescriptions(
  characterKey: CharacterKey
): Record<string, ReactNode> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<string, ReactNode> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional?.description) {
        const condName = doc.conditional.metadata.name
        const desc = doc.conditional.description
        if (typeof desc === 'function') return
        if (result[condName]) {
          result[condName] = `${result[condName]}\n\n${desc}`
        } else {
          result[condName] = desc
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function extractCharConditionalLabels(
  characterKey: CharacterKey
): Record<string, ReactNode> | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<string, ReactNode> = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional?.label) {
        const condName = doc.conditional.metadata.name
        const label = doc.conditional.label
        if (typeof label === 'function') return
        result[condName] = label
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function extractCharConditionalUiOptions(
  characterKey: CharacterKey
):
  | Record<
      string,
      { maxByMindscape?: Record<number, number>; noDimWhenZero?: boolean }
    >
  | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const result: Record<
    string,
    { maxByMindscape?: Record<number, number>; noDimWhenZero?: boolean }
  > = {}
  Object.values(sheet).forEach((section) => {
    section.documents.forEach((doc) => {
      if (doc.type === 'conditional' && doc.conditional) {
        const condName = doc.conditional.metadata.name
        const { maxByMindscape, noDimWhenZero } = doc.conditional
        if (maxByMindscape || noDimWhenZero) {
          result[condName] = {
            ...result[condName],
            ...(maxByMindscape ? { maxByMindscape } : {}),
            ...(noDimWhenZero ? { noDimWhenZero } : {}),
          }
        }
      }
    })
  })
  return Object.keys(result).length > 0 ? result : undefined
}

function extractCharPassiveFields(
  characterKey: CharacterKey,
  teammateKey: CharacterKey | undefined,
  potential: number
):
  | {
      fields: Field[]
      mindscape: number
      sectionKey: string
      paragraph?: number
      descKey?: string
      groupTitle?: ReactNode
      description?: ReactNode
    }[]
  | undefined {
  const sheet = charSheets[characterKey]
  if (!sheet) return undefined
  const charBuffs = (buffs as any)[characterKey] as
    | Record<string, { team?: boolean }>
    | undefined
  if (!charBuffs) return undefined
  const isTeammateView = !!teammateKey
  const result: {
    fields: Field[]
    mindscape: number
    sectionKey: string
    paragraph?: number
    descKey?: string
    groupTitle?: ReactNode
    description?: ReactNode
  }[] = []
  Object.entries(sheet).forEach(([sectionKey, section]) => {
    const mindscape = sectionKey.startsWith('m')
      ? Number(sectionKey.slice(1)) || 0
      : 0
    let fieldsDocIndex = 0
    let abilityFieldsDocIndex = 0
    section.documents.forEach((doc) => {
      if (doc.type === 'fields' && (doc.fields?.length || doc.description)) {
        const groupedFields: Field[] = []
        for (const field of doc.fields) {
          if ('minPotential' in field && (field.minPotential ?? 0) > potential)
            continue
          if ('fieldRef' in field && field.fieldRef?.name) {
            const buffMeta = charBuffs[field.fieldRef.name]
            if (!buffMeta) continue
            if (
              isTeammateView &&
              (buffMeta.team === false ||
                (buffMeta.team !== true &&
                  !buffAppliesToMainUnit(field.fieldRef)))
            )
              continue
            groupedFields.push(field)
          } else if (
            !isTeammateView &&
            !('fieldRef' in field) &&
            'fieldValue' in field
          ) {
            groupedFields.push(field)
          }
        }
        if (groupedFields.length > 0 || (!isTeammateView && doc.description)) {
          const isAbility =
            groupedFields[0] &&
            'fieldRef' in groupedFields[0] &&
            groupedFields[0].fieldRef?.name?.startsWith('ability_')
          const autoParagraph = sectionKey.startsWith('m')
            ? undefined
            : isAbility
              ? abilityFieldsDocIndex + 1
              : fieldsDocIndex
          const paragraph =
            doc.type === 'fields' &&
            'paragraph' in doc &&
            doc.paragraph !== undefined
              ? doc.paragraph
              : autoParagraph
          result.push({
            fields: groupedFields,
            mindscape,
            sectionKey,
            paragraph,
            descKey:
              doc.type === 'fields' && 'descKey' in doc
                ? (doc as FieldsDocument).descKey
                : undefined,
            description: (doc as FieldsDocument).description,
            groupTitle:
              doc.type === 'fields' && 'header' in doc && doc.header
                ? doc.header.text
                : undefined,
          })
          if (isAbility) abilityFieldsDocIndex++
          else fieldsDocIndex++
        }
      }
    })
  })
  return result.length > 0 ? result : undefined
}

export function CharacterConditionalsDisplay({
  characterKey,
  mindscapeOverride,
  showZeroFields = false,
  showPassives = false,
  teammateKey,
}: {
  characterKey: CharacterKey
  mindscapeOverride?: number
  showZeroFields?: boolean
  showPassives?: boolean
  teammateKey?: CharacterKey
}) {
  const mainChar = useCharacterContext()!
  const { t } = useTranslation('charNames_gen')
  const { database } = useDatabaseContext()
  const team = useTeam(mainChar.key)
  const effectiveMindscape = mindscapeOverride ?? mainChar.mindscape
  const src = teammateKey ?? characterKey

  // Lumiflux characters (e.g. Remielle) proxy the Voidflare-inherited element
  // with the first non-lumiflux teammate's attribute: First Teammate slot takes
  // precedence over Second; empty slots fall back to the main character.
  const isLumiflux = getCharStat(characterKey).attribute === 'lumiflux'
  const fluxedElement = useMemo(() => {
    if (!isLumiflux || !team) return undefined
    const slots = team.teammates.slice(1, 3)
    for (const m of slots) {
      const key = m?.characterKey ?? mainChar.key
      const attr = getCharStat(key).attribute
      if (attr !== 'lumiflux') return attr
    }
    return undefined
  }, [isLumiflux, team, mainChar.key])

  const allConditionals = conditionals as Record<string, unknown>
  const charConditionals = allConditionals[characterKey] as
    | Record<string, IConditionalData>
    | undefined

  const char = useCharacter(characterKey)
  const potential = char?.potential ?? 0
  const conditionalFields = useMemo(
    () => extractCharConditionalFields(characterKey, teammateKey, potential),
    [characterKey, teammateKey, potential]
  )
  const conditionalDescriptions = useMemo(
    () => extractCharConditionalDescriptions(characterKey),
    [characterKey]
  )
  const conditionalLabels = useMemo(
    () => extractCharConditionalLabels(characterKey),
    [characterKey]
  )
  const conditionalUiOptions = useMemo(
    () => extractCharConditionalUiOptions(characterKey),
    [characterKey]
  )
  const visiblePassives = useMemo(
    () => extractCharPassiveFields(characterKey, teammateKey, potential),
    [characterKey, teammateKey, potential]
  )

  const [conditionalSectionMap, conditionalLinkedMap] = useMemo(() => {
    const sheet = charSheets[characterKey]
    if (!sheet) return [{}, {}]
    const sectionResult: Record<string, string[]> = {}
    const linkedResult: Record<string, string | string[]> = {}
    Object.entries(sheet).forEach(([sectionKey, section]) => {
      section.documents.forEach((doc) => {
        if (doc.type === 'conditional' && doc.conditional) {
          const condName = doc.conditional.metadata.name
          if (doc.conditional.section) {
            const arr = (sectionResult[condName] ??= [])
            arr.push(doc.conditional.section)
          } else if (sectionKey === 'core') {
            const isAbility = doc.conditional.fields?.some(
              (f) => 'fieldRef' in f && f.fieldRef?.name?.startsWith('ability_')
            )
            const sec = isAbility ? 'ability' : 'core'
            const arr = (sectionResult[condName] ??= [])
            arr.push(sec)
          } else {
            const arr = (sectionResult[condName] ??= [])
            arr.push(sectionKey)
          }
          if (doc.conditional.linked) {
            linkedResult[condName] = doc.conditional.linked
          }
        }
      })
    })
    return [sectionResult, linkedResult]
  }, [characterKey])

  const conditionalOrderMap = useMemo(() => {
    const sheet = charSheets[characterKey]
    if (!sheet) return {}
    const order: Record<string, number> = {}
    let idx = 0
    Object.values(sheet).forEach((section) => {
      section.documents.forEach((doc) => {
        if (doc.type === 'conditional' && doc.conditional) {
          const name = doc.conditional.metadata.name
          if (!(name in order)) order[name] = idx++
        }
      })
    })
    return order
  }, [characterKey])

  const condEntries = useMemo(
    () =>
      charConditionals
        ? Object.entries(charConditionals).sort(([aName, a], [bName, b]) => {
            const aReq = (a as IConditionalData).mindscapeRequirement ?? 0
            const bReq = (b as IConditionalData).mindscapeRequirement ?? 0
            if (aReq !== bReq) return aReq - bReq
            return (
              (conditionalOrderMap[aName] ?? 0) -
              (conditionalOrderMap[bName] ?? 0)
            )
          })
        : [],
    [charConditionals, conditionalOrderMap]
  )

  const sectionGroups = useMemo(() => {
    const orderedKeys = SECTION_ORDER as readonly string[]
    const groups: SectionGroup[] = []
    for (const sectionKey of orderedKeys) {
      const groupConditionals: SectionConditional[] = []
      const groupPassives: PassiveEntry[] = []

      for (const [condName, condData] of condEntries) {
        const secs = conditionalSectionMap[condName]
        if (!secs?.includes(sectionKey)) continue
        const condFields = conditionalFields?.[condName]
        if (teammateKey) {
          if (!condFields) continue
        } else {
          if (conditionalFields && !condFields) continue
        }

        groupConditionals.push({
          condName,
          condData,
          fields: condFields,
          description: conditionalDescriptions?.[condName],
          label: conditionalLabels?.[condName],
          linked: conditionalLinkedMap[condName],
          ...conditionalUiOptions?.[condName],
        })
      }

      if (showPassives && visiblePassives) {
        for (const p of visiblePassives) {
          const sec =
            p.sectionKey === 'core'
              ? p.fields.some(
                  (f) =>
                    'fieldRef' in f && f.fieldRef?.name?.startsWith('ability_')
                )
                ? 'ability'
                : 'core'
              : p.sectionKey
          if (sec !== sectionKey) continue
          groupPassives.push(p)
        }
      }

      if (groupConditionals.length === 0 && groupPassives.length === 0) continue
      groups.push({
        sectionKey,
        conditionals: groupConditionals,
        passives: groupPassives,
      })
    }
    return groups
  }, [
    condEntries,
    conditionalFields,
    conditionalDescriptions,
    conditionalLabels,
    conditionalSectionMap,
    conditionalLinkedMap,
    conditionalUiOptions,
    visiblePassives,
    showPassives,
    teammateKey,
  ])

  const fluxedElementRow =
    isLumiflux && !teammateKey ? (
      <FluxedElementRow element={fluxedElement} />
    ) : null

  if (!charConditionals) {
    console.log(
      '[CharacterConditionalsDisplay] No conditionals for',
      characterKey,
      'Available keys:',
      Object.keys(allConditionals).slice(0, 10)
    )
    return (
      <Flex direction="column" gap={5}>
        {fluxedElementRow}
        <Text size="xs" c="dimmed">
          No conditionals
        </Text>
      </Flex>
    )
  }

  if (sectionGroups.length === 0) {
    return (
      <Flex direction="column" gap={5}>
        {fluxedElementRow}
        <Text size="xs" c="dimmed">
          No conditionals
        </Text>
      </Flex>
    )
  }

  return (
    <EffectiveMindscapeContext.Provider value={effectiveMindscape}>
      <Flex direction="column" gap={5}>
        <HeaderText>{t(characterKey)} Conditionals</HeaderText>
        {fluxedElementRow}
        {sectionGroups.map((group) => (
          <Box key={group.sectionKey}>
            <Text size="xs" fw={600} c="dimmed" mb={2}>
              {SECTION_DISPLAY_NAMES[group.sectionKey] ?? group.sectionKey}
            </Text>
            <Flex direction="column" gap={2}>
              {group.passives.map((entry, i) => (
                <PassiveFieldRow
                  key={`p-${i}`}
                  characterKey={characterKey}
                  fields={entry.fields}
                  sectionKey={entry.sectionKey}
                  paragraph={entry.paragraph}
                  descKey={entry.descKey}
                  groupTitle={entry.groupTitle}
                  description={entry.description}
                  disabled={effectiveMindscape < entry.mindscape}
                />
              ))}
              {group.conditionals.map((c) => (
                <CharacterConditionalRow
                  key={c.condName}
                  characterKey={characterKey}
                  condName={c.condName}
                  condData={c.condData}
                  team={team}
                  database={database}
                  mainCharKey={mainChar.key}
                  src={src}
                  mindscape={effectiveMindscape}
                  fields={c.fields}
                  description={c.description}
                  label={c.label}
                  showZeroFields={showZeroFields}
                  linked={c.linked}
                  maxByMindscape={c.maxByMindscape}
                  noDimWhenZero={c.noDimWhenZero}
                />
              ))}
            </Flex>
          </Box>
        ))}
      </Flex>
    </EffectiveMindscapeContext.Provider>
  )
}

const CharacterConditionalRow = memo(function CharacterConditionalRow({
  characterKey,
  condName,
  condData,
  team,
  database,
  mainCharKey,
  src,
  mindscape,
  fields,
  description,
  label: labelProp,
  showZeroFields = false,
  linked,
  maxByMindscape,
  noDimWhenZero,
}: {
  characterKey: CharacterKey
  condName: string
  condData: IConditionalData
  team: ReturnType<typeof useTeam>
  database: ReturnType<typeof useDatabaseContext>['database']
  mainCharKey: CharacterKey
  src: CharacterKey
  mindscape: number
  fields?: Field[]
  description?: ReactNode
  label?: ReactNode
  showZeroFields?: boolean
  linked?: string | string[]
  maxByMindscape?: Record<number, number>
  noDimWhenZero?: boolean
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(() => ({ ...outerTag, src }), [outerTag, src])
  const currentCond = team?.frames[0]?.conditionals?.find(
    (c) => c.sheet === characterKey && c.condKey === condName && c.src === src
  )
  const currentValue = currentCond?.condValue ?? 0

  const mindscapeRequirement =
    condData.mindscapeRequirement ?? getMindscapeRequirement(condName)
  const isMindscapeDisabled =
    mindscapeRequirement !== null && mindscape < mindscapeRequirement

  const displayValue = currentValue

  const effectiveMax = useMemo(() => {
    if (condData.type !== 'num') return 10
    if (!maxByMindscape) return condData.max ?? 10
    const levels = Object.keys(maxByMindscape)
      .map(Number)
      .sort((a, b) => b - a)
    for (const level of levels) {
      if (mindscape >= level) return maxByMindscape[level]
    }
    return condData.min ?? 0
  }, [condData, maxByMindscape, mindscape])

  const displayMax = effectiveMax

  const setValue = (condValue: number) => {
    if (isMindscapeDisabled) return
    const linkedNames = linked
      ? Array.isArray(linked)
        ? linked
        : [linked]
      : []
    database.teams.setFrameConditional(
      mainCharKey,
      0,
      characterKey as any,
      condName,
      src as any,
      null,
      Math.min(condValue, effectiveMax)
    )
    for (const linkName of linkedNames) {
      database.teams.setFrameConditional(
        mainCharKey,
        0,
        characterKey as any,
        linkName,
        src as any,
        null,
        condValue
      )
    }
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
          value={Math.min(displayValue, displayMax)}
          min={condData.min ?? 0}
          max={displayMax}
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
          <Text
            size="sm"
            mb={8}
            style={{
              whiteSpace: 'pre-wrap',
              opacity: isMindscapeDisabled ? 0.5 : undefined,
            }}
          >
            {renderDescription(description)}
          </Text>
        )}
        {fields && fields.length > 0 && (
          <Box
            opacity={
              isMindscapeDisabled || (displayValue === 0 && !noDimWhenZero)
                ? 0.5
                : undefined
            }
          >
            {(isMindscapeDisabled || displayValue > 0) && <hr />}
            <Box mt={4}>
              <TagContext.Provider value={tagForFields as any}>
                {fields.map(
                  (field, i) =>
                    'fieldRef' in field && (
                      <TagFieldDisplay
                        key={i}
                        field={field}
                        showZero={
                          isMindscapeDisabled
                            ? true
                            : displayValue === 0
                              ? true
                              : showZeroFields
                        }
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

const PassiveFieldRow = memo(function PassiveFieldRow({
  characterKey,
  fields,
  sectionKey,
  paragraph,
  descKey: descKeyOverride,
  groupTitle,
  description,
  disabled = false,
}: {
  characterKey: CharacterKey
  fields: Field[]
  sectionKey: string
  paragraph?: number
  descKey?: string
  groupTitle?: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const outerTag = useContext(TagContext)
  const tagForFields = useMemo(
    () => ({ ...outerTag, src: characterKey }),
    [outerTag, characterKey]
  )
  const char = useCharacter(characterKey)
  const coreLevel = char?.core ?? 0
  const potential = char?.potential ?? 0
  const firstFieldRef =
    fields.length > 0 && 'fieldRef' in fields[0] ? fields[0].fieldRef : null
  const descKey = useMemo(() => {
    if (descKeyOverride) {
      if (paragraph !== undefined) return `${descKeyOverride}.${paragraph}`
      return descKeyOverride
    }
    const baseKey = passiveSectionToDescKey(
      sectionKey,
      firstFieldRef?.name,
      coreLevel,
      potential
    )
    if (paragraph !== undefined && baseKey) return `${baseKey}.${paragraph}`
    return baseKey
  }, [
    sectionKey,
    firstFieldRef?.name,
    paragraph,
    coreLevel,
    potential,
    descKeyOverride,
  ])
  const ns = `char_${characterKey}_gen`
  const abilityPotentialDescKey = usePotentialDescKey(
    characterKey,
    ns,
    'ability.desc.0'
  )
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
        {description ? (
          <Text
            size="sm"
            mb={8}
            style={{
              whiteSpace: 'pre-wrap',
              opacity: disabled ? 0.5 : undefined,
            }}
          >
            {renderDescription(description)}
          </Text>
        ) : (
          descKey && (
            <Text
              size="sm"
              mb={8}
              style={{ opacity: disabled ? 0.5 : undefined }}
            >
              {firstFieldRef?.name?.startsWith('ability_') ? (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <GameDesc ns={ns} key18={abilityPotentialDescKey} />
                  </div>
                  <SkillGameDesc
                    characterKey={characterKey}
                    ns={ns}
                    key18={descKey}
                  />
                </>
              ) : (
                <SkillGameDesc
                  characterKey={characterKey}
                  ns={ns}
                  key18={descKey}
                />
              )}
            </Text>
          )
        )}
        {fields.length > 0 && (
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
                          i === 0 &&
                          !groupTitle &&
                          typeof field.title !== 'string' ? (
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
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

const FluxedElementRow = memo(function FluxedElementRow({
  element,
}: {
  element: AttributeKey | undefined
}) {
  const label = element
    ? `Luminize Fluxed Element: ${elementalData[element]}`
    : 'Luminize Fluxed Element: None'
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
          <Flex align="center" gap={6}>
            {element && (
              <ElementIcon
                ele={element}
                iconProps={{ style: { fontSize: '1.1rem' } }}
              />
            )}
            <Text size="sm" c={element ? undefined : 'dimmed'}>
              {label}
            </Text>
          </Flex>
        </Box>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {label}
        </Text>
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          Upon entering the battlefield, a{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux Agent</ColorText>{' '}
          undergoes{' '}
          <ColorText color={FLUX_TEXT_COLOR}>Attribute Flux</ColorText> based on
          the Base attribute of the next Agent in the squad. After undergoing{' '}
          <ColorText color={FLUX_TEXT_COLOR}>Attribute Flux</ColorText>, when
          the Agent deals{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux DMG</ColorText>, it is
          treated as dealing attribute DMG of the attribute targeted by{' '}
          <ColorText color={FLUX_TEXT_COLOR}>Attribute Flux</ColorText>.
          <br />
          When Agents deal{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux DMG</ColorText>, they
          do not accumulate Anomaly Buildup. Some skills of{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux</ColorText> Agents can
          directly apply{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux Buildup</ColorText> to
          enemies.
          <br />
          If an enemy has{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux Buildup</ColorText>{' '}
          and is about to enter an Anomaly state, that Anomaly state will be{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Refringed</ColorText>. After{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Refringe</ColorText>, the{' '}
          <ColorText color="#FFFFFF">Anomaly Effect Strength</ColorText> of that
          Anomaly state will be enhanced based on the{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>
            Refringe Coefficient
          </ColorText>{' '}
          of the{' '}
          <ColorText color={LUMIFLUX_TEXT_COLOR}>Lumiflux Buildup</ColorText>{' '}
          provider, increasing the total DMG dealt by that Anomaly state.
          <br />
          {element
            ? `Currently: ${elementalData[element]}`
            : 'Currently: No Attribute Flux'}
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  )
})
