import { Box, Divider, Menu } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { own } from '../formula'
import { useZzzCalcContext } from '../formula-ui'

// TODO: Implement full sort/limit integration with optimizer state
// Currently handles display-only; actual sorting/filtering needs store integration

export function SortByTargetDropdown({
  sortByKey,
  onChange,
}: {
  sortByKey?: string
  onChange: (key: string) => void
}) {
  const calc = useZzzCalcContext()

  const formulaOptions = calc
    ? calc.listFormulas(own.listing.formulas).filter(({ tag: t }) => {
        const { name, sheet } = t
        return !!name && !!sheet
      })
    : []

  const statOptions = [
    { key: 'final_atk', label: 'ATK' },
    { key: 'final_hp', label: 'HP' },
    { key: 'final_def', label: 'DEF' },
    { key: 'final_enerRegen', label: 'Energy Regen' },
    { key: 'final_anomProf', label: 'Anomaly Proficiency' },
    { key: 'final_anomMas', label: 'Anomaly Mastery' },
  ] as const

  return (
    <DropdownButton
      title={
        <Box style={{ textWrap: 'nowrap' }}>
          Sort: {sortByKey ?? 'Optimization Target'}
        </Box>
      }
      variant="light"
      size="sm"
    >
      <Menu.Label>DMG</Menu.Label>
      {formulaOptions.map(({ tag }, i) => {
        const { name, sheet } = tag
        return (
          <Menu.Item
            key={`sort_dmg_${i}`}
            onClick={() => onChange(`${sheet}_${name}`)}
          >
            {name ?? `Formula ${i}`}
          </Menu.Item>
        )
      })}
      <Divider />
      <Menu.Label>Stats</Menu.Label>
      {statOptions.map(({ key, label }) => (
        <Menu.Item key={`sort_stat_${key}`} onClick={() => onChange(key)}>
          {label}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}

export function ResultLimitDropdown({
  limit,
  onChange,
}: {
  limit: number
  onChange: (limit: number) => void
}) {
  const limits = [1, 5, 10, 50, 100, 1000]
  return (
    <DropdownButton title={`Top ${limit}`} variant="light" size="sm">
      {limits.map((n) => (
        <Menu.Item key={n} onClick={() => onChange(n)}>
          Top {n}
        </Menu.Item>
      ))}
    </DropdownButton>
  )
}
