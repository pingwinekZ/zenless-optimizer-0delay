import type { HTMLAttributes } from 'react'
import classes from './StatText.module.css'

type StatTextProps = HTMLAttributes<HTMLDivElement>

export function StatText(props: StatTextProps) {
  return (
    <div
      {...props}
      className={`${classes.statText} ${props.className ?? ''}`}
    />
  )
}

export function StatTextSm(props: StatTextProps) {
  return (
    <div
      {...props}
      className={`${classes.statTextSm} ${props.className ?? ''}`}
    />
  )
}
