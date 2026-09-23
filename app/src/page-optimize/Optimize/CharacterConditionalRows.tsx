import { Box, Flex, HoverCard, Select, Switch, Text } from '@mantine/core'
import { ColorText } from '@zenless-optimizer/common/ui'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import {
  TagFieldDisplay,
  TextFieldDisplay,
} from '@zenless-optimizer/game-opt/sheet-ui'
import {
  type AttributeKey,
  type CharacterKey,
  elementalData,
} from '@zenless-optimizer/zzz/consts'
import type { useDatabaseContext, useTeam } from '@zenless-optimizer/zzz/db-ui'
import { useCharacter } from '@zenless-optimizer/zzz/db-ui'
import { TagDisplay } from '@zenless-optimizer/zzz/formula-ui'
import {
  SkillGameDesc,
  usePotentialDescKey,
} from '@zenless-optimizer/zzz/formula-ui/char/sheetUtil'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { ElementIcon } from '@zenless-optimizer/zzz/svgicons'
import type { ReactNode } from 'react'
import { memo, useContext, useMemo } from 'react'
import {
  FLUX_TEXT_COLOR,
  getMindscapeRequirement,
  LUMIFLUX_TEXT_COLOR,
  passiveSectionToDescKey,
  renderDescription,
} from './characterConditionalsUtils'
import {
  ConditionalText,
  conditionalAlign,
  conditionalJustify,
  condLabel,
  NumConditionalRow,
} from './conditionalUtils'
import { Frame0HoverFields } from './frame0HoverCalc'

/**
 * Row components for a character conditional display: one row per
 * conditional (bool / num / list), one per passive field group, and the
 * Lumiflux attribute-flux row. Moved verbatim out of
 * `CharacterConditionalsDisplay` (the P4-7 `WengineConditionalRows` shape) —
 * every input arrives via props, so these stay store-agnostic.
 */
export const CharacterConditionalRow = memo(function CharacterConditionalRow({
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
            <Frame0HoverFields
              sheet={characterKey}
              condKey={condName}
              src={src}
              dst={null}
              currentValue={
                condData.type === 'num'
                  ? Math.min(displayValue, displayMax)
                  : displayValue
              }
              mainCharKey={mainCharKey}
              fields={fields}
              showZero={
                isMindscapeDisabled
                  ? true
                  : displayValue === 0
                    ? true
                    : showZeroFields
              }
            />
          </Box>
        )}
      </HoverCard.Dropdown>
    </HoverCard>
  )
})

export const PassiveFieldRow = memo(function PassiveFieldRow({
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
  const potential = 6
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
  }, [sectionKey, firstFieldRef?.name, paragraph, coreLevel, descKeyOverride])
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

export const FluxedElementRow = memo(function FluxedElementRow({
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
