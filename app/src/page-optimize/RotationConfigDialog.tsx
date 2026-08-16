import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Modal,
  Stack,
  Text,
} from '@mantine/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { own } from '../formula'
import { FullTagDisplay, useZzzCalcContext } from '../formula-ui'

export function RotationConfigDialog({
  opened,
  close,
  rotation,
  onRotationChange,
}: {
  opened: boolean
  close: () => void
  rotation: Array<{ sheet: string; name: string }> | undefined
  onRotationChange: (
    rotation: Array<{ sheet: string; name: string }> | undefined
  ) => void
}) {
  const calc = useZzzCalcContext()

  const formulaOptions = useMemo(() => {
    if (!calc) return []
    return calc.listFormulas(own.listing.formulas).map(({ tag }) => ({
      sheet: tag.sheet ?? '',
      name: tag.name ?? '',
      tag,
    }))
  }, [calc])

  const [selected, setSelected] = useState<Set<string>>(
    new Set(rotation?.map(({ name }) => name) ?? [])
  )

  useEffect(() => {
    if (opened) {
      setSelected(new Set(rotation?.map(({ name }) => name) ?? []))
    }
  }, [opened, rotation])

  const toggle = useCallback((_sheet: string, name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(formulaOptions.map(({ name }) => name)))
  }, [formulaOptions])

  const clearAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const save = useCallback(() => {
    if (selected.size === 0) {
      onRotationChange(undefined)
    } else {
      const rotation = formulaOptions
        .filter(({ name }) => selected.has(name))
        .map(({ sheet, name }) => ({ sheet, name }))
      onRotationChange(rotation)
    }
    close()
  }, [selected, formulaOptions, onRotationChange, close])

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Configure Rotation DMG"
      size="lg"
    >
      <Stack gap="sm">
        <Text size="sm">
          Select the attacks to include in your rotation. The optimizer will
          maximize the sum of all selected attacks.
        </Text>
        <Flex gap="xs">
          <Button size="compact-xs" variant="subtle" onClick={selectAll}>
            Select All
          </Button>
          <Button size="compact-xs" variant="subtle" onClick={clearAll}>
            Clear All
          </Button>
        </Flex>
        <Divider />
        <Stack gap={4} style={{ maxHeight: 400, overflowY: 'auto' }}>
          {formulaOptions.map(({ sheet, name, tag }) => (
            <Checkbox
              key={`${sheet}_${name}`}
              checked={selected.has(name)}
              onChange={() => toggle(sheet, name)}
              label={
                <Flex style={{ gap: 4 }}>
                  <FullTagDisplay tag={tag} />
                </Flex>
              }
              size="xs"
            />
          ))}
        </Stack>
        <Divider />
        <Flex justify="flex-end" gap="xs">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            Save ({selected.size} attack{selected.size !== 1 ? 's' : ''})
          </Button>
        </Flex>
      </Stack>
    </Modal>
  )
}
