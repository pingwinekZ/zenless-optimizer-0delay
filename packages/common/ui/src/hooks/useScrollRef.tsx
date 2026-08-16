import { useCallback, useRef } from 'react'

export function useScrollRef() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const onScroll = useCallback(
    () => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }),
    [scrollRef]
  )
  return [scrollRef, onScroll] as const
}
