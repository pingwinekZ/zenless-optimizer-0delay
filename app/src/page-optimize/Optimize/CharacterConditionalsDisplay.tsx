import { Box, Flex, Text } from '@mantine/core'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import {
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import { conditionals } from '@zenless-optimizer/zzz/formula'
import { charSheets } from '@zenless-optimizer/zzz/formula-ui'
import { EffectiveMindscapeContext } from '@zenless-optimizer/zzz/formula-ui/char/sheetUtil'
import { getCharStat } from '@zenless-optimizer/zzz/stats'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HeaderText } from '../layout'
import {
  CharacterConditionalRow,
  FluxedElementRow,
  PassiveFieldRow,
} from './CharacterConditionalRows'
import {
  extractCharConditionalDescriptions,
  extractCharConditionalFields,
  extractCharConditionalLabels,
  extractCharConditionalUiOptions,
  extractCharPassiveFields,
  type PassiveEntry,
  SECTION_DISPLAY_NAMES,
  SECTION_ORDER,
  type SectionConditional,
  type SectionGroup,
} from './characterConditionalsUtils'

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

  const potential = 6
  const conditionalFields = useMemo(
    () => extractCharConditionalFields(characterKey, teammateKey, potential),
    [characterKey, teammateKey]
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
    [characterKey, teammateKey]
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
