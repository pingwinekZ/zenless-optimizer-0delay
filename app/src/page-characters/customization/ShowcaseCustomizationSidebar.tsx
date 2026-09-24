import { Button, ColorInput, Flex, SegmentedControl } from '@mantine/core'
import {
  IconCamera,
  IconCircleHalf2,
  IconDownload,
  IconMoon,
  IconPalette,
  IconSun,
} from '@tabler/icons-react'
import { HorizontalDivider } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_CONFIG } from '../color/colorPipelineConfig'
import { withAlpha } from '../color/colorUtils'
import {
  resolveShowcaseTheme,
  ShowcaseColorMode,
} from '../color/showcaseColorService'
import { defaultGap, defaultPadding } from '../constantsUi'
import { useScreenshotAction } from '../screenshot/useScreenshotAction'
import classes from './ShowcaseCustomizationSidebar.module.css'

export type ShowcasePreset = 'shine' | 'natural'

interface ShowcaseCustomizationSidebarProps {
  id: string
  characterKey: CharacterKey
  seedColor: string
  effectiveColorMode: ShowcaseColorMode
  portraitSwatches: string[]
  cardBgAlpha: number
  showcaseDarkMode: boolean
  showcasePreset: ShowcasePreset
  onColorModeChange: (mode: ShowcaseColorMode) => void
  onColorChange: (color: string) => void
  onDarkModeChange: (dark: boolean) => void
  onPresetChange: (preset: ShowcasePreset) => void
}

export function ShowcaseCustomizationSidebar({
  id,
  characterKey,
  seedColor,
  effectiveColorMode,
  portraitSwatches,
  cardBgAlpha,
  showcaseDarkMode,
  showcasePreset,
  onColorModeChange,
  onColorChange,
  onDarkModeChange,
  onPresetChange,
}: ShowcaseCustomizationSidebarProps) {
  return (
    <Flex
      direction="column"
      gap={defaultGap + 2}
      className={classes.sidebarContainer}
      style={{ left: '100%', marginLeft: 8 }}
    >
      <ScreenshotPanel id={id} characterKey={characterKey} />
      <CustomizationPanel
        id={id}
        seedColor={seedColor}
        effectiveColorMode={effectiveColorMode}
        portraitSwatches={portraitSwatches}
        cardBgAlpha={cardBgAlpha}
        showcaseDarkMode={showcaseDarkMode}
        showcasePreset={showcasePreset}
        onColorModeChange={onColorModeChange}
        onColorChange={onColorChange}
        onDarkModeChange={onDarkModeChange}
        onPresetChange={onPresetChange}
      />
    </Flex>
  )
}

// =============================================================================

const ScreenshotPanel = memo(function ScreenshotPanel({
  id,
  characterKey,
}: {
  id: string
  characterKey: CharacterKey
}) {
  const { loading, trigger: screenshot } = useScreenshotAction(id)
  const { t } = useTranslation(['page_characters', 'charNames_gen'])
  const characterName = t(`charNames_gen:${characterKey}`)

  return (
    <Flex direction="column" gap={6} style={cardStyle}>
      <Flex gap={6}>
        <Button
          loading={loading}
          onClick={() => screenshot('clipboard', characterName)}
          className={classes.actionButton}
          variant="default"
          style={{ height: 'auto' }}
          title={t('page_characters:screenshot.copy')}
          aria-label={t('page_characters:screenshot.copy')}
        >
          <IconCamera size={18} />
        </Button>
        <Button
          loading={loading}
          onClick={() => screenshot('download', characterName)}
          className={classes.actionButton}
          variant="default"
          style={{ height: 'auto' }}
          title={t('page_characters:screenshot.download')}
          aria-label={t('page_characters:screenshot.download')}
        >
          <IconDownload size={18} />
        </Button>
      </Flex>
    </Flex>
  )
})

// =============================================================================

const CustomizationPanel = ({
  id,
  seedColor,
  effectiveColorMode,
  portraitSwatches,
  cardBgAlpha,
  showcaseDarkMode,
  showcasePreset,
  onColorModeChange,
  onColorChange,
  onDarkModeChange,
  onPresetChange,
}: {
  id: string
  seedColor: string
  effectiveColorMode: ShowcaseColorMode
  portraitSwatches: string[]
  cardBgAlpha: number
  showcaseDarkMode: boolean
  showcasePreset: ShowcasePreset
  onColorModeChange: (mode: ShowcaseColorMode) => void
  onColorChange: (color: string) => void
  onDarkModeChange: (dark: boolean) => void
  onPresetChange: (preset: ShowcasePreset) => void
}) => {
  const [localColor, setLocalColor] = useState(seedColor)
  const [prevSeedColor, setPrevSeedColor] = useState(seedColor)
  if (seedColor !== prevSeedColor) {
    setPrevSeedColor(seedColor)
    setLocalColor(seedColor)
  }

  const onColorDrag = useCallback(
    (newColor: string) => {
      setLocalColor(newColor)
      const theme = resolveShowcaseTheme(
        newColor,
        showcaseDarkMode,
        DEFAULT_CONFIG
      )
      const el = document.getElementById(id)
      if (el) {
        el.style.setProperty(
          '--showcase-card-bg-bridge-high',
          withAlpha(theme.cardBackgroundColor, cardBgAlpha)
        )
        el.style.setProperty(
          '--showcase-card-edge-medium',
          theme.cardBorderColor
        )
        el.style.setProperty('--showcase-seed-color', newColor)
      }
    },
    [id, showcaseDarkMode, cardBgAlpha]
  )

  const presetButtonLabel = useMemo(
    () => ({
      shine: <IconPalette size={18} />,
      natural: <IconCircleHalf2 size={18} />,
    }),
    []
  )

  return (
    <Flex direction="column" gap={6} style={cardStyle}>
      <div className={classes.headerCentered} style={headerTextStyle}>
        Customize
      </div>

      <HorizontalDivider />

      {/* Color picker */}
      <ColorInput
        swatches={portraitSwatches}
        value={localColor}
        onChange={onColorDrag}
        onChangeEnd={onColorChange}
        format="hex"
        styles={{
          input: { textTransform: 'uppercase', fontFamily: 'monospace' },
          colorPreview: { '--cs-radius': '4px' } as React.CSSProperties,
        }}
      />

      <HorizontalDivider />

      {/* Preset toggle: Shine / Natural */}
      <SegmentedControl
        data={[
          { value: 'shine', label: presetButtonLabel.shine },
          { value: 'natural', label: presetButtonLabel.natural },
        ]}
        fullWidth
        value={showcasePreset}
        onChange={(value) => onPresetChange(value as ShowcasePreset)}
      />

      {/* Dark/Light mode */}
      <SegmentedControl
        data={[
          { value: 'false', label: <IconSun size={18} /> },
          { value: 'true', label: <IconMoon size={18} /> },
        ]}
        fullWidth
        value={String(showcaseDarkMode)}
        onChange={(value) => onDarkModeChange(value === 'true')}
      />

      <HorizontalDivider />

      {/* Color mode: Auto / Custom / Standard */}
      <SegmentedControl
        orientation="vertical"
        fullWidth
        data={[
          { value: ShowcaseColorMode.AUTO, label: 'Auto' },
          { value: ShowcaseColorMode.CUSTOM, label: 'Custom' },
          { value: ShowcaseColorMode.STANDARD, label: 'Standard' },
        ]}
        value={effectiveColorMode}
        onChange={(value) => onColorModeChange(value as ShowcaseColorMode)}
      />
    </Flex>
  )
}

const headerTextStyle = {
  textDecoration: 'underline',
  textDecorationColor: 'var(--color-accent)',
  textUnderlineOffset: 2,
  whiteSpace: 'nowrap',
} as const

const cardStyle = {
  backgroundColor: 'var(--layer-1)',
  boxShadow: 'var(--shadow-card)',
  borderRadius: 'var(--radius-md)',
  padding: defaultPadding,
}
