import type { ButtonProps } from '@mantine/core'
import { Button } from '@mantine/core'

export function TextButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="subtle" {...props}>
      {children}
    </Button>
  )
}
