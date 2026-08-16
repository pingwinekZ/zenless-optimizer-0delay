import { useCallback, useEffect, useRef } from 'react'

/**
 * useArrowNav — attaches keyboard arrow navigation to a container element.
 *
 * Usage:
 * ```tsx
 * const containerRef = useArrowNav<HTMLDivElement>({
 *   itemSelector: '[role="option"]',
 *   onActivate: (index) => console.log('activated', index),
 * })
 * ```
 *
 * ArrowUp / ArrowDown move focus through children matching `itemSelector`.
 * Enter / Space call `onActivate` with the currently focused child index.
 * Home / End jump to first / last item.
 */
export function useArrowNav<T extends HTMLElement>({
  itemSelector,
  onActivate,
  enabled = true,
}: {
  itemSelector: string
  onActivate?: (index: number) => void
  enabled?: boolean
}) {
  const containerRef = useRef<T>(null)
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate

  const getItems = useCallback(
    () =>
      containerRef.current
        ? Array.from(containerRef.current.querySelectorAll(itemSelector))
        : [],
    [itemSelector]
  )

  const focusItem = useCallback(
    (index: number) => {
      const items = getItems()
      const target = items[index] as HTMLElement | undefined
      target?.focus()
    },
    [getItems]
  )

  const getFocusedIndex = useCallback(() => {
    const items = getItems()
    const active = document.activeElement
    return items.indexOf(active as HTMLElement)
  }, [getItems])

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    function handleKeyDown(e: KeyboardEvent) {
      const items = getItems()
      if (items.length === 0) return

      const currentIndex = getFocusedIndex()

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = Math.min(currentIndex + 1, items.length - 1)
          focusItem(next)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = Math.max(currentIndex - 1, 0)
          focusItem(prev)
          break
        }
        case 'Home': {
          e.preventDefault()
          focusItem(0)
          break
        }
        case 'End': {
          e.preventDefault()
          focusItem(items.length - 1)
          break
        }
        case 'Enter':
        case ' ': {
          if (currentIndex >= 0) {
            e.preventDefault()
            onActivateRef.current?.(currentIndex)
          }
          break
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [enabled, getItems, getFocusedIndex, focusItem])

  return containerRef
}
