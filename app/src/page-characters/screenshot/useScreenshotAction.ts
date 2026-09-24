import { useCallback, useState } from 'react'
import { screenshotElementById } from './screenshotUtils'

/**
 * Drives {@link screenshotElementById} for the element with the given id,
 * exposing a `loading` flag so the trigger buttons can show a spinner.
 * Ported 1:1 from hsr-optimizer (`src/lib/hooks/useScreenshotAction.ts`).
 */
export function useScreenshotAction(elementId: string) {
  const [loading, setLoading] = useState(false)

  const trigger = useCallback(
    (action: 'clipboard' | 'download', name?: string | null) => {
      setLoading(true)
      // Delay lets the browser paint the loading spinner before capture blocks the thread
      setTimeout(() => {
        void screenshotElementById(elementId, action, name).finally(() =>
          setLoading(false)
        )
      }, 50)
    },
    [elementId]
  )

  return { loading, trigger }
}
