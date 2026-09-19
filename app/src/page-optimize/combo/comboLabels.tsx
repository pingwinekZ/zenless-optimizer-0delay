import { Box, HoverCard, Text } from '@mantine/core'
import { correctConditionalValue } from '@zenless-optimizer/game-opt/engine'
import { CalcContext, TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import {
  type Field,
  TagFieldDisplay,
} from '@zenless-optimizer/game-opt/sheet-ui'
import { type ReactNode, Suspense, useContext, useMemo } from 'react'
import { characterAsset, discDefIcon, wengineAsset } from '../../assets'
import {
  allCharacterKeys,
  type CharacterKey,
  type DiscSetKey,
  type DiscSlotKey,
  elementalData,
  isDiscSetKey,
  isWengineKey,
  type WengineKey,
} from '../../consts'
import {
  comboCondHash,
  type ICachedDisc,
  type Team,
  type TeamConditional,
} from '../../db'
import { useDatabaseContext } from '../../db-ui'
import {
  conditionals as allConditionalsMeta,
  getConditional,
  zzzCalculatorWithEntries,
} from '../../formula'
import { charSheets, discUiSheets, wengineUiSheets } from '../../formula-ui'
import { GameDesc } from '../../i18n'
import { CharacterName } from '../../ui/Character/CharacterTrans'
import { DiscSetName } from '../../ui/Disc/DiscTrans'
import { WengineName } from '../../ui/Wengine/WengineTrans'
import { condLabel } from '../Optimize/conditionalUtils'
import { buildCalculatorEntries } from '../Util/buildStatsUtils'
import { useComboDrawerStore } from './useComboDrawerStore'
import type { ComboMember } from './useComboMembers'

type UiDoc = {
  type: string
  conditional?: {
    metadata: { name: string }
    label?: unknown
    fields?: Field[]
  }
}

function extractLabel(
  docs: readonly UiDoc[] | undefined,
  condKey: string
): ReactNode | undefined {
  for (const doc of docs ?? []) {
    if (
      doc.type === 'conditional' &&
      doc.conditional?.metadata.name === condKey
    ) {
      const { label } = doc.conditional
      if (label && typeof label !== 'function') return label as ReactNode
    }
  }
  return undefined
}

function isCharacterKey(key: string): key is CharacterKey {
  return (allCharacterKeys as readonly string[]).includes(key)
}

function mindscapeFromName(condKey: string): number | null {
  const match = condKey.match(/^m([1-6])/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Mindscape requirement for a row, mirroring CharacterConditionalRow:
 * explicit metadata requirement, else the m1–m6 name convention.
 */
export function comboCondReq(sheet: string, condKey: string): number | null {
  const meta = (
    allConditionalsMeta as Record<
      string,
      Record<string, { mindscapeRequirement?: number }>
    >
  )[sheet]?.[condKey]
  return meta?.mindscapeRequirement ?? mindscapeFromName(condKey)
}

/** Whether the row is locked: owner's mindscape below the requirement. */
export function isComboRowLocked(
  cond: { sheet: string; condKey: string; src: string },
  members: ComboMember[]
): boolean {
  const req = comboCondReq(cond.sheet, cond.condKey)
  if (req == null || req <= 0) return false
  const owner =
    members.find((m) => (m.key as string) === cond.src) ?? members[0]
  if (!owner) return false
  return owner.mindscape < req
}

/**
 * Localized conditional label, mirroring the optimize page displays:
 * character/w-engine/disc UI sheets first, `condLabel` fallback otherwise.
 */
export function comboCondLabel(sheet: string, condKey: string): ReactNode {
  if (isCharacterKey(sheet)) {
    const sections = charSheets[sheet]
    if (sections) {
      for (const section of Object.values(sections)) {
        const label = extractLabel(section.documents as UiDoc[], condKey)
        if (label) return label
      }
    }
    return condLabel(condKey, `char_${sheet}`)
  }
  if (isWengineKey(sheet)) {
    return (
      extractLabel(
        wengineUiSheets[sheet]?.documents as UiDoc[] | undefined,
        condKey
      ) ?? condLabel(condKey, `wengine_${sheet}`)
    )
  }
  if (isDiscSetKey(sheet)) {
    for (const block of ['2', '4'] as const) {
      const label = extractLabel(
        discUiSheets[sheet]?.[block]?.documents as UiDoc[] | undefined,
        condKey
      )
      if (label) return label
    }
    return condLabel(condKey, `disc_${sheet}`)
  }
  if (sheet === 'enemy') {
    if (condKey === 'isStunned') return 'Enemy is Stunned'
    if (condKey === 'isWindswept') return 'Enemy is Windswept'
    if (condKey === 'windsweptInfusion') return 'Windswept Infusion'
  }
  return condLabel(condKey, sheet)
}

/**
 * Display label for a list-conditional option in the drawer. Windswept
 * infusion options are attribute keys — show the same display names as the
 * rest of the app ("Fire", not "fire").
 */
export function comboListOptionLabel(
  sheet: string,
  condKey: string,
  option: string
): string {
  if (sheet === 'enemy' && condKey === 'windsweptInfusion')
    return (elementalData as Record<string, string>)[option] ?? option
  return option
}

type UiDescDoc = {
  type: string
  conditional?: {
    metadata: { name: string }
    description?: unknown
  }
}

function extractDescription(
  docs: readonly UiDescDoc[] | undefined,
  condKey: string
): ReactNode | undefined {
  for (const doc of docs ?? []) {
    if (
      doc.type === 'conditional' &&
      doc.conditional?.metadata.name === condKey
    ) {
      const { description } = doc.conditional
      if (description && typeof description !== 'function')
        return description as ReactNode
    }
  }
  return undefined
}

/**
 * Sort key for rows of a character sheet, mirroring
 * CharacterConditionalsDisplay: mindscape requirement first, then sheet
 * document order. Non-character sheets keep their existing order.
 */
export function sortComboConds<T extends { sheet: string; condKey: string }>(
  sheet: string,
  conds: T[]
): T[] {
  if (!isCharacterKey(sheet)) return conds
  const sections = charSheets[sheet]
  const order: Record<string, number> = {}
  if (sections) {
    let idx = 0
    for (const section of Object.values(sections)) {
      for (const doc of section.documents as UiDescDoc[]) {
        if (doc.type === 'conditional' && doc.conditional) {
          const name = doc.conditional.metadata.name
          if (!(name in order)) order[name] = idx++
        }
      }
    }
  }
  return [...conds].sort((a, b) => {
    const reqA = comboCondReq(sheet, a.condKey) ?? 0
    const reqB = comboCondReq(sheet, b.condKey) ?? 0
    if (reqA !== reqB) return reqA - reqB
    return (order[a.condKey] ?? 0) - (order[b.condKey] ?? 0)
  })
}

/**
 * Hover description for a conditional, mirroring the page displays:
 * character conditional docs, w-engine phase descriptions, disc set bonus
 * descriptions. Returns undefined when the page shows no description.
 */
export function comboCondDescription(
  sheet: string,
  condKey: string,
  members: ComboMember[]
): ReactNode | undefined {
  if (isCharacterKey(sheet)) {
    const sections = charSheets[sheet]
    if (!sections) return undefined
    const parts: ReactNode[] = []
    for (const section of Object.values(sections)) {
      const desc = extractDescription(section.documents as UiDescDoc[], condKey)
      if (desc) parts.push(desc)
    }
    if (parts.length === 0) return undefined
    return (
      <>
        {parts.map((part, i) => (
          <Text key={i} size="sm" mb={i === parts.length - 1 ? 0 : 8}>
            {part}
          </Text>
        ))}
      </>
    )
  }
  if (isWengineKey(sheet)) {
    const member = members.find(
      (m) => (m.key as string) === sheet || m.wengineKey === sheet
    )
    const phase = member?.wenginePhase ?? 1
    return (
      <GameDesc ns={`wengine_${sheet}_gen`} key18={`phaseDescs.${phase - 1}`} />
    )
  }
  if (isDiscSetKey(sheet)) {
    const member = members.find((m) => m.discSets[sheet] != null)
    const count = member?.discSets[sheet] ?? 4
    return (
      <GameDesc
        ns={`disc_${sheet}_gen`}
        key18={count === 4 ? 'desc4' : 'desc2'}
      />
    )
  }
  return undefined
}

function extractFields(
  docs: readonly UiDoc[] | undefined,
  condKey: string
): Field[] {
  const out: Field[] = []
  // Dedup fields merged from linked docs split across sections (mirrors the
  // character display); text fields are always kept.
  const seen = new Set<string>()
  for (const doc of docs ?? []) {
    if (
      doc.type !== 'conditional' ||
      doc.conditional?.metadata.name !== condKey
    )
      continue
    for (const field of doc.conditional.fields ?? []) {
      if ('fieldRef' in field) {
        const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}|${field.fieldRef?.name ?? ''}`
        if (!key || seen.has(key)) continue
        seen.add(key)
      }
      out.push(field)
    }
  }
  return out
}

/**
 * Buff value fields for a conditional, mirroring the page's conditional
 * displays: character/w-engine/disc UI sheet docs for the row's condKey.
 */
export function comboCondFields(sheet: string, condKey: string): Field[] {
  if (isCharacterKey(sheet)) {
    const sections = charSheets[sheet]
    if (!sections) return []
    return extractFields(
      Object.values(sections).flatMap(
        (section) => section.documents as UiDoc[]
      ),
      condKey
    )
  }
  if (isWengineKey(sheet)) {
    return extractFields(
      wengineUiSheets[sheet]?.documents as UiDoc[] | undefined,
      condKey
    )
  }
  if (isDiscSetKey(sheet)) {
    return (['2', '4'] as const).flatMap((block) =>
      extractFields(
        discUiSheets[sheet]?.[block]?.documents as UiDoc[] | undefined,
        condKey
      )
    )
  }
  return []
}

/**
 * Label with the same hover doc as the page's conditional displays, plus
 * the computed buff values. Renders children directly when there is neither
 * a description nor buff fields.
 *
 * Buff values follow the drawer row being edited (not the main-form states):
 * bool rows compute as if ON, num/list rows at the hovered partition's value
 * (the default row's value for the default partition). The override calc is
 * built lazily inside `ComboHoverFields` (mounted on hover open), memoized
 * per row + value.
 */
export function CondLabelWithHover({
  sheet,
  condKey,
  src,
  dst,
  hash,
  members,
  children,
  hoverValue,
}: {
  sheet: string
  condKey: string
  src: string
  dst: string | null
  hash: string
  members: ComboMember[]
  children: ReactNode
  /** Explicit buff value for hover (partition rows); defaults to row default. */
  hoverValue?: number
}) {
  const description = comboCondDescription(sheet, condKey, members)
  const fields = useMemo(
    () => comboCondFields(sheet, condKey),
    [sheet, condKey]
  )
  if (!description && fields.length === 0)
    return <span style={{ display: 'contents' }}>{children}</span>
  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <div style={{ cursor: 'default' }}>{children}</div>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {comboCondLabel(sheet, condKey)}
        </Text>
        <Suspense fallback={null}>{description}</Suspense>
        {fields.length > 0 && (
          <ComboHoverFields
            sheet={sheet}
            condKey={condKey}
            src={src}
            dst={dst}
            hash={hash}
            members={members}
            fields={fields}
            hoverValue={hoverValue}
          />
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

/**
 * Calculator with a single drawer-row conditional overridden (see
 * `CondLabelWithHover`). Returns null when no override applies — callers
 * fall back to the ambient page calc.
 */
function useCondOverrideCalc(
  sheet: string,
  condKey: string,
  src: string,
  dst: string | null,
  hash: string,
  enabled: boolean,
  explicitValue?: number
) {
  const { database } = useDatabaseContext()
  const characterKey = useComboDrawerStore((s) => s.characterKey)
  const drawerDefaults = useComboDrawerStore((s) => s.defaults)
  const team = database.teams.get(characterKey as CharacterKey)
  const teamCondJson = JSON.stringify(team?.frames[0]?.conditionals ?? null)
  const teamBlobJson = team?.frames[0]?.tag?.comboStateJson ?? null

  return useMemo(() => {
    if (!enabled) return null
    const meta = getConditional(sheet as never, condKey)
    if (!meta) return null
    // Bool rows show the active value; other rows follow the hovered
    // partition's value (explicitValue) or fall back to the row default.
    const target =
      explicitValue ?? (meta.type === 'bool' ? 1 : drawerDefaults[hash])
    if (target === undefined) return null
    if (!team) return null
    const frame0 = team.frames[0]
    if (!frame0) return null
    const character = database.chars.get(characterKey as CharacterKey)
    if (!character) return null

    const eff = correctConditionalValue(meta as never, target)
    // Base every conditional on the drawer's current defaults (not just the
    // committed frame states), so companion toggles made in the drawer —
    // e.g. a bool gating this row's num buff — are respected. The hovered
    // row itself is forced to the override value below.
    const correct = (c: TeamConditional, value: number) => {
      const m = getConditional(c.sheet as never, c.condKey)
      return m ? correctConditionalValue(m as never, value) : value
    }
    const withBase = frame0.conditionals.map((c) => {
      const h = comboCondHash(c.sheet, c.condKey, c.src, c.dst)
      const d = drawerDefaults[h]
      return d === undefined ? c : { ...c, condValue: correct(c, d) }
    })
    const matched = withBase.some(
      (c) => c.sheet === sheet && c.condKey === condKey && c.src === src
    )
    const conditionals: TeamConditional[] = matched
      ? withBase.map((c) =>
          c.sheet === sheet && c.condKey === condKey && c.src === src
            ? { ...c, condValue: eff }
            : c
        )
      : [
          ...withBase,
          { sheet, src, dst, condKey, condValue: eff } as TeamConditional,
        ]

    // Flatten this row's advanced per-hit overrides to the override value so
    // a dirty blob does not mask it (preset0 reads hit 0's blob value).
    let tag = frame0.tag
    if (tag?.comboStateJson) {
      try {
        const blob = JSON.parse(tag.comboStateJson) as {
          values?: Record<string, number[]>
        }
        if (blob?.values && Array.isArray(blob.values[hash])) {
          tag = {
            ...tag,
            comboStateJson: JSON.stringify({
              ...blob,
              values: {
                ...blob.values,
                [hash]: blob.values[hash].map(() => eff),
              },
            }),
          }
        }
      } catch {
        // Keep the original blob.
      }
    }

    const overridden: Team = {
      ...team,
      frames: team.frames.map((f, i) =>
        i === 0 ? { ...f, conditionals, tag } : f
      ),
    }
    const discs = {} as Record<DiscSlotKey, ICachedDisc | undefined>
    for (const [slot, id] of Object.entries(character.equippedDiscs ?? {})) {
      discs[slot as DiscSlotKey] = id
        ? (database.discs.get(id) ?? undefined)
        : undefined
    }
    const entries = buildCalculatorEntries(
      character,
      discs,
      overridden,
      (key) => database.chars.get(key) ?? undefined,
      (id) => database.discs.get(id) ?? undefined
    )
    return zzzCalculatorWithEntries(entries)
    // teamCondJson/teamBlobJson re-snapshot committed states; `team` itself
    // is only read for stable references (character/teammates/enemy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    database,
    characterKey,
    sheet,
    condKey,
    src,
    dst,
    hash,
    enabled,
    explicitValue,
    drawerDefaults,
    team,
    teamCondJson,
    teamBlobJson,
  ])
}

/**
 * Buff value fields for a drawer row, computed with the row's override calc.
 * Mounted on hover open, so the calc build only runs for hovered rows.
 */
function ComboHoverFields({
  sheet,
  condKey,
  src,
  dst,
  hash,
  members,
  fields,
  hoverValue,
}: {
  sheet: string
  condKey: string
  src: string
  dst: string | null
  hash: string
  members: ComboMember[]
  fields: Field[]
  hoverValue?: number
}) {
  // Extra (unequipped) disc sets have no calc entries — description only.
  const isExtraSet =
    isDiscSetKey(sheet) && !members.some((m) => m.discSets[sheet] != null)
  const calc = useCondOverrideCalc(
    sheet,
    condKey,
    src,
    dst,
    hash,
    !isExtraSet,
    hoverValue
  )
  const outerTag = useContext(TagContext)
  // Mirror the page displays: override only src, keep the ambient dst
  // (main character) so teammate buffs addressed to them still match.
  const tagForFields = useMemo(() => ({ ...outerTag, src }), [outerTag, src])
  if (isExtraSet || fields.length === 0) return null
  const list = (
    <Box mt={4}>
      <TagContext.Provider value={tagForFields as any}>
        {fields.map(
          (field, i) =>
            'fieldRef' in field && (
              <TagFieldDisplay
                key={i}
                field={field}
                showZero
                rowSx={{ paddingTop: 1, paddingBottom: 1, gap: 6 }}
              />
            )
        )}
      </TagContext.Provider>
    </Box>
  )
  // Without an override calc, TagFieldDisplay falls through to the ambient
  // page calc (previous behavior).
  if (!calc) return list
  return (
    <CalcContext.Provider value={calc as never}>{list}</CalcContext.Provider>
  )
}

/** Sheet icon for group rows (HSR shows the character/LC/set image). */
export function ComboSheetIcon({ sheetKey }: { sheetKey: string }) {
  let src = ''
  if (isCharacterKey(sheetKey)) src = characterAsset(sheetKey, 'circle')
  else if (isWengineKey(sheetKey)) src = wengineAsset(sheetKey)
  else if (isDiscSetKey(sheetKey)) src = discDefIcon(sheetKey)
  if (!src) return null
  return (
    <img
      src={src}
      alt={sheetKey}
      style={{ width: 80, height: 80, objectFit: 'contain' }}
    />
  )
}

/** Localized sheet name for group headers, like the rest of the app. */
export function ComboSheetName({ sheetKey }: { sheetKey: string }) {
  if (isCharacterKey(sheetKey)) return <CharacterName characterKey={sheetKey} />
  if (isWengineKey(sheetKey))
    return <WengineName wKey={sheetKey as WengineKey} />
  if (isDiscSetKey(sheetKey))
    return <DiscSetName setKey={sheetKey as DiscSetKey} />
  if (sheetKey === 'enemy') return <span>Enemy</span>
  return <span>{sheetKey}</span>
}
