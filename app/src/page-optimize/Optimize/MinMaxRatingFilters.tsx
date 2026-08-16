import { Flex } from '@mantine/core'
import { FilterRow, HeaderText } from '../layout'

export function MinMaxRatingFilters({
  disabled = false,
}: {
  disabled?: boolean
}) {
  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Rating min / max filters</HeaderText>

      <Flex direction="column" gap={7}>
        <FilterRow
          label="EHP"
          min={undefined}
          max={undefined}
          setMin={() => {}}
          setMax={() => {}}
          disabled={disabled}
        />
        <FilterRow
          label="DPS Score"
          min={undefined}
          max={undefined}
          setMin={() => {}}
          setMax={() => {}}
          disabled={disabled}
        />
        <FilterRow
          label="Anomaly Dmg"
          min={undefined}
          max={undefined}
          setMin={() => {}}
          setMax={() => {}}
          disabled={disabled}
        />
      </Flex>
    </Flex>
  )
}
