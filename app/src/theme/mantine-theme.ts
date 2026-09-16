import {
  type CSSVariablesResolver,
  createTheme,
  type MantineThemeOverride,
} from '@mantine/core'
import chroma from 'chroma-js'
import {
  deriveCustomLayers,
  deriveDarkPalette,
  derivePrimaryPalette,
} from './themeColors'

const DEFAULT_SEED = '#1668DC'

// ZZZ-specific static color scales
function hexToShades(
  hex: string
): [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] {
  return [
    `${hex}1a`,
    `${hex}33`,
    `${hex}4d`,
    `${hex}66`,
    `${hex}80`,
    hex,
    `${hex}cc`,
    `${hex}e6`,
    `${hex}f0`,
    `${hex}ff`,
  ] as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ]
}

const comboboxMiddlewares = {
  flip: true,
  shift: true,
  size: {
    apply({
      availableHeight,
      elements,
    }: {
      availableHeight: number
      elements: { floating: HTMLElement }
    }) {
      const floating = elements.floating
      const scrollEl = floating.querySelector(
        '.mantine-ScrollArea-viewport, [role="listbox"]'
      ) as HTMLElement | null
      if (!scrollEl) return
      const top =
        scrollEl.getBoundingClientRect().top -
        floating.getBoundingClientRect().top
      const currentMax =
        parseFloat(getComputedStyle(scrollEl).maxHeight) || Infinity
      scrollEl.style.maxHeight = `${Math.min(
        currentMax,
        Math.max(120, availableHeight - top - 8)
      )}px`
    },
  },
}

export function createMantineTheme(seed: string): MantineThemeOverride {
  let safeSeed = seed
  try {
    chroma(seed)
  } catch {
    safeSeed = DEFAULT_SEED
  }
  const [h] = chroma(safeSeed).hsl()
  const layers = deriveCustomLayers(h)

  return createTheme({
    primaryColor: 'primary',
    primaryShade: { light: 6, dark: 5 },
    colors: {
      primary: derivePrimaryPalette(safeSeed),
      dark: deriveDarkPalette(h),

      // ZZZ-specific static colors. Mantine derives the whole
      // `--mantine-color-<name>-{text,filled,light,outline,...}` family from
      // these tuples; only `rankS/rankA/rankB` (disc + wengine rarity) and
      // `mindscapeActive/Inactive` are referenced by components, the element
      // colors are used through `ColorText`.
      fire: hexToShades('#FF5623'),
      ice: hexToShades('#95EAE9'),
      electric: hexToShades('#2EB6FF'),
      frost: hexToShades('#719EF8'),
      physical: hexToShades('#EDCC2C'),
      ether: hexToShades('#FE427E'),
      wind: hexToShades('#A6C5FD'),
      lumiflux: hexToShades('#FFA9DD'),

      rankS: hexToShades('#FF9100'),
      rankA: hexToShades('#E900FF'),
      rankB: hexToShades('#14a9fe'),

      mindscapeActive: hexToShades('#22D7C1'),
      mindscapeInactive: hexToShades('#5D5D5D'),
    },
    other: layers,
    fontFamily: 'inherit',
    defaultRadius: 'sm',
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '10px',
      lg: '12px',
      xl: '16px',
    },
    components: {
      Input: { defaultProps: { size: 'xs' } },
      InputBase: { defaultProps: { size: 'xs' } },
      InputWrapper: { defaultProps: { size: 'xs' } },
      Combobox: {
        defaultProps: {
          width: 'target',
          size: 'xs',
          middlewares: comboboxMiddlewares,
        },
      },
      Select: {
        defaultProps: {
          size: 'xs',
          checkIconPosition: 'right',
          comboboxProps: {
            keepMounted: false,
            width: 'target',
            middlewares: comboboxMiddlewares,
          },
        },
      },
      MultiSelect: {
        defaultProps: {
          size: 'xs',
          checkIconPosition: 'right',
          comboboxProps: {
            keepMounted: false,
            middlewares: comboboxMiddlewares,
          },
        },
      },
      TextInput: { defaultProps: { size: 'xs' } },
      NumberInput: { defaultProps: { size: 'xs', allowDecimal: true } },
      ColorInput: { defaultProps: { size: 'xs' } },
      Checkbox: { defaultProps: { size: 'xs' } },
      Switch: { defaultProps: { size: 'sm' } },
      Pill: {
        styles: {
          root: { backgroundColor: 'var(--control-bg)' },
        },
      },
      Radio: { defaultProps: { size: 'xs' } },
      SegmentedControl: {
        defaultProps: {
          size: 'xs',
          withItemsBorders: false,
          radius: 'sm',
        },
        styles: {
          root: { backgroundColor: 'rgba(0, 0, 0, 0.18)' },
          indicator: { borderRadius: 3 },
          label: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          innerLabel: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
      },
      Button: {
        defaultProps: { size: 'xs' },
        styles: {
          label: { fontSize: '14px', fontWeight: 'normal' },
        },
      },
      Pagination: { defaultProps: { size: 'xs' } },
      Slider: { defaultProps: { size: 'xs' } },
      Tabs: { defaultProps: { size: 'xs' } },
      Modal: {
        defaultProps: {
          lockScroll: false,
          padding: 16,
          withCloseButton: false,
        },
      },
      Drawer: {
        defaultProps: {
          lockScroll: false,
          padding: 16,
          transitionProps: { duration: 150 },
        },
      },
      Divider: {
        styles: {
          root: { borderColor: 'rgba(255, 255, 255, 0.10)' },
        },
      },
      Notification: {
        styles: { root: { padding: '12px 14px 12px 26px' } },
      },
      Accordion: { styles: { item: { borderBottom: 'none' } } },
      Table: {
        styles: { table: { backgroundColor: 'var(--layer-2)' } },
      },
      Paper: {
        styles: { root: { backgroundColor: 'var(--layer-2)' } },
      },
    },
  })
}

export const themeResolver: CSSVariablesResolver = (theme) => {
  const layerVars: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme.other)) {
    if (key.startsWith('layer')) {
      layerVars[`--${key.replace('layer', 'layer-')}`] = value as string
    }
  }
  return {
    variables: {
      ...layerVars,
      '--text-muted': 'rgba(255, 255, 255, 0.55)',
      '--control-bg': 'rgba(0, 0, 0, 0.15)',
      '--control-bg-light': '#ffffff40',
    },
    light: {},
    dark: {
      '--mantine-color-red-filled': '#a52d2d',
      '--mantine-color-red-filled-hover': '#952727',
      '--mantine-color-primary-light': chroma(theme.colors!.primary![5])
        .alpha(0.25)
        .css(),
      '--mantine-color-primary-light-hover': chroma(theme.colors!.primary![5])
        .alpha(0.32)
        .css(),
    },
  }
}
