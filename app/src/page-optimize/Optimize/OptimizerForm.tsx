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
import type {
  CharacterKey,
  DiscSlotKey,
  WengineKey,
} from '@zenless-optimizer/zzz/consts'
import type {
  ICachedCharacter,
  ICachedDisc,
  StatFilters,
  Team,
} from '@zenless-optimizer/zzz/db'
import { getTeamFrame0, isComboTarget } from '@zenless-optimizer/zzz/db'
import {
  OptConfigContext,
  useDatabaseContext,
} from '@zenless-optimizer/zzz/db-ui'
import type { MutableRefObject } from 'react'
import { useCallback, useContext, useState } from 'react'
import { AfterShockToggleButton } from '../AfterShockToggleButton'
import { AppliedBuffStats } from '../AppliedBuffStats'
import { CharacterPreviewPanel } from '../CharacterPreviewPanel'
import { CharacterSelectorDisplay } from '../CharacterSelectorDisplay'
import { ComboCard } from '../combo'
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
import { useShowPassivesStore } from '../stores/useShowPassivesStore'
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
  statFiltersRef,
  onCharacterChange,
  onWengineChange,
  useTheoreticalMax,
  setUseTheoreticalMax,
}: {
  characterKey: CharacterKey
  character: ICachedCharacter
  team: Team
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
  statFiltersRef: MutableRefObject<StatFilters>
  onCharacterChange: (ck: CharacterKey) => void
  onWengineChange: (wengineKey: WengineKey | '') => void
  useTheoreticalMax: boolean
  setUseTheoreticalMax: (v: boolean) => void
}) {
  const { database } = useDatabaseContext()
  const { tag: target } = getTeamFrame0(team)
  const isRotation = isComboTarget(target)
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
  const showCharPassives = useShowPassivesStore((s) => s.showCharPassives)
  const showWenginePassives = useShowPassivesStore((s) => s.showWenginePassives)
  const setShowCharPassives = useShowPassivesStore((s) => s.setShowCharPassives)
  const setShowWenginePassives = useShowPassivesStore(
    (s) => s.setShowWenginePassives
  )

  const wengineKey: WengineKey | '' = character.wengineKey || ''

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

        {/* Card 2: Character + W-Engine selectors, Presets */}
        <FormCard>
          <CharacterSelectorDisplay
            characterKey={characterKey}
            onCharacterChange={onCharacterChange}
            wengineKey={character.wengineKey || ''}
            onWengineChange={onWengineChange}
          />
        </FormCard>

        {/* Card 3: Character conditionals */}
        <FormCard>
          <CharacterConditionalsDisplay
            characterKey={characterKey}
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

        {/* Combo DMG rotation + advanced buff grid */}
        <FormCard size="medium">
          <ComboCard characterKey={characterKey} team={team} />
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
              Combo targets do not use individual damage configuration options.
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
        <>
          <Text size="xs" c="orange" style={{ lineHeight: 1.3 }}>
            Select exactly 1 four-piece and 1 two-piece set in Disc Set Filter.
            Real discs are ignored — perfect S-rank +15 discs are generated from
            the character's effective stats.
          </Text>
          {/* Recipe-space heuristics. The defaults reproduce the historical
              recipe set exactly; loosening them only adds recipes (a slower,
              wider search), it never drops builds from the results. */}
          <Flex align="center" gap={5}>
            <Text size="xs">Min effective substats</Text>
            <Select
              data={[
                { value: '3', label: '3 (default)' },
                { value: '2', label: '2 (more recipes)' },
                { value: '4', label: '4 (fewer recipes)' },
              ]}
              value={String(optConfig.theoreticalMinEffectivePerCombo ?? 3)}
              onChange={(val) => {
                if (val == null) return
                setOption('theoreticalMinEffectivePerCombo', Number(val))
              }}
              size="xs"
              disabled={disabled}
              style={{ width: 140 }}
            />
          </Flex>
          <Flex align="center" gap={5}>
            <Switch
              checked={optConfig.theoreticalApplyDominanceFilter ?? true}
              onChange={(e) =>
                setOption(
                  'theoreticalApplyDominanceFilter',
                  e.currentTarget.checked
                )
              }
              disabled={disabled}
              size="xs"
            />
            <Text size="xs">Skip dominated distributions</Text>
          </Flex>
        </>
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
