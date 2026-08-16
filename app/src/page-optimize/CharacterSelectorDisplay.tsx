import {
  Box,
  Button,
  Flex,
  HoverCard,
  SegmentedControl,
  Select,
  Text,
} from '@mantine/core'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { useCallback, useMemo } from 'react'
import { characterAsset, wengineAsset } from '../assets'
import type { CharacterKey, PhaseKey, WengineKey } from '../consts'
import { allPhaseKeys } from '../consts'
import { useCharacter, useDatabaseContext } from '../db-ui'
import { getCharStat } from '../stats'
import {
  CharacterName,
  CharacterSingleSelectionModal,
  WengineName,
  WengineSelectionModal,
} from '../ui'
import { HeaderText } from './layout/HeaderText'
import { CharacterBuildSelector } from './Optimize/CharacterBuildSelector'
import { PresetsButton } from './PresetsButton'

const defaultGap = 5

/** Fribbels-style tooltip icon (question mark) */
function TooltipIcon({ title, content }: { title: string; content: string }) {
  return (
    <HoverCard width={400} openDelay={200} closeDelay={100}>
      <HoverCard.Target>
        <Text
          component="span"
          size="xs"
          c="dimmed"
          style={{ cursor: 'pointer', opacity: 0.6 }}
        >
          ?
        </Text>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text fw={600} mb={4} size="sm">
          {title}
        </Text>
        <Text size="xs">{content}</Text>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

export function CharacterSelectorDisplay({
  characterKey,
  onCharacterChange,
  wengineKey,
  onWengineChange,
  sortByKey,
  resultLimit,
  onSortByChange,
  onResultLimitChange,
}: {
  characterKey: CharacterKey
  onCharacterChange: (ck: CharacterKey) => void
  wengineKey: WengineKey | ''
  onWengineChange: (wengineKey: WengineKey | '') => void
  sortByKey?: string
  resultLimit?: number
  onSortByChange: (key: string) => void
  onResultLimitChange: (limit: number) => void
}) {
  const { database } = useDatabaseContext()
  const character = useCharacter(characterKey)
  const [showCharModal, onShowCharModal, onHideCharModal] = useBoolState()
  const [showWengineModal, onShowWengineModal, onHideWengineModal] =
    useBoolState()

  const setCharacterKey = useCallback(
    (ck: CharacterKey | null) => {
      if (!ck) return
      database.dbMeta.set({ optCharKey: ck })
      onCharacterChange(ck)
    },
    [database.dbMeta, onCharacterChange]
  )

  const setMindscape = useCallback(
    (mindscape: number) => {
      if (character) database.chars.set(characterKey, { mindscape })
    },
    [database.chars, characterKey, character]
  )

  const setWengineKey = useCallback(
    (wKey: WengineKey | '') => {
      onWengineChange(wKey)
    },
    [onWengineChange]
  )

  const setPhase = useCallback(
    (phase: PhaseKey) => {
      database.chars.set(characterKey, { wenginePhase: phase })
    },
    [database.chars, characterKey]
  )

  const charStat = getCharStat(characterKey)
  const { mindscape = 0 } = character ?? {}

  // Mindscape options: M0-M6
  const mindscapeOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        value: String(i),
        label: `M${i}`,
      })),
    []
  )

  // Phase options: Phase 1-5
  const phaseOptions = useMemo(
    () =>
      allPhaseKeys.map((p) => ({
        value: String(p),
        label: `P${p}`,
      })),
    []
  )

  // Result limit options (like fribbels' "Find top results")
  const resultLimitOptions = useMemo(() => {
    const limits = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000]
    return limits.map((v) => ({
      value: String(v),
      label: `Top ${v}`,
    }))
  }, [])

  // Sort options matching OptimizerGrid columns
  const sortByOptions = [
    {
      group: 'DMG',
      items: [
        { value: 'target', label: 'Optimization Target' },
        { value: 'final_atk', label: 'ATK' },
        { value: 'final_hp', label: 'HP' },
        { value: 'final_def', label: 'DEF' },
        { value: 'final_impact', label: 'Impact' },
      ],
    },
    {
      group: 'Stats',
      items: [
        { value: 'final_critRate', label: 'Crit Rate' },
        { value: 'final_critDmg', label: 'Crit DMG' },
        { value: 'final_pen', label: 'PEN' },
        { value: 'final_sheerForce', label: 'Sheer Force' },
        { value: 'final_enerRegen', label: 'Energy Regen' },
        { value: 'final_anomProf', label: 'Anomaly Proficiency' },
        { value: 'final_anomMas', label: 'Anomaly Mastery' },
      ],
    },
  ]

  return (
    <Box>
      <CharacterSingleSelectionModal
        show={showCharModal}
        onHide={onHideCharModal}
        onSelect={setCharacterKey}
      />
      <WengineSelectionModal
        show={showWengineModal}
        onHide={onHideWengineModal}
        onSelect={(wKey) => {
          setWengineKey(wKey)
          onHideWengineModal()
        }}
        wengineTypeFilter={charStat.specialty}
        characterKey={characterKey}
      />
      <Flex direction="column" gap={defaultGap}>
        {/* Character section — HeaderText + tooltip like fribbels */}
        <Flex justify="space-between" align="center">
          <HeaderText>Character</HeaderText>
          <TooltipIcon
            title="Character Selection"
            content="Select the character and mindscape (M0-M6) to optimize for."
          />
        </Flex>
        <Flex direction="column" gap={defaultGap}>
          <Button
            fullWidth
            color={charStat.attribute}
            style={{ justifyContent: 'flex-start' }}
            onClick={onShowCharModal}
            leftSection={
              <ImgIcon size={2} src={characterAsset(characterKey, 'circle')} />
            }
          >
            <CharacterName characterKey={characterKey} />
          </Button>

          {/* Mindscape SegmentedControl (M0-M6) — matching fribbels' Eidolon selector */}
          <SegmentedControl
            fullWidth
            size="xs"
            value={String(mindscape)}
            data={mindscapeOptions}
            onChange={(val) => setMindscape(Number(val))}
          />
        </Flex>

        {/* W-Engine section — HeaderText + tooltip like fribbels */}
        <Flex justify="space-between" align="center">
          <HeaderText>W-Engine</HeaderText>
          <TooltipIcon
            title="W-Engine Selection"
            content="Select the W-Engine and refinement phase (P1-P5) to optimize with."
          />
        </Flex>
        <Flex direction="column" gap={defaultGap}>
          <Button
            fullWidth
            variant="default"
            style={{ justifyContent: 'flex-start' }}
            onClick={onShowWengineModal}
            leftSection={
              wengineKey ? (
                <ImgIcon size={2} src={wengineAsset(wengineKey)} />
              ) : undefined
            }
          >
            {wengineKey ? <WengineName wKey={wengineKey} /> : 'Select W-Engine'}
          </Button>

          {/* Phase SegmentedControl (P1-P5) — matching fribbels' Superimposition selector */}
          {wengineKey && (
            <SegmentedControl
              fullWidth
              size="xs"
              value={String(character?.wenginePhase ?? 1)}
              data={phaseOptions}
              onChange={(val) => setPhase(Number(val) as PhaseKey)}
            />
          )}
        </Flex>

        {/* Saved Builds section */}
        <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
          <HeaderText>Saved Builds</HeaderText>
        </Flex>
        <CharacterBuildSelector characterKey={characterKey} compact />

        {/* Presets section — no tooltip icon, matching fribbels */}
        <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
          <HeaderText>Presets</HeaderText>
        </Flex>

        <PresetsButton characterKey={characterKey} />

        {/* Optimization Target section — no tooltip icon, matching fribbels */}
        <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
          <HeaderText>Optimization Target</HeaderText>
        </Flex>

        <Select
          data={resultLimitOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          value={resultLimit != null ? String(resultLimit) : '5'}
          onChange={(val) => {
            if (val != null) onResultLimitChange(Number(val))
          }}
          placeholder="Find top results"
          size="xs"
          comboboxProps={{ width: 200, transitionProps: { duration: 150 } }}
        />

        <Select
          data={sortByOptions.map((group) => ({
            group: group.group,
            items: group.items.map((item) => ({
              value: item.value,
              label: item.label,
            })),
          }))}
          value={sortByKey ?? 'target'}
          onChange={(val) => {
            if (val != null) onSortByChange(val)
          }}
          placeholder="Sorted by"
          size="xs"
          comboboxProps={{ width: 250, transitionProps: { duration: 150 } }}
        />
      </Flex>
    </Box>
  )
}
