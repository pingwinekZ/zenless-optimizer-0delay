import {
  Divider,
  Drawer,
  Flex,
  HoverCard,
  Select,
  Switch,
  Text,
} from '@mantine/core'
import type { IConditionalData } from '@zenless-optimizer/game-opt/engine'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { discDefIcon } from '../../assets'
import { allDiscSetKeys, discSetNames } from '../../consts'
import { useCharacterContext, useDatabaseContext, useTeam } from '../../db-ui'
import { conditionals } from '../../formula'
import { i18n, Translate } from '../../i18n'

const conditionalIconWidth = 32
const conditionalNameWidth = 255
const conditionalInputWidth = 100
const defaultGap = 5
const columnGap = 6

export function FormSetConditionals({
  show,
  onClose,
}: {
  show: boolean
  onClose: () => void
}) {
  const [hasOpened, setHasOpened] = useState(false)
  if (show && !hasOpened) setHasOpened(true)

  return (
    <Drawer
      opened={show}
      onClose={onClose}
      title="Conditional set effects"
      position="right"
      size={550}
      keepMounted
    >
      {hasOpened && <FormSetConditionalsContent />}
    </Drawer>
  )
}

function FormSetConditionalsContent() {
  useEffect(() => {
    i18n.loadNamespaces(allDiscSetKeys.map((key) => `disc_${key}_gen`))
  }, [])

  const discOptions = useMemo(
    () =>
      allDiscSetKeys.map((key) => {
        const sheetConditionals = (conditionals as Record<string, unknown>)[
          key
        ] as Record<string, IConditionalData> | undefined
        if (!sheetConditionals) return null
        const entries = Object.entries(sheetConditionals)
        if (entries.length === 0) return null
        return (
          <DiscSetConditionalRow key={key} sheet={key} condEntries={entries} />
        )
      }),
    []
  )

  return (
    <Flex direction="column" gap={columnGap}>
      <Flex gap={defaultGap} align="center">
        <div style={{ width: conditionalIconWidth }} />
        <div style={{ width: conditionalNameWidth }} />
        <Flex style={{ flex: 1 }} justify="flex-end">
          <Text size="xs" c="dimmed">
            Effect
          </Text>
        </Flex>
      </Flex>
      <Divider />
      {discOptions}
    </Flex>
  )
}

function DiscSetConditionalRow({
  sheet,
  condEntries,
}: {
  sheet: string
  condEntries: [string, IConditionalData][]
}) {
  const character = useCharacterContext()!
  const team = useTeam(character.key)

  const currentValues = useMemo(() => {
    const vals: Record<string, number> = {}
    for (const [condName, condData] of condEntries) {
      const currentCond = team?.frames[0]?.conditionals?.find(
        (c) => c.sheet === sheet && c.condKey === condName
      )
      const defaultVal =
        condData.type === 'bool'
          ? 1
          : condData.type === 'num'
            ? (condData.max ?? 10)
            : 0
      vals[condName] = currentCond?.condValue ?? defaultVal
    }
    return vals
  }, [team, sheet, condEntries])

  return (
    <HoverCard
      width={400}
      position="left"
      withArrow
      openDelay={300}
      closeDelay={200}
    >
      <HoverCard.Target>
        <Flex gap={defaultGap} align="center" style={{ cursor: 'default' }}>
          <div style={{ width: conditionalIconWidth, marginRight: 5 }}>
            <img
              src={discDefIcon(sheet as any)}
              style={{
                width: conditionalIconWidth,
                height: conditionalIconWidth,
                display: 'block',
              }}
              alt=""
            />
          </div>
          <div
            style={{
              width: conditionalNameWidth,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {discSetNames[sheet as keyof typeof discSetNames] ?? sheet}
          </div>
          <Flex
            style={{ flex: 1 }}
            gap={defaultGap}
            justify="flex-end"
            wrap="wrap"
          >
            {condEntries.map(([condName, condData]) => (
              <ConditionalInput
                key={condName}
                sheet={sheet}
                condName={condName}
                condData={condData}
                currentValue={currentValues[condName]}
              />
            ))}
          </Flex>
        </Flex>
      </HoverCard.Target>
      <HoverCard.Dropdown style={{ fontSize: 13 }}>
        <Text fw={600} mb={4} size="sm">
          {discSetNames[sheet as keyof typeof discSetNames] ?? sheet}
        </Text>
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>
          Set description
        </Text>
        <Suspense fallback={null}>
          <DiscSetDesc sheet={sheet} />
        </Suspense>
      </HoverCard.Dropdown>
    </HoverCard>
  )
}

function DiscSetDesc({ sheet }: { sheet: string }) {
  return (
    <>
      <Text size="xs" fw={500} mb={2}>
        2-Piece
      </Text>
      <Text size="xs" c="dimmed" mb={4}>
        <Translate ns={`disc_${sheet}_gen`} key18="desc2" />
      </Text>
      <Text size="xs" fw={500} mb={2}>
        4-Piece
      </Text>
      <Text size="xs" c="dimmed" mb={4}>
        <Translate ns={`disc_${sheet}_gen`} key18="desc4" />
      </Text>
    </>
  )
}

function ConditionalInput({
  sheet,
  condName,
  condData,
  currentValue: propCurrentValue,
}: {
  sheet: string
  condName: string
  condData: IConditionalData
  currentValue: number
}) {
  const character = useCharacterContext()!
  const { database } = useDatabaseContext()
  const currentValue = propCurrentValue

  const setValue = (condValue: number) => {
    database.teams.setFrameConditional(
      character.key,
      0,
      sheet as any,
      condName,
      character.key as any,
      null,
      condValue
    )
  }

  if (condData.type === 'bool') {
    return (
      <Switch
        checked={currentValue > 0}
        onChange={(e) => setValue(e.currentTarget.checked ? 1 : 0)}
        size="xs"
        style={{ width: conditionalInputWidth }}
      />
    )
  }

  if (condData.type === 'num') {
    const min = condData.min ?? 0
    const max = condData.max ?? 10
    const options = Array.from({ length: max - min + 1 }, (_, i) => ({
      label: String(min + i),
      value: String(min + i),
    }))
    return (
      <Select
        data={options}
        value={String(currentValue)}
        onChange={(v) => setValue(v != null ? Number(v) : 0)}
        size="xs"
        style={{ width: conditionalInputWidth }}
        comboboxProps={{ keepMounted: false, width: 160 }}
      />
    )
  }

  return null
}
