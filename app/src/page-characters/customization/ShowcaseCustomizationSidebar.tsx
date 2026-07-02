import { ColorInput, Flex, SegmentedControl, Text } from '@mantine/core'
import {
  IconCircleHalf2,
  IconMoon,
  IconPalette,
  IconSun,
} from '@tabler/icons-react'
import { useCallback, useMemo, useState } from 'react'
import type { CharacterKey } from '../../consts'
import { DEFAULT_CONFIG } from '../color/colorPipelineConfig'
import { withAlpha } from '../color/colorUtils'
import {
  resolveShowcaseTheme,
  ShowcaseColorMode,
} from '../color/showcaseColorService'
import { cardTotalW, defaultGap, defaultPadding } from '../constantsUi'
import { CharacterBuildPanel } from './CharacterBuildPanel'
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
  characterKey: _characterKey,
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
      style={{ marginLeft: cardTotalW + 8 }}
    >
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
      <CharacterBuildPanel characterKey={_characterKey} />
    </Flex>
  )
}

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
          '--showcase-card-bg',
          withAlpha(theme.cardBackgroundColor, cardBgAlpha)
        )
        el.style.setProperty('--showcase-card-border', theme.cardBorderColor)
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
      <Text ta="center" fw={600} size="sm">
        Customize
      </Text>

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

const cardStyle = {
  backgroundColor: 'var(--layer-inset)',
  boxShadow: 'var(--shadow-card)',
  borderRadius: 'var(--radius-md)',
  padding: defaultPadding,
}
