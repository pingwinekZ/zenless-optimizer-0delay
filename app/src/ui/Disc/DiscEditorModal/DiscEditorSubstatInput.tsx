import { Group, Menu, SegmentedControl, Text } from '@mantine/core'
import { DropdownButton } from '@zenless-optimizer/common/ui'
import { getUnitStr, valueString } from '@zenless-optimizer/common/util'
import { useTranslation } from 'react-i18next'
import type {
  DiscMainStatKey,
  DiscRarityKey,
  DiscSubStatKey,
} from '../../../consts'
import { allDiscSubStatKeys, getDiscSubStatBaseVal } from '../../../consts'
import { StatIcon } from '../../../svgicons'
import { StatDisplay } from '../../Character'
import modalClasses from './DiscEditorModal.module.css'
import type { SubstatUpgradeValues } from './discEditorModalTypes'

export function DiscEditorSubstatInput({
  index,
  rarity,
  mainStatKey,
  statKey,
  upgradeCount,
  upgradeValues,
  onStatChange,
  onUpgradeChange,
}: {
  index: number
  rarity: DiscRarityKey
  mainStatKey: DiscMainStatKey
  statKey: DiscSubStatKey | ''
  upgradeCount: number
  upgradeValues: SubstatUpgradeValues
  onStatChange: (stat: DiscSubStatKey | '') => void
  onUpgradeChange: (upgrades: number) => void
}) {
  const { t } = useTranslation('disc')

  const upgradeOptions = upgradeValues.upgrades.map((tier) => ({
    label: `+${tier - 1}`,
    value: String(tier),
  }))

  return (
    <>
      <DropdownButton
        title={
          statKey ? (
            <StatDisplay statKey={statKey} showPercent disableIcon />
          ) : (
            t('editor.substat.substatFormat', { value: index + 1 })
          )
        }
        color={statKey ? 'success' : 'primary'}
        style={{ whiteSpace: 'nowrap', width: '100%' }}
        size="xs"
      >
        {statKey && (
          <Menu.Item onClick={() => onStatChange('')}>
            {t('editor.substat.noSubstat')}
          </Menu.Item>
        )}
        {allDiscSubStatKeys
          .filter((k) => mainStatKey !== k)
          .map((k) => (
            <Menu.Item
              key={k}
              onClick={() => {
                onStatChange(k)
                if (upgradeCount === 0) onUpgradeChange(1)
              }}
            >
              <Group gap={6}>
                <StatIcon
                  statKey={k}
                  iconProps={{ style: { fill: 'white' } }}
                />
                <StatDisplay statKey={k} showPercent disableIcon />
              </Group>
            </Menu.Item>
          ))}
      </DropdownButton>

      <div className={modalClasses['valueCell']}>
        <Text size="xs" ta="center">
          {statKey
            ? valueString(
                (upgradeCount || 1) * getDiscSubStatBaseVal(statKey, rarity),
                getUnitStr(statKey)
              )
            : '\u2014'}
        </Text>
      </div>

      {upgradeOptions.length > 0 ? (
        <SegmentedControl
          size="xs"
          data={upgradeOptions}
          value={String(upgradeCount || 1)}
          onChange={(val) => onUpgradeChange(parseInt(val))}
          fullWidth
        />
      ) : (
        <div />
      )}
    </>
  )
}
