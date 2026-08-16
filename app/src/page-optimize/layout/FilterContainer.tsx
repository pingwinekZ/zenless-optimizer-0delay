import { Flex } from '@mantine/core'
import type { ReactElement } from 'react'
import classes from './FilterContainer.module.css'

export function FilterContainer({
  children,
  style,
}: {
  children: ReactElement | ReactElement[]
  style?: React.CSSProperties
}) {
  return (
    <Flex direction="column" className={classes.container} style={style}>
      {children}
    </Flex>
  )
}
