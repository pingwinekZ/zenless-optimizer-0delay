import { Box, Center, Flex, Text } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'
import { TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { useCallback, useEffect, useMemo } from 'react'
import { characterAsset } from '../assets'
import type { CharacterKey, DiscSlotKey, PhaseKey } from '../consts'
import type { ICachedDisc } from '../db'
import { useCharacter, useDatabaseContext, useDiscs, useTeam } from '../db-ui'
import type { Tag } from '../formula'
import { own } from '../formula'
import { CharCalcProvider, useZzzCalcContext } from '../formula-ui'
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
  ShadowRings,
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
import {
  cardTotalW,
  defaultGap,
  middleColumnWidth,
  parentH,
  parentW,
} from './constantsUi'
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

export function CharacterPreview({
  characterKey,
  onEdit,
  onDelete,
}: {
  characterKey: CharacterKey | null
  onEdit?: () => void
  onDelete?: () => void
}) {
  if (!characterKey) return <PreviewPlaceholder />
  return (
    <PreviewCalcWrapper
      characterKey={characterKey}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

function PreviewPlaceholder() {
  return (
    <Box
      style={{
        backgroundColor: 'var(--layer-2)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        width: '100%',
        minHeight: 400,
      }}
    >
      <Center h={400}>
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
}: {
  characterKey: CharacterKey
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { database } = useDatabaseContext()
  const character = useCharacter(characterKey)
  const team = useTeam(characterKey)

  // Ensure the character and team records exist — use effects to avoid
  // synchronously mutating the store during render (which can cascade
  // through useSyncExternalStore subscribers into infinite re-renders).
  useEffect(() => {
    if (characterKey && !character) database.chars.getOrCreate(characterKey)
  }, [characterKey, character, database.chars])
  useEffect(() => {
    if (characterKey && !team) database.teams.getOrCreate(characterKey)
  }, [characterKey, team, database.teams])

  const tag = useMemo<Tag>(
    () => ({
      src: characterKey,
      dst: characterKey,
      preset: 'preset0',
    }),
    [characterKey]
  )

  if (!character || !team) return <PreviewPlaceholder />

  return (
    <TagContext.Provider value={tag}>
      <CharCalcProvider
        character={character}
        team={team}
        discIds={character.equippedDiscs}
      >
        <PreviewContent
          characterKey={characterKey}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </CharCalcProvider>
    </TagContext.Provider>
  )
}

function PreviewContent({
  characterKey,
  onEdit,
  onDelete,
}: {
  characterKey: CharacterKey
  onEdit?: () => void
  onDelete?: () => void
}) {
  const calc = useZzzCalcContext()
  const character = useCharacter(characterKey)
  const charStat = getCharStat(characterKey)
  const { attribute } = charStat

  const discIds = useMemo(
    () =>
      character?.equippedDiscs ??
      ({} as Record<DiscSlotKey, string | undefined>),
    [character]
  )
  const discs = useDiscs(discIds)

  const openEditorModal = useDiscEditorModalStore((s) => s.openOverlay)

  const handleDiscSlotClick = useCallback(
    (slot: DiscSlotKey) => {
      const disc = discs[slot]
      openEditorModal({
        selectedDisc: disc ?? null,
        slotKey: slot,
        characterKey,
        onOk: () => {},
      })
    },
    [discs, openEditorModal, characterKey]
  )

  const stats = useMemo<ComputedStats | null>(() => {
    if (!calc) return null
    return {
      hp: calc.compute(own.final.hp).val,
      atk: calc.compute(own.final.atk).val,
      def: calc.compute(own.final.def).val,
      impact: calc.compute(own.final.impact).val,
      crit_: calc.compute(own.common.cappedCrit_).val,
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

  if (!character || !stats) return null

  const cardBorderColor = theme.cardBorderColor
  const previewId = `char-preview-${characterKey}`

  return (
    <Flex direction="column" w={cardTotalW} style={{ position: 'relative' }}>
      <ShowcaseCustomizationSidebar
        id={previewId}
        characterKey={characterKey}
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
      <Box
        id={previewId}
        className="characterPreview"
        style={{
          '--showcase-card-bg': withAlpha(
            theme.cardBackgroundColor,
            cardBgAlpha
          ),
          '--showcase-card-border': cardBorderColor,
          '--showcase-shadow': 'rgba(0, 0, 0, 0.25) 0px 2px 16px',
          '--showcase-shadow-inset':
            ', inset rgba(255, 255, 255, 0.1) 0px 0px 2px',
          position: 'relative',
          display: 'flex',
          height: parentH,
          background: 'var(--layer-2)',
          overflow: 'hidden',
          borderRadius: 6,
          gap: defaultGap,
          color: 'rgba(240, 240, 240, 1)',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          fontFamily: 'var(--font-showcase, sans-serif)',
        }}
      >
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
            width: middleColumnWidth,
            flexShrink: 0,
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
              backgroundColor: 'var(--showcase-card-bg)',
              transition: showcaseTransition,
              flex: 1,
              paddingRight: 2,
              paddingLeft: 2,
              paddingBottom: 3,
              boxShadow: showcaseShadow + showcaseShadowInsetAddition,
              border: '1px solid var(--showcase-card-border)',
              position: 'relative',
            }}
          >
            <ShadowRings />

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
              <CharacterStatSummary stats={stats} attribute={attribute} zebra />
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
      <DiscEditorModal />
    </Flex>
  )
}
