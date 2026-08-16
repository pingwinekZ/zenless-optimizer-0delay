import { Box, Divider, RangeSlider } from '@mantine/core'
import { CustomNumberInput, usePrev } from '@zenless-optimizer/common/ui'
import { clamp } from '@zenless-optimizer/common/util'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { discMaxLevel } from '../../consts'

export function DiscLevelSlider({
  levelLow,
  levelHigh,
  setLow,
  setHigh,
  setBoth,
  dark = false,
  disabled = false,
  showLevelText = false,
}: {
  levelLow: number
  levelHigh: number
  setLow: (low: number) => void
  setHigh: (high: number) => void
  setBoth: (low: number, high: number) => void
  dark?: boolean
  disabled?: boolean
  showLevelText?: boolean
}) {
  const { t } = useTranslation('artifact')
  const [sliderLow, setsliderLow] = useState(levelLow)
  if (usePrev(levelLow) !== levelLow) setsliderLow(levelLow)
  const [sliderHigh, setsliderHigh] = useState(levelHigh)
  if (usePrev(levelHigh) !== levelHigh) setsliderHigh(levelHigh)
  const setSlider = useCallback(
    (value: [number, number]) => {
      const [l, h] = value
      setsliderLow(l)
      setsliderHigh(h)
    },
    [setsliderLow, setsliderHigh]
  )
  return (
    <Box
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: dark
          ? 'var(--mantine-color-gray-8)'
          : 'var(--mantine-color-gray-1)',
        overflow: 'visible',
      }}
    >
      <Box style={{ width: 'max-content', height: 32, display: 'flex' }}>
        {showLevelText ? (
          <>
            <span
              style={{
                padding: '0 1em',
                width: 'max-content',
                borderRadius: '4px 0 0 4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.9)',
                backgroundColor: 'rgb(30,120,200)',
              }}
            >
              {t('levelSliderTitle')}
            </span>
            <Divider orientation="vertical" />
          </>
        ) : undefined}

        <CustomNumberInput
          value={sliderLow}
          onChange={(val) => setLow(clamp(val ?? 0, 0, levelHigh))}
          sx={{
            px: 1,
            width: '3em',
          }}
          inputProps={{ sx: { textAlign: showLevelText ? 'right' : 'center' } }}
          disabled={disabled}
        />
      </Box>
      <RangeSlider
        style={{ flex: '0 1 100%', margin: '0 16px' }}
        value={[sliderLow, sliderHigh]}
        onChange={setSlider}
        onChangeEnd={(value) => setBoth(value[0], value[1])}
        min={0}
        max={discMaxLevel['S']}
        step={1}
        marks={[
          { value: 0 },
          { value: 3 },
          { value: 6 },
          { value: 9 },
          { value: 12 },
          { value: 15 },
        ]}
        disabled={disabled}
      />
      <CustomNumberInput
        value={sliderHigh}
        onChange={(val) =>
          setHigh(clamp(val ?? 0, levelLow, discMaxLevel['S']))
        }
        sx={{ px: 1, flex: '0 0 3em' }}
        inputProps={{ sx: { textAlign: 'center' } }}
        disabled={disabled}
      />
    </Box>
  )
}
