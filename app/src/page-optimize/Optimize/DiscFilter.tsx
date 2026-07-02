import {
  ActionIcon,
  Box,
  Button,
  CardSection,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { CardThemed, ModalWrapper, SqBadge } from '@zenless-optimizer/common/ui'
import { handleMultiSelect } from '@zenless-optimizer/common/util'
import { Suspense, useCallback, useContext } from 'react'
import type { DiscMainStatKey, DiscSetKey, DiscSlotKey } from '../../consts'
import { allDiscSlotKeys, discSlotToMainStatKeys } from '../../consts'
import type { ICachedDisc } from '../../db'
import { OptConfigContext, useDatabaseContext } from '../../db-ui'
import { StatDisplay } from '../../ui'
import { DiscLevelFilter } from './DiscLevelFilter'
import { DiscSetFilter } from './DiscSetFilter'

export function DiscFilter({
  discsBySlot,
}: {
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
}) {
  const [show, onOpen, onClose] = useBoolState()
  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap={1}>
          <Box
            style={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}
          >
            {allDiscSlotKeys.map((key) => (
              <DiscTypo key={key} discsBySlot={discsBySlot} slotKey={key} />
            ))}
          </Box>
          <DiscFilterModal
            show={show}
            onClose={onClose}
            discsBySlot={discsBySlot}
          />
          <Button color="blue" fullWidth onClick={onOpen}>
            Disc Filter Config
          </Button>
        </Stack>
      </CardSection>
    </CardThemed>
  )
}
function DiscTypo({
  discsBySlot,
  slotKey,
}: {
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  slotKey: DiscSlotKey
}) {
  return (
    <Text>
      Disc {slotKey}{' '}
      <SqBadge color={discsBySlot[slotKey].length ? 'primary' : 'error'}>
        {discsBySlot[slotKey].length}
      </SqBadge>
    </Text>
  )
}

function DiscFilterModal({
  discsBySlot,
  show,
  onClose,
  disabled,
}: {
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  show: boolean
  onClose: () => void
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  return (
    <ModalWrapper opened={show} onClose={onClose}>
      <CardThemed>
        <Group p="sm">
          <Text fw={700}>Disc Filter</Text>
          <ActionIcon onClick={onClose} style={{ marginLeft: 'auto' }}>
            <IconX />
          </ActionIcon>
        </Group>
        <Divider />
        <CardSection>
          <Suspense fallback={<Skeleton width="100%" height={500} />}>
            <Stack gap={1}>
              <DiscLevelFilter disabled={disabled} />
              <MainStatSelector discsBySlot={discsBySlot} disabled={disabled} />
              <Button
                disabled={disabled}
                onClick={() =>
                  database.optConfigs.set(optConfigId, {
                    useEquipped: !optConfig.useEquipped,
                  })
                }
                color={optConfig.useEquipped ? 'green' : 'gray'}
              >
                Use equipped Discs
              </Button>
              <SetFilter discBySlot={discsBySlot} disabled={disabled} />
            </Stack>
          </Suspense>
        </CardSection>
      </CardThemed>
    </ModalWrapper>
  )
}

function MainStatSelector({
  discsBySlot,
  disabled,
}: {
  discsBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const discSlotBtns = (slotKey: '4' | '5' | '6') => {
    const mainKeysHandler = handleMultiSelect([
      ...discSlotToMainStatKeys[slotKey],
    ])
    const keysMap = {
      '4': optConfig.slot4 ?? [],
      '5': optConfig.slot5 ?? [],
      '6': optConfig.slot6 ?? [],
    } as Record<'4' | '5' | '6', DiscMainStatKey[]>
    const funcMap = {
      '4': (slot4: DiscMainStatKey[]) =>
        database.optConfigs.set(optConfigId, { slot4 }),
      '5': (slot5: DiscMainStatKey[]) =>
        database.optConfigs.set(optConfigId, { slot5 }),
      '6': (slot6: DiscMainStatKey[]) =>
        database.optConfigs.set(optConfigId, { slot6 }),
    } as Record<'4' | '5' | '6', (slots: DiscMainStatKey[]) => void>
    return (
      <Box style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {discSlotToMainStatKeys[slotKey].map((key) => (
          <Button
            disabled={disabled}
            key={key}
            variant={keysMap[slotKey].includes(key) ? 'filled' : 'outline'}
            onClick={() =>
              funcMap[slotKey](mainKeysHandler([...keysMap[slotKey]], key))
            }
          >
            <StatDisplay statKey={key} showPercent />
          </Button>
        ))}
      </Box>
    )
  }
  return (
    <CardThemed bgt="light">
      <CardSection>
        <Stack gap={1}>
          <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
            <DiscTypo slotKey="1" discsBySlot={discsBySlot} />
            <DiscTypo slotKey="2" discsBySlot={discsBySlot} />
            <DiscTypo slotKey="3" discsBySlot={discsBySlot} />
          </Box>
          <DiscTypo slotKey="4" discsBySlot={discsBySlot} />
          {discSlotBtns('4')}
          <DiscTypo slotKey="5" discsBySlot={discsBySlot} />
          {discSlotBtns('5')}
          <DiscTypo slotKey="6" discsBySlot={discsBySlot} />
          {discSlotBtns('6')}
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

function SetFilter({
  discBySlot,
  disabled,
}: {
  discBySlot: Record<DiscSlotKey, ICachedDisc[]>
  disabled?: boolean
}) {
  const { database } = useDatabaseContext()
  const { optConfigId, optConfig } = useContext(OptConfigContext)
  const { setFilter2 = [], setFilter4 = [] } = optConfig

  const setSetFilter2 = useCallback(
    (setFilter2: DiscSetKey[]) => {
      database.optConfigs.set(optConfigId, { setFilter2 })
    },
    [database, optConfigId]
  )
  const setSetFilter4 = useCallback(
    (setFilter4: DiscSetKey[]) => {
      database.optConfigs.set(optConfigId, { setFilter4 })
    },
    [database, optConfigId]
  )
  return (
    <DiscSetFilter
      discBySlot={discBySlot}
      disabled={disabled}
      setFilter2={setFilter2}
      setFilter4={setFilter4}
      setSetFilter2={setSetFilter2}
      setSetFilter4={setSetFilter4}
    />
  )
}
