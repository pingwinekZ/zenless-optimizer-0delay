import {
  Button,
  CardSection,
  Drawer,
  Flex,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { IconBolt, IconSettings, IconTarget } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import type { Field } from '@zenless-optimizer/game-opt/sheet-ui'
import type { MutableRefObject, ReactNode } from 'react'
import { useCallback, useContext, useMemo, useState } from 'react'
import type { CharacterKey, DiscSlotKey, WengineKey } from '../../consts'
import type { ICachedCharacter, ICachedDisc, StatFilters, Team } from '../../db'
import { getTeamFrame0 } from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { buffs } from '../../formula'
import { charSheets } from '../../formula-ui'
import { AfterShockToggleButton } from '../AfterShockToggleButton'
import { AppliedBuffStats } from '../AppliedBuffStats'
import { CharacterPreviewPanel } from '../CharacterPreviewPanel'
import { CharacterSelectorDisplay } from '../CharacterSelectorDisplay'
import { DeadlyAssaultBuffs } from '../DeadlyAssaultBuffs'
import { EnemyStatsSection } from '../EnemyStats'
import {
  FilterContainer,
  FormCard,
  FormRow,
  HeaderText,
  TeammateFormRow,
} from '../layout'
import { OptimizerMenuIds } from '../layout/optimizerMenuIds'
import { CritModeSelector } from '../OptTargetRow/CritModeSelector'
import { SpecificDmgTypeSelector } from '../OptTargetRow/SpecificDmgTypeSelector'
import { OptTargetSelector } from '../OptTargetSelector'
import { ShiyuDefenseBuffs } from '../ShiyuDefenseBuffs'
import {
  SimulationInputs,
  SimulationManager,
  StatSimulationDisplay,
} from '../Simulation'
import { CharacterConditionalsDisplay } from './CharacterConditionalsDisplay'
import { DiscMainSetFilters } from './DiscMainSetFilters'
import { MinMaxStatFilters } from './MinMaxStatFilters'
import { TeammatesSection } from './TeammatesSection'
import { WEngineConditionalsDisplay } from './WEngineConditionalsDisplay'

export function OptimizerForm({
  characterKey,
  character,
  team,
  discsBySlot,
  disabled,
  sortByKey,
  resultLimit,
  statFiltersRef,
  onCharacterChange,
  onWengineChange,
  onSortByChange,
  onResultLimitChange,
  useTheoreticalMax,
  setUseTheoreticalMax,
}: {
  characterKey: CharacterKey
  character: ICachedCharacter
  team: Team
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
  sortByKey?: string
  resultLimit?: number
  statFiltersRef: MutableRefObject<StatFilters>
  onCharacterChange: (ck: CharacterKey) => void
  onWengineChange: (wengineKey: WengineKey | '') => void
  onSortByChange: (key: string) => void
  onResultLimitChange: (limit: number) => void
  useTheoreticalMax: boolean
  setUseTheoreticalMax: (v: boolean) => void
}) {
  const { database } = useDatabaseContext()
  const { tag: target } = getTeamFrame0(team)
  const isRotation = !!target?.rotation
  const isAftershock = target?.damageType2 === 'aftershock'
  const setAftershock = useCallback(
    (aftershock: boolean) =>
      database.teams.setFrame0(characterKey, (frame) => {
        const { tag: oldTarget = {} } = frame
        const { damageType2, ...oTarget } = oldTarget
        if (!aftershock) return { tag: oTarget }
        return {
          tag: {
            ...oTarget,
            damageType2: 'aftershock',
          },
        }
      }),
    [database, characterKey]
  )

  const [activeDrawer, setActiveDrawer] = useState<string | null>(null)
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const showCharPassives = optConfig.showCharPassives
  const showWenginePassives = optConfig.showWenginePassives
  const setShowCharPassives = useCallback(
    (v: boolean) =>
      database.optConfigs.set(optConfigId, { showCharPassives: v }),
    [database, optConfigId]
  )
  const setShowWenginePassives = useCallback(
    (v: boolean) =>
      database.optConfigs.set(optConfigId, { showWenginePassives: v }),
    [database, optConfigId]
  )

  const wengineKey: WengineKey | '' = character.wengineKey || ''

  // Build conditional → fields map from formula-ui sheet
  const conditionalFields = useMemo(() => {
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const result: Record<string, Field[]> = {}
    Object.values(sheet).forEach((section) => {
      section.documents.forEach((doc) => {
        if (
          doc.type === 'conditional' &&
          doc.conditional?.fields &&
          doc.conditional.fields.length > 0
        ) {
          const condName = doc.conditional.metadata.name
          if (!result[condName]) result[condName] = []
          // Deduplicate fields by stat key (q) + damage type so per-damage-type
          // buffs (e.g. common_dmg_ with different damageType1) each show as
          // separate fields instead of being collapsed into one.
          const seenKeys = new Set(
            result[condName]
              .map((f) =>
                'fieldRef' in f
                  ? `${f.fieldRef?.q ?? ''}|${f.fieldRef?.damageType1 ?? ''}|${f.fieldRef?.damageType2 ?? ''}`
                  : undefined
              )
              .filter(Boolean)
          )
          for (const field of doc.conditional.fields) {
            if ('fieldRef' in field) {
              const key = `${field.fieldRef?.q ?? ''}|${field.fieldRef?.damageType1 ?? ''}|${field.fieldRef?.damageType2 ?? ''}`
              if (!key || !seenKeys.has(key)) {
                seenKeys.add(key)
                result[condName].push(field)
              }
            } else {
              // Non-tag fields (e.g. text values) are always included
              result[condName].push(field)
            }
          }
        }
      })
    })
    return Object.keys(result).length > 0 ? result : undefined
  }, [characterKey])

  // Build conditional → description map from formula-ui sheet.
  // Multiple sheet entries may share the same condName — concatenate their
  // descriptions rather than overwriting, so users see all relevant info.
  const conditionalDescriptions = useMemo(() => {
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
            // Append with a line break separator (always strings)
            result[condName] = `${result[condName]}\n\n${desc}`
          } else {
            result[condName] = desc
          }
        }
      })
    })
    return Object.keys(result).length > 0 ? result : undefined
  }, [characterKey])

  // Build conditional → label map from formula-ui sheet.
  const conditionalLabels = useMemo(() => {
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
  }, [characterKey])

  // Extract passive (always-active) buff fields from 'fields' documents
  const passiveFields = useMemo(() => {
    const sheet = charSheets[characterKey]
    if (!sheet) return undefined
    const charBuffs = buffs[characterKey] as
      | Record<string, { team?: boolean }>
      | undefined
    if (!charBuffs) return undefined
    const result: {
      fields: Field[]
      /** 0 = always available, 1-6 = requires that mindscape level */
      mindscape: number
      sectionKey: string
      /** Paragraph index within the section's description (0-based, counting only 'fields' docs) */
      paragraph?: number
      /** Optional group title shown instead of first field's title */
      groupTitle?: ReactNode
    }[] = []
    Object.entries(sheet).forEach(([sectionKey, section]) => {
      const mindscape = sectionKey.startsWith('m')
        ? Number(sectionKey.slice(1)) || 0
        : 0
      let fieldsDocIndex = 0
      let abilityFieldsDocIndex = 0
      section.documents.forEach((doc) => {
        if (doc.type === 'fields' && doc.fields?.length) {
          const groupedFields: Field[] = []
          for (const field of doc.fields) {
            if ('fieldRef' in field && field.fieldRef?.name) {
              // Only include fields that match a known buff (excludes skill formula fields)
              if (charBuffs[field.fieldRef.name]) {
                groupedFields.push(field)
              }
            } else if (!('fieldRef' in field) && 'fieldValue' in field) {
              // Include custom combined TextField items (e.g. ER scaling showing both DMG and Anomaly Mastery)
              groupedFields.push(field)
            }
          }
          if (groupedFields.length > 0) {
            const isAbility =
              groupedFields[0] &&
              'fieldRef' in groupedFields[0] &&
              groupedFields[0].fieldRef?.name?.startsWith('ability_')
            // Ability desc paragraphs start at 1 (desc.0 is the condition text),
            // so use a separate counter offset by +1.
            // Mindscape sections use a single `mindscapes.X.desc` key (no paragraph sub-keys),
            // so don't set a paragraph index for them.
            const paragraph = sectionKey.startsWith('m')
              ? undefined
              : isAbility
                ? abilityFieldsDocIndex + 1
                : fieldsDocIndex
            result.push({
              fields: groupedFields,
              mindscape,
              sectionKey,
              paragraph,
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
  }, [characterKey])

  return (
    <FilterContainer>
      {/* ── Character options (5-card layout matching fribbels) ── */}
      <FormRow id={OptimizerMenuIds.characterOptions}>
        {/* Card 1: Character art + W-Engine preview — 248px wide, self-styled */}
        <CharacterPreviewPanel
          characterKey={characterKey}
          onCharacterChange={onCharacterChange}
          onWengineChange={onWengineChange}
        />

        {/* Card 2: Character + W-Engine selectors, Presets, Optimization Target */}
        <FormCard>
          <CharacterSelectorDisplay
            characterKey={characterKey}
            onCharacterChange={onCharacterChange}
            wengineKey={character.wengineKey || ''}
            onWengineChange={onWengineChange}
            sortByKey={sortByKey}
            resultLimit={resultLimit}
            onSortByChange={onSortByChange}
            onResultLimitChange={onResultLimitChange}
          />
        </FormCard>

        {/* Card 3: Character conditionals */}
        <FormCard>
          <CharacterConditionalsDisplay
            characterKey={characterKey}
            conditionalFields={conditionalFields}
            conditionalDescriptions={conditionalDescriptions}
            conditionalLabels={conditionalLabels}
            passiveFields={passiveFields}
            showPassives={showCharPassives}
          />
        </FormCard>

        {/* Card 4: W-Engine conditionals + Advanced Options */}
        <FormCard justify="space-between">
          <WEngineConditionalsDisplay
            wengineKey={wengineKey}
            showPassives={showWenginePassives}
          />
          <Flex direction="column" gap={5}>
            <HeaderText style={{ marginTop: 25 }}>Advanced options</HeaderText>
            <Button
              variant="default"
              leftSection={<IconSettings size={16} />}
              onClick={() => setActiveDrawer('enemy')}
            >
              Enemy Configurations
            </Button>
            <Button
              variant="default"
              leftSection={<IconSettings size={16} />}
              onClick={() => setActiveDrawer('buffs')}
            >
              Extra Combat Buffs
            </Button>
          </Flex>
        </FormCard>

        {/* Card 5: Optimizer Options (switches matching fribbels' OptimizerOptionsDisplay) */}
        <FormCard>
          <OptimizerOptionsSection
            disabled={disabled}
            showCharPassives={showCharPassives}
            setShowCharPassives={setShowCharPassives}
            showWenginePassives={showWenginePassives}
            setShowWenginePassives={setShowWenginePassives}
            useTheoreticalMax={useTheoreticalMax}
            setUseTheoreticalMax={setUseTheoreticalMax}
          />
        </FormCard>
      </FormRow>

      {/* ── Relic & stat filters (consolidated) ── */}
      <FormRow id={OptimizerMenuIds.relicAndStatFilters}>
        {/* Optimization Target */}
        <FormCard size="small">
          <OptTargetSelector character={character} team={team} />
        </FormCard>

        {/* Disc main set filters + set conditionals */}
        <FormCard size="small">
          <DiscMainSetFilters discsBySlot={discsBySlot} disabled={disabled} />
        </FormCard>

        {/* Stat min/max filters - INITIAL */}
        <FormCard size="small">
          <MinMaxStatFilters
            qt="initial"
            disabled={disabled}
            statFiltersRef={statFiltersRef}
          />
        </FormCard>

        {/* Stat min/max filters - FINAL */}
        <FormCard size="small">
          <MinMaxStatFilters
            qt="final"
            disabled={disabled}
            statFiltersRef={statFiltersRef}
          />
        </FormCard>
      </FormRow>

      {/* ── Teammates ── */}
      <TeammateFormRow id={OptimizerMenuIds.teammates}>
        <TeammatesSection
          showCharPassives={showCharPassives}
          showWenginePassives={showWenginePassives}
        />
      </TeammateFormRow>

      {/* ── Advanced Options Drawers ── */}
      <Drawer
        opened={activeDrawer === 'damage'}
        onClose={() => setActiveDrawer(null)}
        title="Damage Configuration"
        position="right"
        size={400}
      >
        <Flex direction="column" gap="xs">
          {isRotation ? (
            <Text size="sm" c="dimmed">
              Rotation DMG targets do not use individual damage configuration
              options.
            </Text>
          ) : (
            <>
              <CritModeSelector />
              <SpecificDmgTypeSelector />
              {target?.name === 'standardDmgInst' ||
              target?.name === 'sheerDmgInst' ? (
                <AfterShockToggleButton
                  isAftershock={isAftershock}
                  setAftershock={setAftershock}
                />
              ) : null}
            </>
          )}
        </Flex>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'enemy'}
        onClose={() => setActiveDrawer(null)}
        title={
          <Flex align="center" gap="xs">
            <IconTarget size={20} />
            <Text>Enemy Configurations</Text>
          </Flex>
        }
        position="right"
        size={500}
        padding="md"
      >
        <ScrollArea style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
          <Stack gap="md">
            <CardThemed bgt="light">
              <CardSection
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Flex align="center" gap="xs" mb={4}>
                  <IconTarget size={18} opacity={0.7} />
                  <Text size="sm" fw={700}>
                    Enemy Stats & Resistances
                  </Text>
                </Flex>
                <Text size="xs" c="dimmed">
                  Configure enemy level, DEF, stun multiplier, elemental
                  resistances, and weaknesses for accurate damage calculations.
                </Text>
              </CardSection>
            </CardThemed>
            <EnemyStatsSection />
          </Stack>
        </ScrollArea>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'buffs'}
        onClose={() => setActiveDrawer(null)}
        title={
          <Flex align="center" gap="xs">
            <IconBolt size={20} />
            <Text>Extra Combat Buffs</Text>
          </Flex>
        }
        position="right"
        size={650}
        padding="md"
      >
        <ScrollArea style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
          <Stack gap="md">
            <CardThemed bgt="light">
              <CardSection
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Flex align="center" gap="xs" mb={4}>
                  <IconBolt size={18} opacity={0.7} />
                  <Text size="sm" fw={700}>
                    Combat Buffs Configuration
                  </Text>
                </Flex>
                <Text size="xs" c="dimmed">
                  Configure bonus stats that apply during combat, such as Deadly
                  Assault buffs and Shiyu Defense buffs.
                </Text>
              </CardSection>
            </CardThemed>

            <DeadlyAssaultBuffs />
            <ShiyuDefenseBuffs />
            <AppliedBuffStats />
          </Stack>
        </ScrollArea>
      </Drawer>

      {/* ── Character custom stats simulation ── */}
      <FormRow id={OptimizerMenuIds.characterStatsSimulation}>
        <FormCard size="medium">
          <StatSimulationDisplay />
        </FormCard>
        <FormCard size="medium">
          <SimulationInputs />
        </FormCard>
        <FormCard size="small">
          <SimulationManager />
        </FormCard>
      </FormRow>
    </FilterContainer>
  )
}

function OptimizerOptionsSection({
  disabled,
  showCharPassives,
  setShowCharPassives,
  showWenginePassives,
  setShowWenginePassives,
  useTheoreticalMax,
  setUseTheoreticalMax,
}: {
  disabled?: boolean
  showCharPassives: boolean
  setShowCharPassives: (v: boolean) => void
  showWenginePassives: boolean
  setShowWenginePassives: (v: boolean) => void
  useTheoreticalMax: boolean
  setUseTheoreticalMax: (v: boolean) => void
}) {
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const { database } = useDatabaseContext()

  const setOption = useCallback(
    <K extends keyof typeof optConfig>(
      field: K,
      value: (typeof optConfig)[K]
    ) => {
      database.optConfigs.set(optConfigId, { [field]: value })
    },
    [database, optConfigId]
  )

  const minEnhanceOptions = [
    { value: '0', label: '+0' },
    { value: '3', label: '+3' },
    { value: '6', label: '+6' },
    { value: '9', label: '+9' },
    { value: '12', label: '+12' },
    { value: '15', label: '+15' },
  ]

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Optimizer options</HeaderText>

      <Flex align="center" gap={5}>
        <Switch
          checked={!!optConfig.useEquipped}
          onChange={(e) => setOption('useEquipped', e.currentTarget.checked)}
          disabled={disabled}
          size="xs"
        />
        <Text size="xs">Use Equipped Discs</Text>
      </Flex>

      {optConfig.useEquipped && (
        <Flex align="center" gap={5}>
          <Switch
            checked={!!optConfig.useCharacterPriority}
            onChange={(e) =>
              setOption('useCharacterPriority', e.currentTarget.checked)
            }
            disabled={disabled}
            size="xs"
          />
          <Text size="xs">Use Character Priority</Text>
        </Flex>
      )}

      <Flex align="center" gap={5}>
        <Switch
          checked={useTheoreticalMax}
          onChange={(e) => setUseTheoreticalMax(e.currentTarget.checked)}
          disabled={disabled}
          size="xs"
        />
        <Text size="xs">Theoretical Max Discs</Text>
      </Flex>

      {useTheoreticalMax && (
        <Text size="xs" c="orange" style={{ lineHeight: 1.3 }}>
          Select exactly 1 four-piece and 1 two-piece set in Disc Set Filter.
          Real discs are ignored — perfect S-rank +15 discs are generated from
          the character's effective stats.
        </Text>
      )}

      <Flex align="center" gap={5}>
        <Text size="xs">Min enhance</Text>
        <Select
          data={minEnhanceOptions}
          value={String(optConfig.levelLow)}
          onChange={(val) => {
            if (val == null) return
            const v = Number(val)
            setOption('levelLow', v)
            if (optConfig.levelHigh < v) setOption('levelHigh', v)
          }}
          size="xs"
          disabled={disabled}
          style={{ width: 70 }}
        />
      </Flex>

      <Flex align="center" gap={5}>
        <Switch
          checked={showCharPassives}
          onChange={(e) => setShowCharPassives(e.currentTarget.checked)}
          size="xs"
        />
        <Text size="xs">Show character passives</Text>
      </Flex>

      <Flex align="center" gap={5}>
        <Switch
          checked={showWenginePassives}
          onChange={(e) => setShowWenginePassives(e.currentTarget.checked)}
          size="xs"
        />
        <Text size="xs">Show w-engine passives</Text>
      </Flex>
    </Flex>
  )
}
