import {
  Accordion,
  ActionIcon,
  Divider,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import {
  CardThemed,
  CodeBlock,
  ModalWrapper,
} from '@zenless-optimizer/common/ui'
import { prettify } from '@zenless-optimizer/common/util'
import type { Read } from '@zenless-optimizer/game-opt/engine'
import { useContext } from 'react'
import { CalcContext, DebugReadContext, TagContext } from './context'

export function DebugListingsDisplay({
  formulasRead,
  buffsRead,
}: {
  formulasRead: Read
  buffsRead: Read
}) {
  const tag = useContext(TagContext)
  const calc = useContext(CalcContext)?.withTag(tag)
  const debugCalc = calc?.toDebug()

  return (
    <CardThemed bgt="dark">
      <Accordion chevron={<IconChevronDown size={20} />}>
        <Accordion.Item value="formulas">
          <Accordion.Control>All target listings</Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {calc &&
                debugCalc &&
                calc.listFormulas(formulasRead).map((read, index) => {
                  const computed = calc.compute(read)
                  const debugMeta = debugCalc.compute(read).meta
                  const name = read.tag.name || read.tag.q
                  return (
                    <div key={`${name}${index}`}>
                      <Text>
                        {name}: {computed.val}
                      </Text>
                      <Accordion chevron={<IconChevronDown size={16} />}>
                        <Accordion.Item value="debug">
                          <Accordion.Control>
                            debug for {name}
                          </Accordion.Control>
                          <Accordion.Panel>
                            conds:
                            <CodeBlock text={prettify(computed.meta.conds)} />
                            read:
                            <CodeBlock text={prettify(read)} />
                            formula:
                            <CodeBlock text={prettify(debugMeta)} />
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    </div>
                  )
                })}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="buffs">
          <Accordion.Control>All target buffs</Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {calc &&
                debugCalc &&
                calc.listFormulas(buffsRead).map((read, index) => {
                  const computed = calc.compute(read)
                  const debugMeta = debugCalc.compute(read).meta
                  const name = read.tag.name || read.tag.q
                  return (
                    <div key={`${name}${index}`}>
                      <Text>
                        {name}: {computed.val}
                      </Text>
                      <Accordion chevron={<IconChevronDown size={16} />}>
                        <Accordion.Item value="debug">
                          <Accordion.Control>
                            debug for {name}
                          </Accordion.Control>
                          <Accordion.Panel>
                            conds:
                            <CodeBlock text={prettify(computed.meta.conds)} />
                            read:
                            <CodeBlock text={prettify(read)} />
                            formula:
                            <CodeBlock text={prettify(debugMeta)} />
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    </div>
                  )
                })}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </CardThemed>
  )
}

export function DebugReadModal() {
  const tag = useContext(TagContext)
  const calculator = useContext(CalcContext)?.withTag(tag)
  const debugCalc = calculator?.toDebug()
  const { read, setRead } = useContext(DebugReadContext)
  const computed = read && calculator?.compute(read)
  const debug = read && debugCalc?.compute(read)
  const name = read?.tag['name'] || read?.tag['q']
  const meta = debug?.meta
  const jsonStr = meta && prettify(meta)

  return (
    <ModalWrapper opened={!!read} onClose={() => setRead(undefined)}>
      <CardThemed bgt="dark">
        <CardThemed
          bgt="normal"
          style={{ padding: 'var(--mantine-spacing-md)' }}
        >
          <Stack gap={1}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text fw={500}>Debug formula for {name}</Text>
              <ActionIcon onClick={() => setRead(undefined)} variant="subtle">
                <IconX size={18} />
              </ActionIcon>
            </div>
            Computed value: {computed?.val}
            <Divider />
            <Title order={6}>Read</Title>
            <CodeBlock text={prettify(read)} />
            <Divider />
            <Title order={6}>Calculator Tag</Title>
            <CodeBlock text={JSON.stringify(calculator?.cache.tag)} />
            <Divider />
            <Title order={6}>Tag Context</Title>
            <CodeBlock text={JSON.stringify(tag)} />
            <Divider />
            <Title order={6}>Conditionals</Title>
            <CodeBlock text={prettify(computed?.meta.conds)} />
            <Divider />
            <Title order={6}>Formula</Title>
            <CodeBlock text={jsonStr || ''} />
          </Stack>
        </CardThemed>
      </CardThemed>
    </ModalWrapper>
  )
}
