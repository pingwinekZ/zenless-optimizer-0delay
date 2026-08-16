import { useMediaQuery } from '@mantine/hooks'

/**
 * Centralized responsive breakpoints for the optimizer page.
 * Mirrors Mantine's default breakpoints: xs=576, sm=768, md=992, lg=1200, xl=1408.
 */
export function useResponsive() {
  const sm = useMediaQuery('(min-width: 576px)')
  const md = useMediaQuery('(min-width: 768px)')
  const lg = useMediaQuery('(min-width: 992px)')
  const xl = useMediaQuery('(min-width: 1200px)')

  /**
   * True when the viewport is narrow enough that the form + grid + sidebar
   * should be stacked vertically rather than laid out side-by-side.
   */
  const isMobileLayout = lg === false

  /**
   * True when the sidebar should render its compact bottom-bar variant.
   */
  const isCompactSidebar = lg === false

  /**
   * True on large+ screens where full horizontal layout fits comfortably.
   */
  const isFullLayout = lg !== false

  return {
    sm: sm !== false,
    md: md !== false,
    lg: lg !== false,
    xl: xl !== false,
    isMobileLayout,
    isCompactSidebar,
    isFullLayout,
  } as const
}
