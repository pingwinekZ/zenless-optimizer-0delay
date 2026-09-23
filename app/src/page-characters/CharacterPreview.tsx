import { Box, Center, Flex, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { useDataManagerBase } from '@zenless-optimizer/common/database-ui'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { characterAsset } from '@zenless-optimizer/zzz/assets'
import type {
  CharacterKey,
  DiscSlotKey,
  PhaseKey,
} from '@zenless-optimizer/zzz/consts'
import type {
  DiscIds,
  ICachedCharacter,
  ICachedDisc,
  Team,
} from '@zenless-optimizer/zzz/db'
import {
  getComboFrames,
  getTeamFrame0,
  isComboTarget,
  targetTag,
} from '@zenless-optimizer/zzz/db'
import {
  useCharacter,
  useDatabaseContext,
  useDiscs,
  useTeam,
} from '@zenless-optimizer/zzz/db-ui'
import type { Tag } from '@zenless-optimizer/zzz/formula'
import { own, Read } from '@zenless-optimizer/zzz/formula'
import {
  CharCalcProvider,
  useZzzCalcContext,
} from '@zenless-optimizer/zzz/formula-ui'
import type { SavedTeammateGear } from '@zenless-optimizer/zzz/schema/savedBuild'
import { getCharStat } from '@zenless-optimizer/zzz/stats'
import {
  DiscEditorModal,
  useCharacterTabStore,
  useDiscEditorModalStore,
} from '@zenless-optimizer/zzz/ui'
import {
  calculateSubstatEfficiency,
  efficiencyToGrade,
  gradeColor,
} from '@zenless-optimizer/zzz/util'
import { memo, useCallback, useEffect, useMemo } from 'react'
import {
  getMergedEffectiveStats,
  getMergedMainStats,
  getMergedSubstatWeights,
} from '../page-discs/scoring/statWeightUtils'
import {
  ShowcaseBackgroundBlur,
  showcaseShadow,
  showcaseShadowInsetAddition,
  showcaseTransition,
} from './CharacterPreviewComponents'
import { CharacterStatSummary } from './card/CharacterStatSummary'
import { ShowcaseCharacterHeader } from './card/ShowcaseCharacterHeader'
import { ShowcaseDiscPanel } from './card/ShowcaseDiscPanel'
import { ShowcasePortrait } from './card/ShowcasePortrait'
import { ShowcaseWengine } from './card/ShowcaseWengine'
import { extractPaletteInWorker } from './color/colorExtractionService'
import { pickBestSeed, withAlpha } from './color/colorUtils'
import {
  resolveShowcaseColor,
  resolveShowcaseTheme,
  ShowcaseColorMode,
} from './color/showcaseColorService'
import { useShowcaseColorStore } from './color/showcaseColorStore'
import { defaultGap, middleColumnWidth, parentH, parentW } from './constantsUi'
import type { ShowcasePreset } from './customization/ShowcaseCustomizationSidebar'
import { ShowcaseCustomizationSidebar } from './customization/ShowcaseCustomizationSidebar'

type ComputedStats = {
  hp: number
  atk: number
  def: number
  impact: number
  crit_: number
  crit_dmg_: number
  pen: number
  pen_: number
  anomProf: number
  anomMas: number
  enerRegen: number
  dmg_: number
}

// Memoized so page-level re-renders that don't touch the focused character
// (e.g. drag-reorder commits to displayCharacter) skip the whole preview
// subtree — HSR parity, where the preview subscribes narrowly and reorder
// doesn't touch it.
export const CharacterPreview = memo(function CharacterPreview({
  characterKey,
  onEdit,
  onDelete,
  buildOverride,
}: {
  characterKey: CharacterKey | null
  onEdit?: () => void
  onDelete?: () => void
  /**
   * HSR parity (`savedBuildOverride`): render a saved build instead of the
   * live database state. Stats, score, discs and W-Engine all follow the
   * override, and every edit interaction is disabled.
   */
  buildOverride?: BuildPreviewOverride | null
}) {
  if (!characterKey) return <PreviewPlaceholder />
  return (
    <PreviewCalcWrapper
      characterKey={characterKey}
      onEdit={onEdit}
      onDelete={onDelete}
      buildOverride={buildOverride}
    />
  )
})

export type BuildPreviewOverride = {
  character: ICachedCharacter
  team: Team
  discIds: DiscIds
  teammateGear?: Record<string, SavedTeammateGear>
}

function PreviewPlaceholder() {
  return (
    <Box
      style={{
        height: parentH,
        width: '100%',
        borderRadius: 6,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Center h={parentH}>
        <Flex direction="column" align="center" gap={8} c="dark.2">
          <IconUser size={48} opacity={0.3} />
          <Text size="sm">Select a character</Text>
        </Flex>
      </Center>
    </Box>
  )
}

function PreviewCalcWrapper({
  characterKey,
  onEdit,
  onDelete,
  buildOverride,
}: {
  characterKey: CharacterKey
  onEdit?: () => void
  onDelete?: () => void
  buildOverride?: BuildPreviewOverride | null
}) {
  const { database } = useDatabaseContext()
  const dbCharacter = useCharacter(characterKey)
  const dbTeam = useTeam(characterKey)
  const character = buildOverride?.character ?? dbCharacter
  const team = buildOverride?.team ?? dbTeam

  // Ensure the character and team records exist — use effects to avoid
  // synchronously mutating the store during render (which can cascade
  // through useSyncExternalStore subscribers into infinite re-renders).
  // Skipped for build overrides, which never touch the database.
  useEffect(() => {
    if (!buildOverride && characterKey && !dbCharacter)
      database.chars.getOrCreate(characterKey)
  }, [buildOverride, characterKey, dbCharacter, database.chars])
  useEffect(() => {
    if (!buildOverride && characterKey && !dbTeam)
      database.teams.getOrCreate(characterKey)
  }, [buildOverride, characterKey, dbTeam, database.teams])

  const tag = useMemo<Tag>(
    () => ({
      src: characterKey,
      dst: characterKey,
      preset: 'preset0',
    }),
    [characterKey]
  )

  if (!character || !team) return <PreviewPlaceholder />

  const discIds = buildOverride?.discIds ?? character.equippedDiscs
  // Previewing a saved build is read-only: no edit/delete actions, no
  // customization sidebar, no disc editor (HSR BUILDS_MODAL parity).
  const preview = !!buildOverride

  return (
    <TagContext.Provider value={tag}>
      <CharCalcProvider
        character={character}
        team={team}
        discIds={discIds}
        teammateGear={buildOverride?.teammateGear}
      >
        <PreviewContent
          characterKey={characterKey}
          character={character}
          discIds={discIds}
          onEdit={preview ? undefined : onEdit}
          onDelete={preview ? undefined : onDelete}
          preview={preview}
        />
      </CharCalcProvider>
    </TagContext.Provider>
  )
}

function PreviewContent({
  characterKey,
  character,
  discIds,
  onEdit,
  onDelete,
  preview,
}: {
  characterKey: CharacterKey
  character: ICachedCharacter
  discIds: DiscIds
  onEdit?: () => void
  onDelete?: () => void
  preview: boolean
}) {
  const calc = useZzzCalcContext()
  const charStat = getCharStat(characterKey)
  const { attribute } = charStat
  const { database } = useDatabaseContext()

  const discs = useDiscs(discIds)

  const openEditorModal = useDiscEditorModalStore((s) => s.openOverlay)

  const handleDiscSlotClick = useCallback(
    (slot: DiscSlotKey) => {
      if (preview) return
      const disc = discs[slot]
      openEditorModal({
        selectedDisc: disc ?? null,
        slotKey: slot,
        characterKey,
        onOk: () => {},
      })
    },
    [preview, discs, openEditorModal, characterKey]
  )

  const stats = useMemo<ComputedStats | null>(() => {
    if (!calc) return null
    return {
      hp: calc.compute(own.final.hp).val,
      atk: calc.compute(own.final.atk).val,
      def: calc.compute(own.final.def).val,
      impact: calc.compute(own.final.impact).val,
      crit_: calc.compute(own.final.crit_).val,
      crit_dmg_: calc.compute(own.final.crit_dmg_).val,
      pen: calc.compute(own.final.pen).val,
      pen_: calc.compute(own.final.pen_).val,
      anomProf: calc.compute(own.final.anomProf).val,
      anomMas: calc.compute(own.final.anomMas).val,
      enerRegen: calc.compute(own.final.enerRegen).val,
      dmg_: calc.compute(own.final.dmg_.with('attribute', attribute)).val,
    }
  }, [calc, attribute])

  const effectiveStats = useMemo(
    () => getMergedEffectiveStats(characterKey, database),
    [characterKey, database]
  )

  const substatWeights = useMemo(
    () => getMergedSubstatWeights(characterKey, database),
    [characterKey, database]
  )

  const effectiveMainStats = useMemo(
    () => getMergedMainStats(characterKey, database),
    [characterKey, database]
  )

  // Pinned perfect reference (absent = no reference score shown).
  const pinnedReference =
    useDataManagerBase(database.theoReferences, characterKey) ?? undefined
  const team = useTeam(characterKey)

  // Build-value comparison: equipped build's target damage vs the pinned
  // perfect value. Uses the live preview calculator, so mains, sets, and
  // diminishing returns are all captured — unlike the old weighted-roll
  // proxy. Gaps and tips still live in the optimizer Analysis tab.
  const referenceScore = useMemo(() => {
    if (!pinnedReference || !(pinnedReference.value > 0)) return undefined
    if (!calc || !team) return undefined
    const { tag } = getTeamFrame0(team)
    if (!tag) return undefined
    try {
      let equippedValue: number
      if (isComboTarget(tag)) {
        const frames = getComboFrames(team).filter(
          (frame) => frame.tag?.sheet && frame.tag?.name
        )
        if (frames.length === 0) return undefined
        equippedValue = frames.reduce((sum, frame, i) => {
          const actionTag = targetTag(frame.tag!)
          const read = new Read(
            { src: characterKey, ...actionTag },
            undefined
          ).with('preset', `preset${i}` as any)
          return sum + calc.compute(read).val * frame.multiplier
        }, 0)
      } else {
        const actionTag = targetTag(tag)
        const read = new Read(
          { src: characterKey, ...actionTag },
          undefined
        ).with('preset', 'preset0' as any)
        equippedValue = calc.compute(read).val
      }
      if (!(equippedValue > 0)) return undefined
      return Math.max(0, Math.min(1, equippedValue / pinnedReference.value))
    } catch {
      return undefined
    }
  }, [pinnedReference, calc, team, characterKey])

  const score = useMemo(
    () =>
      calculateSubstatEfficiency(
        [
          discs['1'],
          discs['2'],
          discs['3'],
          discs['4'],
          discs['5'],
          discs['6'],
        ],
        effectiveStats,
        effectiveMainStats,
        substatWeights
      ),
    [discs, effectiveStats, effectiveMainStats, substatWeights]
  )

  const portraitUrl = characterAsset(characterKey, 'full')

  // Color pipeline: extracted portrait color → seed → theme
  const { portraitColorByCharKey, portraitPaletteByCharKey } =
    useShowcaseColorStore()
  const portraitExtractedColor = portraitColorByCharKey[characterKey]
  const portraitSwatches = portraitPaletteByCharKey[characterKey] ?? []

  const showcasePreferences = useCharacterTabStore(
    (s) => s.showcasePreferences[characterKey]
  )
  const showcasePreset = useCharacterTabStore((s) => s.showcasePreset)
  const showcaseDarkMode = useCharacterTabStore((s) => s.showcaseDarkMode)
  const setShowcasePreference = useCharacterTabStore(
    (s) => s.setShowcasePreference
  )
  const setShowcaseDarkMode = useCharacterTabStore((s) => s.setShowcaseDarkMode)
  const setShowcasePreset = useCharacterTabStore((s) => s.setShowcasePreset)

  const cardBgAlpha = showcasePreset === 'shine' ? 0.35 : 0.15

  const { seedColor, effectiveColorMode } = useMemo(
    () =>
      resolveShowcaseColor(
        characterKey,
        ShowcaseColorMode.AUTO,
        showcasePreferences as any,
        portraitExtractedColor
      ),
    [characterKey, showcasePreferences, portraitExtractedColor]
  )

  const theme = useMemo(
    () => resolveShowcaseTheme(seedColor, showcaseDarkMode),
    [seedColor, showcaseDarkMode]
  )

  useEffect(() => {
    let aborted = false
    void (async () => {
      const palette = await extractPaletteInWorker(portraitUrl)
      if (aborted || !palette) return
      const color = pickBestSeed(palette)
      useShowcaseColorStore
        .getState()
        .setPortraitPalette(characterKey, color, palette.palette)
    })()
    return () => {
      aborted = true
    }
  }, [characterKey, portraitUrl])

  const handleColorChange = useCallback(
    (color: string) => {
      setShowcasePreference(characterKey, {
        color,
        colorMode: ShowcaseColorMode.CUSTOM,
      })
    },
    [characterKey, setShowcasePreference]
  )

  const handleColorModeChange = useCallback(
    (mode: ShowcaseColorMode) => {
      setShowcasePreference(characterKey, { colorMode: mode })
    },
    [characterKey, setShowcasePreference]
  )

  const handleDarkModeChange = useCallback(
    (dark: boolean) => {
      setShowcaseDarkMode(dark)
    },
    [setShowcaseDarkMode]
  )

  const handlePresetChange = useCallback(
    (preset: ShowcasePreset) => {
      setShowcasePreset(preset)
    },
    [setShowcasePreset]
  )

  if (!stats) return null

  const cardBorderColor = theme.cardBorderColor
  // Previewing a build inside a modal can mount alongside the character tab
  // preview — use a distinct id (HSR uses 'buildPreview' for the same reason).
  const previewId = preview
    ? `build-preview-${characterKey}`
    : `char-preview-${characterKey}`

  return (
    <Flex direction="column" w="100%" style={{ position: 'relative' }}>
      {!preview && (
        <ShowcaseCustomizationSidebar
          id={previewId}
          seedColor={seedColor}
          effectiveColorMode={effectiveColorMode}
          portraitSwatches={portraitSwatches}
          cardBgAlpha={cardBgAlpha}
          showcaseDarkMode={showcaseDarkMode}
          showcasePreset={showcasePreset}
          onColorModeChange={handleColorModeChange}
          onColorChange={handleColorChange}
          onDarkModeChange={handleDarkModeChange}
          onPresetChange={handlePresetChange}
        />
      )}
      <Box
        id={previewId}
        className="characterPreview"
        style={{
          '--showcase-card-bg-bridge-high': withAlpha(
            theme.cardBackgroundColor,
            cardBgAlpha
          ),
          '--showcase-card-edge-medium': cardBorderColor,
          '--showcase-shadow': 'rgba(0, 0, 0, 0.25) 0px 2px 16px',
          '--showcase-shadow-inset':
            ', inset rgba(255, 255, 255, 0.1) 0px 0px 2px',
          position: 'relative',
          display: 'flex',
          height: parentH,
          width: '100%',
          background: 'var(--layer-inset)',
          overflow: 'hidden',
          borderRadius: 6,
          gap: defaultGap,
          color: 'rgba(240, 240, 240, 1)',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          fontFamily: 'var(--font-showcase)',
        }}
      >
        <ShowcaseBackgroundBlur
          seedColor={seedColor}
          cardBgColor={theme.cardBackgroundColor}
          cardBgAlpha={cardBgAlpha}
        />
        {/* === LEFT COLUMN: Portrait === */}
        <ShowcasePortrait
          portraitUrl={portraitUrl}
          parentW={parentW}
          parentH={parentH}
        />

        {/* === MIDDLE COLUMN: Header + Stats + Skills + Wengine === */}
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
            flex: 1,
            minWidth: middleColumnWidth,
          }}
        >
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              borderRadius: 6,
              zIndex: 10,
              backgroundColor: 'var(--showcase-card-bg-bridge-high)',
              transition: showcaseTransition,
              flex: 1,
              paddingRight: 2,
              paddingLeft: 2,
              paddingBottom: 3,
              boxShadow: showcaseShadow + showcaseShadowInsetAddition,
              border: '1px solid var(--showcase-card-edge-medium)',
              backgroundClip: 'padding-box',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Character header: element, rarity, specialty, name, level, actions */}
            <ShowcaseCharacterHeader
              characterKey={characterKey}
              attribute={attribute}
              rarity={charStat.rarity}
              specialty={charStat.specialty}
              character={character}
              onEdit={onEdit}
              onDelete={onDelete}
            />

            {/* Stats with zebra rows */}
            <Box
              style={{
                flex: 1,
                overflow: 'hidden',
                paddingLeft: 4,
                paddingRight: 6,
                color: '#fff',
              }}
            >
              <CharacterStatSummary
                stats={stats}
                attribute={attribute}
                specialty={charStat.specialty}
                zebra
              />
            </Box>

            {/* Score - Hoyolab style rating badge, split side by side:
                disc (weighted-roll) score | perfect-reference damage ratio */}
            {score && (
              <Flex direction="column" align="center" gap={4} mb={2}>
                <Flex
                  direction="row"
                  align="stretch"
                  justify="center"
                  gap={0}
                  w="100%"
                >
                  <Flex
                    direction="column"
                    align="center"
                    gap={2}
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      Disc score
                    </Text>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        lineHeight: '34px',
                        color: gradeColor(score.grade),
                      }}
                      title="Weighted substat efficiency + main-stat alignment"
                    >
                      {score.grade}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {(score.efficiency * 100).toFixed(0)}%
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {score.effectiveRolls}/{score.totalRolls} rolls
                    </Text>
                  </Flex>
                  {referenceScore !== undefined && (
                    <>
                      <Box
                        style={{
                          width: 1,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          margin: '4px 0',
                        }}
                      />
                      <Flex
                        direction="column"
                        align="center"
                        gap={2}
                        style={{ flex: 1 }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                          }}
                        >
                          vs Perfect
                        </Text>
                        <Text
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            lineHeight: '34px',
                            color: gradeColor(
                              efficiencyToGrade(referenceScore)
                            ),
                          }}
                          title="Equipped build value vs the pinned perfect value"
                        >
                          {efficiencyToGrade(referenceScore)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {(referenceScore * 100).toFixed(0)}%
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          damage ratio
                        </Text>
                      </Flex>
                    </>
                  )}
                </Flex>
              </Flex>
            )}

            {/* W-Engine card */}
            {character && (
              <ShowcaseWengine
                wengineKey={character?.wengineKey ?? ''}
                phase={(character?.wenginePhase ?? 1) as PhaseKey}
                onClick={onEdit}
              />
            )}
          </Box>
        </Box>

        {/* === RIGHT COLUMN: Disc Panel === */}
        <ShowcaseDiscPanel
          discs={discs as Record<DiscSlotKey, ICachedDisc | undefined>}
          onSlotClick={handleDiscSlotClick}
          effectiveStats={effectiveStats}
          substatWeights={substatWeights}
          effectiveMainStats={effectiveMainStats}
        />
      </Box>

      {/* Disc editor modal */}
      {!preview && <DiscEditorModal />}
    </Flex>
  )
}
