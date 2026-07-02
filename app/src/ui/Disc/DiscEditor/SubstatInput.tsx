import { Group, Menu, Slider, Text } from '@mantine/core'
import {
  CardThemed,
  ColorText,
  DropdownButton,
} from '@zenless-optimizer/common/ui'
import { getUnitStr, range, valueString } from '@zenless-optimizer/common/util'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscRarityKey } from '../../../consts'
import {
  allDiscSubStatKeys,
  discSubstatRollData,
  getDiscSubStatBaseVal,
} from '../../../consts'
import type { ICachedDisc } from '../../../db'
import { StatIcon } from '../../../svgicons'
import type { ISubstat } from '../../../zood'
import { StatDisplay } from '../../Character'

export default function SubstatInput({
  rarity,
  index,
  disc,
  setSubstat,
}: {
  rarity: DiscRarityKey
  index: number
  disc: Partial<ICachedDisc>
  setSubstat: (index: number, substat?: ISubstat) => void
}) {
  const { t } = useTranslation('disc')
  const { mainStatKey = '' } = disc ?? {}
  const { key, upgrades = 0 } = disc?.substats?.[index] ?? {}
  const isEnabled =
    index === 0 || disc?.substats?.[index - 1]?.key !== undefined

  const marks = useMemo(
    () =>
      range(1, discSubstatRollData[rarity].numUpgrades + 1).map((i) => ({
        value: i,
      })),
    [rarity]
  )
  return (
    <Group gap={8} align="center">
      <DropdownButton
        title={
          key ? (
            <StatDisplay statKey={key} showPercent disableIcon />
          ) : (
            t('editor.substat.substatFormat', { value: index + 1 })
          )
        }
        disabled={!disc?.mainStatKey || !isEnabled}
        color={key ? 'success' : 'primary'}
        style={{ whiteSpace: 'nowrap', width: '13em' }}
      >
        {key && (
          <Menu.Item onClick={() => setSubstat(index)}>
            {t('editor.substat.noSubstat')}
          </Menu.Item>
        )}
        {allDiscSubStatKeys
          .filter((key) => mainStatKey !== key)
          .map((k) => (
            <Menu.Item
              key={k}
              onClick={() => setSubstat(index, { key: k, upgrades: 1 })}
            >
              <Group gap={8}>
                <StatIcon statKey={k} />
                <StatDisplay statKey={k} showPercent disableIcon />
              </Group>
            </Menu.Item>
          ))}
      </DropdownButton>
      <CardThemed
        bgt="light"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
          height: '100%',
          width: '2em',
        }}
      >
        {!!upgrades && (
          <ColorText color={upgrades - 1 ? 'warning' : undefined}>
            +{upgrades - 1}
          </ColorText>
        )}
      </CardThemed>
      <CardThemed
        style={{
          flexGrow: 1,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'visible',
          height: '100%',
        }}
      >
        <SliderWrapper
          key={upgrades}
          value={upgrades}
          marks={marks}
          setValue={(v) => {
            key && setSubstat(index, { key, upgrades: v })
          }}
          disabled={!key}
          valueLabelFormat={(v) =>
            `${
              key &&
              valueString(
                v * getDiscSubStatBaseVal(key, rarity),
                getUnitStr(key)
              )
            }`
          }
        />
      </CardThemed>
      <CardThemed
        bgt="light"
        style={{
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          height: '100%',
          width: '4em',
        }}
      >
        <Text>
          {key &&
            valueString(
              (upgrades || 1) * getDiscSubStatBaseVal(key, rarity),
              getUnitStr(key)
            )}
        </Text>
      </CardThemed>
    </Group>
  )
}
function SliderWrapper({
  value,
  setValue,
  marks,
  disabled = false,
  valueLabelFormat,
}: {
  key: number
  value: number
  setValue: (v: number) => void
  marks: Array<{ value: number }>
  disabled: boolean
  valueLabelFormat?: (v: number) => string
}) {
  const [innerValue, setinnerValue] = useState(value)
  return (
    <Slider
      value={innerValue}
      disabled={disabled}
      marks={marks}
      min={marks[0]?.value ?? 0}
      max={marks[marks.length - 1]?.value ?? 0}
      onChange={(v) => setinnerValue(v as number)}
      onChangeEnd={(v) => setValue(v as number)}
      label={valueLabelFormat}
      style={{ flex: 1 }}
    />
  )
}
