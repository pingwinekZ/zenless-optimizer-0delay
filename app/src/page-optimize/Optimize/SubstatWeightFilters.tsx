import { Button, Flex, Group, Slider, Text } from '@mantine/core'
import { Fragment, useState } from 'react'
import type { DiscSubStatKey } from '../../consts'
import { allDiscSubStatKeys } from '../../consts'
import { StatDisplay } from '../../ui'
import { HeaderText } from '../layout'

type WeightPreset = Record<DiscSubStatKey, number>

const DEFAULT_WEIGHTS: WeightPreset = Object.fromEntries(
  allDiscSubStatKeys.map((k) => [k, 1])
) as WeightPreset

const WEIGHT_PRESETS: Record<string, WeightPreset> = {
  Balanced: Object.fromEntries(
    allDiscSubStatKeys.map((k) => [k, 1])
  ) as WeightPreset,
  'DPS Focus': {
    hp: 0,
    atk: 1,
    def: 0,
    hp_: 0.3,
    atk_: 1,
    def_: 0,
    pen: 0.7,
    crit_: 1,
    crit_dmg_: 1,
    anomProf: 0.5,
  },
  Tank: {
    hp: 0.5,
    atk: 0,
    def: 0.5,
    hp_: 1,
    atk_: 0,
    def_: 1,
    pen: 0,
    crit_: 0,
    crit_dmg_: 0,
    anomProf: 0,
  },
  Anomaly: {
    hp: 0,
    atk: 0.8,
    def: 0,
    hp_: 0.3,
    atk_: 0.8,
    def_: 0,
    pen: 0.5,
    crit_: 0.2,
    crit_dmg_: 0.2,
    anomProf: 1,
  },
}

const labelStyle = {
  textWrap: 'nowrap' as const,
  height: 24,
  display: 'flex',
  alignItems: 'center',
}
const sliderRowStyle = {
  width: '100%',
  height: 24,
  display: 'flex',
  alignItems: 'center',
}
const sliderStyle = {
  width: '100%',
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 'auto',
  marginRight: 'auto',
}
const sliderStyles = { label: { padding: '2px 6px' } }

const MAX_ROLLS = 5

export function SubstatWeightFilters() {
  const [weights, setWeights] = useState<WeightPreset>({ ...DEFAULT_WEIGHTS })
  const [minRolls, setMinRolls] = useState(0)

  const setWeight = (key: DiscSubStatKey, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: WeightPreset) => {
    setWeights({ ...preset })
  }

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Substat weight filter</HeaderText>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'max-content 1fr',
          columnGap: 20,
          rowGap: 7,
        }}
      >
        {allDiscSubStatKeys.map((key) => (
          <Fragment key={key}>
            <span style={labelStyle}>
              <StatDisplay statKey={key} showPercent />
            </span>
            <div style={sliderRowStyle}>
              <Slider
                min={0}
                max={1}
                step={0.05}
                style={sliderStyle}
                label={(val) => val.toFixed(2)}
                styles={sliderStyles}
                value={weights[key]}
                onChange={(v) => setWeight(key, v)}
              />
            </div>
          </Fragment>
        ))}

        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
          <HeaderText>Weighted rolls per relic</HeaderText>
        </div>
        <span style={labelStyle}>#</span>
        <div style={sliderRowStyle}>
          <Slider
            min={0}
            max={MAX_ROLLS}
            step={0.5}
            style={sliderStyle}
            label={(val) => val.toFixed(1)}
            styles={sliderStyles}
            value={minRolls}
            onChange={setMinRolls}
          />
        </div>
      </div>

      <Text size="xs" fw={600} mt="xs">
        Weight Presets
      </Text>
      <Group gap="xs">
        {Object.entries(WEIGHT_PRESETS).map(([name]) => (
          <Button
            key={name}
            size="compact-xs"
            variant="light"
            onClick={() => applyPreset(WEIGHT_PRESETS[name])}
          >
            {name}
          </Button>
        ))}
      </Group>

      <Button
        size="compact-xs"
        variant="subtle"
        color="gray"
        onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
      >
        Reset All Weights
      </Button>
    </Flex>
  )
}
