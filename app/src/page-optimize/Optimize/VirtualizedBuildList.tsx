import { Box, Text } from '@mantine/core'
import { useInfScroll } from '@zenless-optimizer/common/ui'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeneratedBuild } from '../../db'

const SCROLL_LOAD_INCREMENT = 20

/**
 * VirtualizedBuildList — progressively renders children as the user scrolls.
 *
 * Wraps a flat list of build elements so that only the first `numShow` items
 * are mounted at any time.  As the user scrolls near the bottom, more items
 * are revealed in batches of `SCROLL_LOAD_INCREMENT`.
 *
 * Use this instead of AG Grid pagination when you want a seamless infinite-
 * scroll experience (e.g. inside the GeneratedBuildsDisplay sidebar panel
 * or any card-based build list).
 */
export const VirtualizedBuildList = memo(function VirtualizedBuildList({
  builds,
  children,
}: {
  builds: GeneratedBuild[]
  children: (build: GeneratedBuild, index: number) => React.ReactNode
}) {
  const { t } = useTranslation('page_optimize')
  const { numShow, setTriggerElement } = useInfScroll(
    SCROLL_LOAD_INCREMENT,
    builds.length
  )

  const visibleBuilds = useMemo(
    () => builds.slice(0, numShow),
    [builds, numShow]
  )

  if (builds.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        {t(
          'builds.noResults',
          'No builds to display. Run the optimizer to generate results.'
        )}
      </Text>
    )
  }

  return (
    <Box>
      {visibleBuilds.map((build, i) => (
        <Box
          key={`${i}-${build.wengineKey}-${Object.values(build.discIds).join('-')}`}
        >
          {children(build, i)}
        </Box>
      ))}

      {/* Sentinel element — triggers loading more builds when visible */}
      {numShow < builds.length && (
        <Box
          ref={(el: HTMLDivElement | null) =>
            setTriggerElement(el ?? undefined)
          }
          style={{ height: 1, width: '100%' }}
          aria-hidden="true"
        />
      )}

      {numShow < builds.length && (
        <Text size="xs" c="dimmed" ta="center" py="xs">
          {t('builds.showingOf', {
            count: numShow,
            total: builds.length,
            defaultValue: `Showing ${numShow} of ${builds.length.toLocaleString()} builds — scroll for more`,
          })}
        </Text>
      )}
    </Box>
  )
})
