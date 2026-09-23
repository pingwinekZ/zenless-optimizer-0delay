import type { HTMLAttributes, ReactNode } from 'react'

interface TagPillProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> {
  /** `#hex` / `rgb()` color, or a Mantine color name resolved to a solid shade. */
  color?: string
  /** Selected: the pill fills with its color, mirroring hsr-optimizer's `active`. */
  active?: boolean
  /** Doesn't match the active filter, mirroring hsr-optimizer's `dimmed`. */
  dimmed?: boolean
  children: ReactNode
}

/** Muted pill color, matching hsr-optimizer's `TEXT_DIM`. */
export const PILL_DIM_COLOR = '#ffffff40'

/** Label color when the pill is filled (`active`), from hsr-optimizer. */
const PILL_ACTIVE_TEXT = '#141414'

/**
 * Mantine palettes such as ZZZ's element colors are alpha ramps whose solid hex
 * sits at shade 5, so the `outline` variant resolves to a low-alpha shade and
 * renders washed out. Named colors go through shade 5 to stay vivid.
 */
function resolvePillColor(color: string): string {
  return color.startsWith('#') || color.startsWith('rgb')
    ? color
    : `var(--mantine-color-${color}-5)`
}

/**
 * Compact tag pill, ported from hsr-optimizer's `renderPill`
 * (`lib/characterPreview/buffsAnalysis/buffUtils`): a 9px uppercase label in a
 * thin, color-outlined pill. Sized so long names ("DEFENSIVE ASSIST") still
 * read cleanly.
 *
 * Passing `onClick` turns the pill into a filter toggle; `active` marks the
 * current selection and `dimmed` marks the pills it excludes.
 */
export const TagPill = ({
  color = 'primary',
  active,
  dimmed,
  children,
  style,
  onClick,
  ...props
}: TagPillProps) => {
  const base = resolvePillColor(color)
  const shown = dimmed ? PILL_DIM_COLOR : base
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 4px',
        borderRadius: 2,
        fontSize: 9,
        fontWeight: 600,
        lineHeight: '16px',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        color: active ? PILL_ACTIVE_TEXT : shown,
        backgroundColor: active ? base : undefined,
        border: `1px solid ${shown}`,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
