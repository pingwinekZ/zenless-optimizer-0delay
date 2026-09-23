import { Button, Flex } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
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
import type { MutableRefObject } from 'react'
import { useState } from 'react'
import { CharacterPreviewPanel } from '../CharacterPreviewPanel'
import { CharacterSelectorDisplay } from '../CharacterSelectorDisplay'
import { ComboCard } from '../combo'
import {
  FilterContainer,
  FormCard,
  FormRow,
  HeaderText,
  TeammateFormRow,
} from '../layout'
import { OptimizerMenuIds } from '../layout/optimizerMenuIds'
import { OptTargetSelector } from '../OptTargetSelector'
import {
  SimulationInputs,
  SimulationManager,
  StatSimulationDisplay,
} from '../Simulation'
import { useShowPassivesStore } from '../stores/useShowPassivesStore'
import { CharacterConditionalsDisplay } from './CharacterConditionalsDisplay'
import { DiscMainSetFilters } from './DiscMainSetFilters'
import { MinMaxStatFilters } from './MinMaxStatFilters'
import { OptimizerDrawers } from './OptimizerDrawers'
import { OptimizerOptionsSection } from './OptimizerOptionsSection'
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
  usePotentialBest,
  setUsePotentialBest,
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
  usePotentialBest: boolean
  setUsePotentialBest: (v: boolean) => void
}) {
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
            usePotentialBest={usePotentialBest}
            setUsePotentialBest={setUsePotentialBest}
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
      <OptimizerDrawers
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        characterKey={characterKey}
        team={team}
      />

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
