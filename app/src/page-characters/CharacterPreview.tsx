import { Box, Center, Flex, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { characterAsset } from '../assets'
import type { CharacterKey, DiscSlotKey, PhaseKey } from '../consts'
import type { DiscIds, ICachedCharacter, ICachedDisc, Team } from '../db'
import { useCharacter, useDatabaseContext, useDiscs, useTeam } from '../db-ui'
import type { Tag } from '../formula'
import { own } from '../formula'
import { CharCalcProvider, useZzzCalcContext } from '../formula-ui'
import type { SavedTeammateGear } from '../schema/savedBuild'
import { getCharStat } from '../stats'
import {
  DiscEditorModal,
  useCharacterTabStore,
  useDiscEditorModalStore,
} from '../ui'
import {
  calculateCharacterScore,
  getCharacterEffectiveMainStats,
  getCharacterEffectiveStats,
  getCharacterSubstatWeights,
  gradeColor,
} from '../util'
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
    () => getCharacterEffectiveStats(characterKey),
    [characterKey]
  )

  const substatWeights = useMemo(
    () => getCharacterSubstatWeights(characterKey),
    [characterKey]
  )

  const effectiveMainStats = useMemo(
    () => getCharacterEffectiveMainStats(characterKey),
    [characterKey]
  )

  const score = useMemo(
    () =>
      calculateCharacterScore(
        [
          discs['1'],
          discs['2'],
          discs['3'],
          discs['4'],
          discs['5'],
          discs['6'],
        ],
        characterKey
      ),
    [discs, characterKey]
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

            {/* Score - Hoyolab style rating badge */}
            {score && (
              <Flex direction="column" align="center" gap={2} mb={2}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: '34px',
                    color: gradeColor(score.grade),
                  }}
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
