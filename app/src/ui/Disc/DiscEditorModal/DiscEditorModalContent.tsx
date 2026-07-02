import { Box, Button, Flex, Group, Select, Text } from '@mantine/core'
import {
  CardThemed,
  GeneralAutocomplete,
  ImgIcon,
} from '@zenless-optimizer/common/ui'
import {
  getUnitStr,
  statKeyToFixed,
  toPercent,
} from '@zenless-optimizer/common/util'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { discDefIcon } from '../../../assets'
import type {
  DiscMainStatKey,
  DiscSlotKey,
  DiscSubStatKey,
} from '../../../consts'
import {
  allDiscSetKeys,
  allDiscSlotKeys,
  discMaxLevel,
  discSlotToMainStatKeys,
} from '../../../consts'
import { useDatabaseContext } from '../../../db-ui'
import { LocationAutocomplete } from '../../Character/LocationAutocomplete'
import modalClasses from './DiscEditorModal.module.css'
import { DiscEditorSubstatInput } from './DiscEditorSubstatInput'
import {
  calculateUpgradeValues,
  computeInitialFormValues,
  computeMainStatOptions,
  computeMainStatValue,
  RARITY_OPTIONS,
  validateDiscEditor,
} from './discEditorModalController'
import { useDiscEditorModalStore } from './discEditorModalStore'
import type { DiscEditorForm } from './discEditorModalTypes'

export function DiscEditorModalContent() {
  const config = useDiscEditorModalStore((s) => s.config)!
  const closeOverlay = useDiscEditorModalStore((s) => s.closeOverlay)
  const { database } = useDatabaseContext()

  const [form, setForm] = useState<DiscEditorForm>(() =>
    computeInitialFormValues(config)
  )

  const { selectedDisc } = config

  const updateForm = useCallback(
    (updates: Partial<DiscEditorForm>) =>
      setForm((prev) => ({ ...prev, ...updates })),
    []
  )

  const mainStatValue = useMemo(
    () => computeMainStatValue(form.rarity, form.mainStatKey, form.level),
    [form.rarity, form.mainStatKey, form.level]
  )

  const mainStatOptions = useMemo(
    () => computeMainStatOptions(form.slotKey),
    [form.slotKey]
  )

  const upgradeValues = useMemo(() => calculateUpgradeValues(form), [form])

  const validation = useMemo(() => validateDiscEditor(form), [form])

  const errors = useMemo(() => {
    if (Array.isArray(validation)) return validation
    return []
  }, [validation])

  const isValid = errors.length === 0

  const handleSubmit = useCallback(() => {
    if (!isValid) return
    const result = validateDiscEditor(form)
    if (Array.isArray(result)) return

    if (selectedDisc?.id) {
      database.discs.set(selectedDisc.id, result)
    } else {
      database.discs.new(result)
    }
    closeOverlay()
  }, [form, isValid, selectedDisc, database.discs, closeOverlay])

  const handleCancel = useCallback(() => closeOverlay(), [closeOverlay])

  const setSubstatKey = useCallback(
    (index: number, key: string) => {
      const field = `substatKey${index}` as keyof DiscEditorForm
      updateForm({ [field]: key })
    },
    [updateForm]
  )

  const setSubstatUpgrade = useCallback(
    (index: number, upgrades: number) => {
      const field = `substatUpgrade${index}` as keyof DiscEditorForm
      updateForm({ [field]: upgrades })
    },
    [updateForm]
  )

  return (
    <Box>
      <div className={modalClasses['editorGrid']}>
        {/* Left column */}
        <Flex direction="column" gap={5}>
          <Text fw={600} size="sm">
            Slot
          </Text>
          <Group gap={8}>
            {allDiscSlotKeys.map((sk) => (
              <Button
                key={sk}
                color={sk === form.slotKey ? 'green' : undefined}
                onClick={() => {
                  const newSlot = sk as DiscSlotKey
                  const newMainStats = discSlotToMainStatKeys[newSlot]
                  const newMainStat = newMainStats.includes(form.mainStatKey)
                    ? form.mainStatKey
                    : newMainStats[0]
                  updateForm({ slotKey: newSlot, mainStatKey: newMainStat })
                }}
                variant={sk === form.slotKey ? 'filled' : 'default'}
                style={{ flexGrow: 1 }}
              >
                {sk}
              </Button>
            ))}
          </Group>

          <Text fw={600} size="sm" mt={4}>
            Set
          </Text>
          <DiscSetSelect
            value={form.setKey}
            onChange={(key) => updateForm({ setKey: key as any })}
          />

          <Text fw={600} size="sm" mt={4}>
            Rarity / Level
          </Text>
          <Group gap={8}>
            <Select
              style={{ width: 80 }}
              size="sm"
              data={RARITY_OPTIONS}
              value={form.rarity}
              onChange={(rarity) => {
                if (!rarity) return
                const maxLvl = discMaxLevel[rarity as keyof typeof discMaxLevel]
                const newLevel = Math.min(
                  Math.floor(form.level / 3) * 3,
                  maxLvl
                )
                updateForm({
                  rarity: rarity as 'S' | 'A' | 'B',
                  level: newLevel,
                })
              }}
            />
            <Select
              style={{ width: 80 }}
              size="sm"
              data={Array.from(
                { length: Math.floor(discMaxLevel[form.rarity] / 3) + 1 },
                (_, i) => {
                  const level = i * 3
                  return { value: String(level), label: `+${level}` }
                }
              )}
              value={String(form.level)}
              onChange={(level) => {
                if (level == null) return
                updateForm({ level: parseInt(level) })
              }}
            />
          </Group>

          <Text fw={600} size="sm" mt={4}>
            Main Stat
          </Text>
          <Group gap={8}>
            <Select
              style={{ flex: 1 }}
              size="sm"
              data={mainStatOptions}
              value={form.mainStatKey}
              onChange={(key) => {
                if (key) updateForm({ mainStatKey: key as DiscMainStatKey })
              }}
            />
            <CardThemed bgt="light" style={{ padding: 8, minWidth: 80 }}>
              <Text c="dimmed" size="sm">
                {form.mainStatKey && mainStatValue != null
                  ? `${toPercent(mainStatValue, form.mainStatKey).toFixed(
                      statKeyToFixed(form.mainStatKey)
                    )}${getUnitStr(form.mainStatKey)}`
                  : '—'}
              </Text>
            </CardThemed>
          </Group>

          <Text fw={600} size="sm" mt={4}>
            Location
          </Text>
          <LocationAutocomplete
            locKey={form.location}
            setLocKey={(loc) => updateForm({ location: loc })}
          />
        </Flex>

        {/* Spacer */}
        <Box />

        {/* Right column: substats */}
        <Flex direction="column" gap={5}>
          <Text fw={600} size="sm">
            Substats
          </Text>

          {[0, 1, 2, 3].map((index) => {
            const keyField = `substatKey${index}` as keyof DiscEditorForm
            const upgradeField =
              `substatUpgrade${index}` as keyof DiscEditorForm
            return (
              <DiscEditorSubstatInput
                key={index}
                index={index}
                rarity={form.rarity}
                mainStatKey={form.mainStatKey}
                statKey={form[keyField] as DiscSubStatKey | ''}
                upgradeCount={form[upgradeField] as number}
                upgradeValues={upgradeValues[index]}
                onStatChange={(key) => setSubstatKey(index, key)}
                onUpgradeChange={(upgrades) =>
                  setSubstatUpgrade(index, upgrades)
                }
              />
            )
          })}
        </Flex>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <CardThemed
          style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          {errors.map((e, i) => (
            <Text key={i} size="sm" c="red">
              {e}
            </Text>
          ))}
        </CardThemed>
      )}

      {/* Buttons */}
      <Flex justify="flex-end" gap={10} mt={16}>
        <Button variant="default" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          Submit
        </Button>
      </Flex>
    </Box>
  )
}

function DiscSetSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const { t } = useTranslation(['disc', 'discNames_gen'])

  const options = useMemo(
    () =>
      allDiscSetKeys.map((set) => ({
        key: set,
        label: t(`discNames_gen:${set}` as any),
      })),
    [t]
  )

  const toImg = useCallback(
    (key: string) =>
      key ? <ImgIcon src={discDefIcon(key as any)} size={1.5} /> : undefined,
    []
  )

  return (
    <GeneralAutocomplete
      options={options}
      valueKey={value}
      onChange={(k: string | null) => onChange(k ?? '')}
      toImg={toImg}
      label={t('disc:autocompleteLabels.set')}
    />
  )
}
