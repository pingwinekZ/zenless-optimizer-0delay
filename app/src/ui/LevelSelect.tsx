import { Button, Group, Menu } from '@mantine/core'
import { DropdownButton, NumberInputLazy } from '@zenless-optimizer/common/ui'
import { clamp } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ambiguousLevel,
  ambiguousLevelLow,
  type MilestoneKey,
  maxLevel,
  maxLevelLow,
  milestoneLevels,
  milestoneLevelsLow,
  milestoneMaxLevel,
  milestoneMaxLevelLow,
} from '../consts'

export function LevelSelect({
  level,
  milestone,
  setBoth,
  useLow = false,
  disabled = false,
  warning = false,
}: {
  level: number
  milestone: MilestoneKey
  setBoth: (action: { level?: number; milestone?: MilestoneKey }) => void
  useLow?: boolean
  disabled?: boolean
  warning?: boolean
}) {
  const { t } = useTranslation('ui')
  const milestoneMaxLevels = useLow ? milestoneMaxLevelLow : milestoneMaxLevel
  const setLevel = useCallback(
    (level = 1) => {
      level = clamp(level, 1, useLow ? maxLevelLow : maxLevel)
      const milestone = milestoneMaxLevels.findIndex(
        (ascenML) => level <= ascenML
      ) as MilestoneKey
      setBoth({ level, milestone })
    },
    [setBoth, milestoneMaxLevels, useLow]
  )
  const setAscension = useCallback(() => {
    const lowerAscension = milestoneMaxLevels.findIndex(
      (ascenML) => level !== 60 && level === ascenML
    ) as MilestoneKey
    if (milestone === lowerAscension)
      setBoth({ level, milestone: (milestone + 1) as MilestoneKey })
    else setBoth({ level, milestone: lowerAscension })
  }, [setBoth, milestoneMaxLevels, milestone, level])
  return (
    <Group gap="xs" wrap="wrap">
      <NumberInputLazy
        value={level}
        disabled={disabled}
        onChange={(e) => {
          setLevel(e || 1)
        }}
        min={0}
        max={60}
        style={{ width: '4em', flexGrow: 1 }}
        rightSection={
          <Button
            variant="subtle"
            disabled={
              !(useLow ? ambiguousLevelLow : ambiguousLevel)(level) || disabled
            }
            onClick={setAscension}
            color={warning ? 'orange' : undefined}
            p={0}
          >
            <strong>/ {milestoneMaxLevel[milestone]}</strong>
          </Button>
        }
        label="Level"
      />
      <DropdownButton
        title={t('selectlevel')}
        disabled={disabled}
        color={warning ? 'orange' : undefined}
      >
        {[...(useLow ? milestoneLevelsLow : milestoneLevels)].map(
          ([lv, as]) => {
            const selected = lv === level && as === milestone

            return (
              <Menu.Item
                key={`${lv}/${as}`}
                disabled={selected}
                onClick={() => setBoth({ level: lv, milestone: as })}
              >
                {lv === milestoneMaxLevels[as]
                  ? `Lv. ${lv}`
                  : `Lv. ${lv}/${milestoneMaxLevels[as]}`}
              </Menu.Item>
            )
          }
        )}
      </DropdownButton>
    </Group>
  )
}
