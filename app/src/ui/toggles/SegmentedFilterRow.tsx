import { Flex, UnstyledButton } from '@mantine/core'
import type { ReactNode } from 'react'

export function SegmentedFilterRow<T extends string>({
  tags,
  currentFilter,
  setCurrentFilters,
  flexBasis,
  singleSelect,
}: {
  tags: { key: T; display: ReactNode; flexBasis?: string }[]
  currentFilter: T[]
  setCurrentFilters: (filters: T[]) => void
  flexBasis?: string
  singleSelect?: boolean
}) {
  const handleChange = (tag: T, checked: boolean) => {
    if (singleSelect) {
      setCurrentFilters(checked ? [tag] : [])
    } else {
      setCurrentFilters(
        checked
          ? [...currentFilter, tag]
          : currentFilter.filter((t) => t !== tag)
      )
    }
  }

  return (
    <Flex
      style={{
        flexWrap: 'nowrap',
        flexGrow: 1,
        backgroundColor: 'var(--layer-2)',
        boxShadow: '0px 0px 0px 1px var(--border-default) inset',
        borderRadius: 6,
        overflow: 'hidden',
        height: 40,
      }}
    >
      {tags.map((tag) => (
        <UnstyledButton
          key={tag.key}
          onClick={() =>
            handleChange(tag.key, !currentFilter.includes(tag.key))
          }
          style={{
            flex: 1,
            flexBasis: tag.flexBasis ?? flexBasis,
            boxShadow: '1px 1px 1px 0px var(--border-default)',
            backgroundColor: currentFilter.includes(tag.key)
              ? 'var(--primary-default)'
              : 'transparent',
          }}
        >
          <Flex
            align="center"
            justify="space-around"
            style={{ height: '100%' }}
          >
            {tag.display}
          </Flex>
        </UnstyledButton>
      ))}
    </Flex>
  )
}
