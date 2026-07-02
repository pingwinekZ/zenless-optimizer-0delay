import {
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  ScrollArea,
  Select,
  Text,
} from '@mantine/core'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CharacterKey,
  DiscMainStatKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../consts'
import {
  allCharacterKeys,
  allDiscSubStatKeys,
  discSlotToMainStatKeys,
  statKeyTextMap,
} from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { StatIcon } from '../../svgicons'
import {
  getCharacterEffectiveStats,
  getCharacterSubstatWeights,
} from '../../util'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'

const SCORING_SLOTS: DiscSlotKey[] = ['4', '5', '6']

type FormState = {
  substatWeights: Partial<Record<DiscSubStatKey, number | null>>
  mainStats: Partial<Record<DiscSlotKey, DiscMainStatKey[]>>
}

export function StatWeightEditorModal({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  const { database } = useDatabaseContext()
  const focusCharacter = useDiscTabStore((s) => s.focusCharacter)
  const { t: tChar } = useTranslation('charNames_gen')
  const { t: tk } = useTranslation('statKey_gen')
  const { t } = useTranslation('discTab')

  const [selectedChar, setSelectedChar] = useState<CharacterKey | null>(
    focusCharacter ?? null
  )
  const [form, setForm] = useState<FormState>({
    substatWeights: {},
    mainStats: {},
  })
  const [dirty, setDirty] = useState(false)

  // Load overrides when character changes
  useEffect(() => {
    if (!selectedChar) {
      setForm({ substatWeights: {}, mainStats: {} })
      return
    }
    const override = database.statWeights.get(selectedChar)
    setForm({
      substatWeights: { ...override.substatWeights },
      mainStats: { ...override.mainStats },
    })
    setDirty(false)
  }, [selectedChar, database])

  const handleWeightChange = useCallback(
    (key: DiscSubStatKey, value: number | null) => {
      setForm((prev) => ({
        ...prev,
        substatWeights: { ...prev.substatWeights, [key]: value },
      }))
      setDirty(true)
    },
    []
  )

  const handleMainStatsChange = useCallback(
    (slot: DiscSlotKey, values: string[]) => {
      setForm((prev) => ({
        ...prev,
        mainStats: { ...prev.mainStats, [slot]: values as DiscMainStatKey[] },
      }))
      setDirty(true)
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!selectedChar) return
    database.statWeights.set(selectedChar, {
      substatWeights: form.substatWeights,
      mainStats: form.mainStats,
    })
    setDirty(false)
  }, [selectedChar, form, database])

  const handleResetChar = useCallback(() => {
    if (!selectedChar) return
    database.statWeights.resetCharacter(selectedChar)
    setForm({ substatWeights: {}, mainStats: {} })
    setDirty(false)
  }, [selectedChar, database])

  const handleResetAll = useCallback(() => {
    database.statWeights.resetAll()
    if (selectedChar) {
      setForm({ substatWeights: {}, mainStats: {} })
    }
    setDirty(false)
  }, [database, selectedChar])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Get available main stats for each slot
  const availableMainStats = useMemo(
    () =>
      Object.fromEntries(
        SCORING_SLOTS.map((slot) => [
          slot,
          discSlotToMainStatKeys[slot].map((key) => ({
            value: key,
            label: statKeyTextMap[key] ?? key,
          })),
        ])
      ) as Record<string, { value: string; label: string }[]>,
    []
  )

  const currentDefaultWeights = useMemo(
    () => (selectedChar ? getCharacterSubstatWeights(selectedChar) : {}),
    [selectedChar]
  )

  const currentDefaultStats = useMemo(
    () => (selectedChar ? getCharacterEffectiveStats(selectedChar) : []),
    [selectedChar]
  )

  const effectiveSet = useMemo(
    () => new Set(currentDefaultStats as string[]),
    [currentDefaultStats]
  )

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700}>{t('RelicFilterBar.ScoringButton')}</Text>}
      size="xl"
      closeOnClickOutside={false}
    >
      <Flex gap="md">
        {/* Left column: character selector and stats list */}
        <Box style={{ width: 240, flexShrink: 0 }}>
          <Select
            size="xs"
            placeholder="Character"
            data={allCharacterKeys.map((ck) => ({
              value: ck,
              label: tChar(ck) || ck,
            }))}
            value={selectedChar}
            onChange={(v) => {
              setSelectedChar(v as CharacterKey | null)
            }}
            searchable
            clearable
            mb="xs"
          />
          <Divider label="Stat weights" labelPosition="center" mb="xs" />
          <ScrollArea h={400}>
            <Flex direction="column" gap={4}>
              {allDiscSubStatKeys.map((key) => {
                const defaultValue = currentDefaultWeights[key] ?? null
                const currentValue = form.substatWeights[key]
                const isEffective = effectiveSet.has(key)
                return (
                  <Flex key={key} align="center" gap={6}>
                    <NumberInput
                      size="xs"
                      style={{ width: 62 }}
                      decimalScale={2}
                      min={0}
                      max={3}
                      step={0.05}
                      placeholder={defaultValue?.toFixed(2) ?? ''}
                      value={currentValue ?? ''}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number'
                            ? v
                            : v === '' || v === undefined || v === null
                              ? null
                              : Number(v)
                        handleWeightChange(
                          key,
                          isNaN(num as number) ? null : num
                        )
                      }}
                    />
                    <StatIcon
                      statKey={key}
                      iconProps={{ style: { fontSize: 14 } }}
                    />
                    <Text
                      size="xs"
                      style={{
                        flex: 1,
                        color: isEffective
                          ? undefined
                          : 'var(--mantine-color-dimmed)',
                      }}
                    >
                      {(tk(key) || key) + getUnitStr(key)}
                    </Text>
                    {defaultValue !== undefined && defaultValue !== null && (
                      <Text size="xs" c="dimmed" style={{ minWidth: 20 }}>
                        {defaultValue.toFixed(2)}
                      </Text>
                    )}
                  </Flex>
                )
              })}
            </Flex>
          </ScrollArea>
        </Box>

        <Divider orientation="vertical" />

        {/* Right column: per-slot main stat selectors */}
        <Box style={{ flex: 1 }}>
          <Text fw={600} size="sm" mb="xs">
            Recommended Main Stats
          </Text>
          <Flex direction="column" gap={8}>
            {SCORING_SLOTS.map((slot) => (
              <Box key={slot}>
                <Text size="xs" c="dimmed" mb={2}>
                  Slot {slot}
                </Text>
                <MultiSelect
                  size="xs"
                  data={availableMainStats[slot]}
                  value={form.mainStats[slot] ?? []}
                  onChange={(vals) => handleMainStatsChange(slot, vals)}
                  placeholder={`Slot ${slot} main stats`}
                  clearable
                  searchable
                  comboboxProps={{ keepMounted: false }}
                />
              </Box>
            ))}
          </Flex>
        </Box>
      </Flex>

      <Divider
        my="sm"
        label={
          <Text
            component="a"
            href="https://github.com/fribbels/hsr-optimizer/blob/main/docs/guides/en/stat-score.md"
            target="_blank"
            rel="noreferrer"
            size="xs"
            td="underline"
            c="var(--mantine-color-anchor)"
          >
            How is Substat Score calculated?
          </Text>
        }
        labelPosition="center"
      />

      <Group justify="flex-end" gap="xs">
        <Button variant="default" size="xs" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="default" size="xs" onClick={handleResetChar}>
          Reset to default
        </Button>
        <Button color="red" size="xs" onClick={handleResetAll}>
          Reset all characters
        </Button>
        <Button size="xs" onClick={handleSave} disabled={!dirty}>
          Save changes
        </Button>
      </Group>
    </Modal>
  )
}
