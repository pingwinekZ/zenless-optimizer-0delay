import { Button } from '@mantine/core'
import { damageTypeKeysMap } from '../formula-ui'

export function AfterShockToggleButton({
  isAftershock,
  setAftershock,
}: {
  isAftershock: boolean
  setAftershock: (aftershock: boolean) => void
}) {
  return (
    <Button
      onClick={() => setAftershock(!isAftershock)}
      color={isAftershock ? 'green' : 'gray'}
    >
      {damageTypeKeysMap.aftershock}
    </Button>
  )
}
