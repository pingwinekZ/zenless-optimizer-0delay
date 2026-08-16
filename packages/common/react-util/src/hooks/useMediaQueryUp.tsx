import { useMediaQuery } from '@mantine/hooks'

export function useMediaQueryUp() {
  const sm = useMediaQuery('(min-width: 600px)')
  const md = useMediaQuery('(min-width: 900px)')
  const lg = useMediaQuery('(min-width: 1200px)')
  const xl = useMediaQuery('(min-width: 1536px)')
  if (xl) return 'xl'
  if (lg) return 'lg'
  if (md) return 'md'
  if (sm) return 'sm'
  return 'xs'
}
