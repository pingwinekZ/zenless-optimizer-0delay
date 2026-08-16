import { Box, Text } from '@mantine/core'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import type { WengineSubStatKey } from '../../consts'
import { StatIcon } from '../../svgicons'
import { StatDisplay } from '../Character'

export function WengineSubstatDisplay({
  substatKey,
  substatValue,
  showStatName,
}: {
  substatKey: WengineSubStatKey
  substatValue: number
  showStatName?: boolean
}) {
  if (!substatKey) return null
  const displayValue = toPercent(substatValue, substatKey).toFixed(
    statKeyToFixed(substatKey)
  )
  return (
    <Text
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: '500',
        fontSize: '1rem',
        gap: 4,
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {showStatName ? (
          <StatDisplay statKey={substatKey} />
        ) : (
          <StatIcon statKey={substatKey} />
        )}
      </Box>
      <Box component={'span'}>
        {displayValue}
        {getUnitStr(substatKey)}
      </Box>
    </Text>
  )
}
