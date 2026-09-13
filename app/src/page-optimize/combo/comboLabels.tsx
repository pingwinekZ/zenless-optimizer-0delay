import { HoverCard, Text } from '@mantine/core'
import { type ReactNode, Suspense } from 'react'
import { characterAsset, discDefIcon, wengineAsset } from '../../assets'
import {
  allCharacterKeys,
  type CharacterKey,
  type DiscSetKey,
  isDiscSetKey,
  isWengineKey,
  type WengineKey,
} from '../../consts'
import { conditionals as allConditionalsMeta } from '../../formula'
import { charSheets, discUiSheets, wengineUiSheets } from '../../formula-ui'
import { GameDesc } from '../../i18n'
import { CharacterName } from '../../ui/Character/CharacterTrans'
import { DiscSetName } from '../../ui/Disc/DiscTrans'
import { WengineName } from '../../ui/Wengine/WengineTrans'
import { condLabel } from '../Optimize/conditionalUtils'
import type { ComboMember } from './useComboMembers'

type UiDoc = {
  type: string
  conditional?: {
    metadata: { name: string }
    label?: unknown
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
  return condLabel(condKey, sheet)
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

/**
 * Label with the same hover doc as the page's conditional displays.
 * Renders children directly when there is no description.
 */
export function CondLabelWithHover({
  sheet,
  condKey,
  members,
  children,
}: {
  sheet: string
  condKey: string
  members: ComboMember[]
  children: ReactNode
}) {
  const description = comboCondDescription(sheet, condKey, members)
  if (!description)
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
      </HoverCard.Dropdown>
    </HoverCard>
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
  return <span>{sheetKey}</span>
}
