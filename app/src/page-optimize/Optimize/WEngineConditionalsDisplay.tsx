import { Flex, Text } from '@mantine/core'

import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { TagField } from '@zenless-optimizer/game-opt/sheet-ui'
import type { CharacterKey, WengineKey } from '@zenless-optimizer/zzz/consts'
import {
  useCharacterContext,
  useDatabaseContext,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import { conditionals, own } from '@zenless-optimizer/zzz/formula'
import { useZzzCalcContext } from '@zenless-optimizer/zzz/formula-ui'
import { getCharStat } from '@zenless-optimizer/zzz/stats'
import { useContext, useMemo } from 'react'
import {
  WengineConditionalRow,
  WenginePassiveFieldRow,
  WenginePassiveGroup,
} from './WengineConditionalRows'
import {
  extractWengineConditionalFields,
  extractWengineCondLabels,
  extractWenginePassiveGroups,
  isWengineCondVisible,
} from './wengineConditionalUtils'
import {
  resolveCondDescOverride,
  resolvePassiveDescOverride,
} from './wengineDescs'

export function WEngineConditionalsDisplay({
  wengineKey,
  teammateKey,
  wenginePhase: propPhase,
  showPassives = false,
}: {
  wengineKey: WengineKey | ''
  teammateKey?: CharacterKey
  /**
   * Wengine phase to use for descriptions. When rendering for a teammate,
   * this should be the teammate's effective wengine phase (which may differ
   * from the main character's). Falls back to the calc context (main char)
   * when not provided.
   */
  wenginePhase?: number
  showPassives?: boolean
}) {
  // Resolve phase: use the prop if provided (teammate context), otherwise
  // fall back to the calc context (main character context)
  const calc = useZzzCalcContext()
  const phase =
    propPhase ?? (calc ? (calc.compute(own.wengine.phase).val ?? 1) : 1)
  const mainChar = useCharacterContext()!
  const { database } = useDatabaseContext()
  const team = useTeam(mainChar.key)
  const src = teammateKey ?? mainChar.key

  // Extract conditional fields from wengine UI sheet
  const weConditionalFields = useMemo(
    () => extractWengineConditionalFields(wengineKey, teammateKey),
    [wengineKey, teammateKey]
  )

  // Extract localized labels from wengine UI sheet
  const weCondLabels = useMemo(
    () => extractWengineCondLabels(wengineKey),
    [wengineKey]
  )

  // Extract passive field groups with headers from 'fields'-type documents
  const passiveFieldGroups = useMemo(
    () => extractWenginePassiveGroups(wengineKey, teammateKey),
    [wengineKey, teammateKey]
  )

  // Tag context for rendering passive team-wide buff fields
  const outerTag = useContext(TagContext)
  const tagForPassiveFields = useMemo(
    () => ({ ...outerTag, src }),
    [outerTag, src]
  )

  // Early return (no hooks after this point)
  if (!wengineKey) {
    return (
      <Flex direction="column" gap={5}>
        <Text size="sm" c="dimmed">
          No W-Engine equipped.
        </Text>
      </Flex>
    )
  }

  const wengineConditionals = (conditionals as any)[wengineKey]
  const condEntries = wengineConditionals
    ? (Object.entries(wengineConditionals) as [string, IConditionalData][])
    : []

  const hasPassives = passiveFieldGroups && passiveFieldGroups.length > 0

  // If there are no conditionals AND no passive team fields, show placeholder
  if (condEntries.length === 0 && !hasPassives)
    return (
      <Flex direction="column" gap={5}>
        <Text size="sm" c="dimmed">
          No conditionals for this W-Engine.
        </Text>
      </Flex>
    )

  return (
    <Flex direction="column" gap={5}>
      {/* Render passive (always-active) team-wide buffs */}
      {showPassives && hasPassives && (
        <Flex direction="column" gap={4}>
          <TagContext.Provider value={tagForPassiveFields as any}>
            {passiveFieldGroups.map((group, gi) => {
              const tagFields = group.fields.filter(
                (f): f is TagField => 'fieldRef' in f
              )
              // Description override for the group (per-wengine slice of its phase text)
              const groupDescOverride = resolvePassiveDescOverride(
                wengineKey,
                tagFields,
                phase
              )

              return group.header ? (
                <WenginePassiveGroup
                  key={gi}
                  wengineKey={wengineKey}
                  header={group.header}
                  fields={tagFields}
                  tagForPassiveFields={tagForPassiveFields}
                  wenginePhase={phase}
                  descriptionOverride={groupDescOverride}
                />
              ) : (
                tagFields.map((field, i) => (
                  <WenginePassiveFieldRow
                    key={i}
                    wengineKey={wengineKey}
                    field={field}
                    tagForPassiveFields={tagForPassiveFields}
                    wenginePhase={phase}
                    descriptionOverride={groupDescOverride}
                  />
                ))
              )
            })}
          </TagContext.Provider>
        </Flex>
      )}
      {condEntries
        .filter(([condName]) =>
          isWengineCondVisible(
            wengineKey,
            condName,
            weConditionalFields,
            teammateKey,
            getCharStat(src).faction
          )
        )
        .map(([condName, condData]) => (
          <WengineConditionalRow
            key={condName}
            wengineKey={wengineKey}
            condName={condName}
            condData={condData}
            team={team}
            database={database}
            mainCharKey={mainChar.key}
            src={src}
            fields={weConditionalFields?.[condName]}
            label={weCondLabels?.[condName]}
            wenginePhase={phase}
            descriptionOverride={resolveCondDescOverride(
              wengineKey,
              condName,
              phase
            )}
          />
        ))}
    </Flex>
  )
}
