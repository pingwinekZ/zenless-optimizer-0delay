import { Button, Flex } from '@mantine/core'
import { IconAdjustments } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { useContext } from 'react'
import type { DiscMainStatKey, DiscSlotKey } from '../../consts'
import { discSlotToMainStatKeys, statKeyTextMap } from '../../consts'
import type { ICachedDisc } from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { HeaderText, MultiSelectPills } from '../layout'
import { DiscSetFilterModal } from './DiscSetFilterModal'
import { FormSetConditionals } from './FormSetConditionals'

const mainStatStyle = { width: '100%' } as const

function MainStatSlot({
  slotKey,
  disabled: _disabled,
}: {
  slotKey: '4' | '5' | '6'
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)

  const value = (optConfig[`slot${slotKey}`] ?? []) as DiscMainStatKey[]
  const data = discSlotToMainStatKeys[slotKey].map((key) => ({
    value: key,
    label: `${statKeyTextMap[key] ?? key}`,
  }))

  return (
    <MultiSelectPills
      clearable
      size="xs"
      style={mainStatStyle}
      placeholder={`S${slotKey}`}
      value={value}
      onChange={(val) =>
        database.optConfigs.set(optConfigId, { [`slot${slotKey}`]: val })
      }
      data={data}
    />
  )
}

export function DiscMainSetFilters({
  discsBySlot,
  disabled,
}: {
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
}) {
  const [showSetFilter, onOpenSetFilter, onCloseSetFilter] = useBoolState()
  const [showConditionals, onOpenConditionals, onCloseConditionals] =
    useBoolState()

  return (
    <Flex direction="column" gap={5}>
      <HeaderText>Main stats</HeaderText>
      <Flex direction="column" gap={7}>
        <MainStatSlot slotKey="4" disabled={disabled} />
        <MainStatSlot slotKey="5" disabled={disabled} />
        <MainStatSlot slotKey="6" disabled={disabled} />
      </Flex>

      <HeaderText style={{ marginTop: 20 }}>Sets</HeaderText>
      <Flex direction="column" gap={7}>
        <Button
          leftSection={<IconAdjustments size={16} />}
          variant="default"
          onClick={onOpenSetFilter}
          disabled={disabled}
        >
          Disc Set Filter
        </Button>

        <Button
          leftSection={<IconAdjustments size={16} />}
          variant="default"
          onClick={onOpenConditionals}
          disabled={disabled}
        >
          Set Conditionals
        </Button>
      </Flex>

      <DiscSetFilterModal
        show={showSetFilter}
        onClose={onCloseSetFilter}
        discsBySlot={discsBySlot}
        disabled={disabled}
      />
      <FormSetConditionals
        show={showConditionals}
        onClose={onCloseConditionals}
      />
    </Flex>
  )
}
