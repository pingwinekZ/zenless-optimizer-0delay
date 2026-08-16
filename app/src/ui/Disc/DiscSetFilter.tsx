import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  SimpleGrid,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  DropdownButton,
  ImgIcon,
  ModalWrapper,
} from '@zenless-optimizer/common/ui'
import { toggleInArr } from '@zenless-optimizer/common/util'
import { discDefIcon } from '../../assets'
import type { DiscSetKey } from '../../consts'
import { allDiscSetKeys } from '../../consts'
import { DiscSetName } from './DiscTrans'

export function DiscSetFilter({
  disabled = false,
  setFilter4,
  setFilter2,
  setSetFilter4,
  setSetFilter2,
}: {
  disabled?: boolean
  setFilter4: DiscSetKey[]
  setFilter2: DiscSetKey[]
  setSetFilter4: (setFilter4: DiscSetKey[]) => void
  setSetFilter2: (setFilter2: DiscSetKey[]) => void
}) {
  const [open, onOpen, onClose] = useBoolState()
  return (
    <CardThemed bgt="light">
      <ModalWrapper opened={open} onClose={onClose}>
        <AdvSetFilterCard
          onClose={onClose}
          setFilter2={setFilter2}
          setFilter4={setFilter4}
          setSetFilter2={setSetFilter2}
          setSetFilter4={setSetFilter4}
        />
      </ModalWrapper>
      <Box p="sm" style={{ display: 'flex', gap: 8 }}>
        <Box
          style={{
            flexGrow: 1,
            display: 'flex',
            gap: 8,
            flexDirection: 'column',
          }}
        >
          {setFilter4.length <= 1 ? (
            <DropdownButton
              disabled={disabled}
              title={
                setFilter4[0] ? (
                  <span>
                    Force 4-Set:{' '}
                    <strong>
                      <DiscSetName setKey={setFilter4[0]} />
                    </strong>
                  </span>
                ) : (
                  'Select to force 4-Set'
                )
              }
              style={{ flexGrow: 1 }}
            >
              <Menu.Item onClick={() => setSetFilter4([])}>No 4-Set</Menu.Item>

              {allDiscSetKeys.map((d) => (
                <Menu.Item key={d} onClick={() => setSetFilter4([d])}>
                  <DiscSetName setKey={d} />
                </Menu.Item>
              ))}
            </DropdownButton>
          ) : (
            <Button disabled variant="default">
              <span>
                <strong>{setFilter4.length}</strong> Disc 4p-set Selected
              </span>
            </Button>
          )}

          {setFilter2.length <= 1 ? (
            <DropdownButton
              disabled={disabled}
              title={
                setFilter2[0] ? (
                  <span>
                    Force 2-Set:{' '}
                    <strong>
                      <DiscSetName setKey={setFilter2[0]} />
                    </strong>
                  </span>
                ) : (
                  'Select to force 2-Set'
                )
              }
              style={{ flexGrow: 1 }}
            >
              <Menu.Item onClick={() => setSetFilter2([])}>No 2-Set</Menu.Item>

              {allDiscSetKeys.map((d) => (
                <Menu.Item key={d} onClick={() => setSetFilter2([d])}>
                  <DiscSetName setKey={d} />
                </Menu.Item>
              ))}
            </DropdownButton>
          ) : (
            <Button disabled variant="default">
              <span>
                <strong>{setFilter2.length}</strong> Disc 2p-set Selected
              </span>
            </Button>
          )}
        </Box>
        <Box style={{ display: 'flex', alignItems: 'stretch' }}>
          <Button
            disabled={disabled}
            onClick={onOpen}
            color="blue"
            variant="default"
          >
            Advanced Set-Filter Config
          </Button>
        </Box>
      </Box>
    </CardThemed>
  )
}
function AdvSetFilterCard({
  onClose,
  setFilter4,
  setFilter2,
  setSetFilter4,
  setSetFilter2,
}: {
  onClose: () => void
  setFilter4: DiscSetKey[]
  setFilter2: DiscSetKey[]
  setSetFilter4: (setFilter4: DiscSetKey[]) => void
  setSetFilter2: (setFilter2: DiscSetKey[]) => void
}) {
  return (
    <CardThemed>
      <Group justify="space-between" p="sm">
        <Text fw={700}>Advanced Set-Filter Config</Text>
        <ActionIcon onClick={onClose} variant="subtle">
          <IconX />
        </ActionIcon>
      </Group>
      <Divider />
      <Box p="sm">
        <Group gap={8} mb={8}>
          <Button
            disabled={!setFilter4.length}
            onClick={() => setSetFilter4([])}
            variant="default"
          >
            Reset 4p filter
          </Button>
          <Button
            disabled={!setFilter2.length}
            onClick={() => setSetFilter2([])}
            variant="default"
          >
            Reset 2p filter
          </Button>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={8}>
          {allDiscSetKeys.map((d) => (
            <Box key={d}>
              <AdvSetFilterDiscCard
                setKey={d}
                setFilter4={setFilter4}
                setFilter2={setFilter2}
                setSetFilter4={setSetFilter4}
                setSetFilter2={setSetFilter2}
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </CardThemed>
  )
}
function AdvSetFilterDiscCard({
  setKey,
  setFilter4,
  setFilter2,
  setSetFilter4,
  setSetFilter2,
}: {
  setKey: DiscSetKey
  setFilter4: DiscSetKey[]
  setFilter2: DiscSetKey[]
  setSetFilter4: (setFilter4: DiscSetKey[]) => void
  setSetFilter2: (setFilter2: DiscSetKey[]) => void
}) {
  return (
    <CardThemed bgt="light">
      <Box p="sm">
        <Group gap={8}>
          <ImgIcon src={discDefIcon(setKey)} size={2} />
          <Text fw={700}>
            <DiscSetName setKey={setKey} />
          </Text>
        </Group>
      </Box>
      <Button.Group>
        <Button
          color={
            !setFilter4.length || setFilter4.includes(setKey) ? 'green' : 'gray'
          }
          onClick={() =>
            setSetFilter4(
              setFilter4.length
                ? toggleInArr([...setFilter4], setKey)
                : [setKey]
            )
          }
          variant={
            !setFilter4.length || setFilter4.includes(setKey)
              ? 'filled'
              : 'default'
          }
          style={{ flex: 1 }}
        >
          Allow 4p
        </Button>
        <Button
          color={
            !setFilter2.length || setFilter2.includes(setKey) ? 'green' : 'gray'
          }
          onClick={() =>
            setSetFilter2(
              setFilter2.length
                ? toggleInArr([...setFilter2], setKey)
                : [setKey]
            )
          }
          variant={
            !setFilter2.length || setFilter2.includes(setKey)
              ? 'filled'
              : 'default'
          }
          style={{ flex: 1 }}
        >
          Allow 2p
        </Button>
      </Button.Group>
    </CardThemed>
  )
}
