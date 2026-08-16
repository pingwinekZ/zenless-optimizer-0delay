import {
  ActionIcon,
  CardSection,
  Flex,
  MenuItem,
  Stack,
  Text,
} from '@mantine/core'
import { IconCheckbox, IconSquare, IconTrash } from '@tabler/icons-react'
import {
  CardThemed,
  ColorText,
  DropdownButton,
  NumberInputLazy,
} from '@zenless-optimizer/common/ui'
import { isIn } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { allAttributeKeys, type StatKey } from '../consts'
import {
  type BonusStatKey,
  type BonusStatTag,
  bonusStatDamageTypes,
  bonusStatDmgTypeIncStats,
  bonusStatKeys,
  bonusStatQtKeys,
  type EnemyStatKey,
  type EnemyStatsTag,
  enemyStatKeys,
  getTeamFrame0,
  newBonusStatTag,
  newEnemyStatTag,
  type TeamBonusStat,
} from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import type { Attribute, Tag } from '../formula'
import { qtMap, TagDisplay } from '../formula-ui'
import { AttributeName, StatDisplay } from '../ui'
import { AfterShockToggleButton } from './AfterShockToggleButton'
import { DmgTypeDropdown } from './DmgTypeDropdown'

const percentageStats = new Set([
  'atk_',
  'crit_',
  'crit_dmg_',
  'hp_',
  'dmg_',
  'sheer_dmg_',
  'impact_',
  'dazeInc_',
  'anomMas_',
  'stun_',
  'defIgn_',
  'resIgn_',
  'res_',
  'resRed_',
  'unstun_',
  'anomBuildupRes_',
  'dazeRes_',
  'dazeRed_',
  'defRed_',
])

export function AppliedBuffStats() {
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const frame = getTeamFrame0(team)
  const bonusStats: TeamBonusStat[] = frame.bonusStats
  const enemyStats = frame.enemyStats
  const hasAny = bonusStats.length > 0 || enemyStats.length > 0

  const setStat = useCallback(
    (
      tag: BonusStatTag,
      value: number | null,
      isEnabled: boolean,
      index?: number
    ) =>
      database.teams.setFrameBonusStat(
        characterKey,
        0,
        tag,
        value,
        isEnabled,
        index
      ),
    [database.teams, characterKey]
  )

  const setEnemyStat = useCallback(
    (tag: EnemyStatsTag, value: number | null, index?: number) =>
      database.teams.setFrameEnemyStat(characterKey, 0, tag, value, index),
    [database.teams, characterKey]
  )

  const newTarget = (q: BonusStatKey) =>
    database.teams.setFrameBonusStat(
      characterKey,
      0,
      newBonusStatTag(q),
      0,
      true
    )

  const newEnemyTarget = (q: EnemyStatKey) =>
    database.teams.setFrameEnemyStat(characterKey, 0, newEnemyStatTag(q), 0)

  const clearAll = () =>
    database.teams.setFrame0(characterKey, {
      bonusStats: [],
      enemyStats: [],
    })

  return (
    <CardThemed bgt="light">
      <CardSection
        style={{
          padding: 12,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Flex justify="space-between" align="center">
          <Text size="sm" fw={700}>
            Applied Buffs
          </Text>
          {hasAny && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={clearAll}
              title="Clear all applied buffs"
            >
              <IconTrash size={14} />
            </ActionIcon>
          )}
        </Flex>
      </CardSection>
      <CardSection style={{ padding: 12 }}>
        <Stack gap={6}>
          {bonusStats.length > 0 && (
            <>
              <Text size="xs" fw={700} c="dimmed">
                Bonus Stats
              </Text>
              <Stack gap={4}>
                {bonusStats.map(({ tag, value, disabled }, i) => (
                  <BonusStatRow
                    key={JSON.stringify(tag) + i}
                    tag={tag}
                    value={value}
                    disabled={disabled}
                    setValue={(value) => setStat(tag, value, disabled, i)}
                    onDelete={() => setStat(tag, null, disabled, i)}
                    setTag={(tag) => setStat(tag, value, disabled, i)}
                    toggleDisabled={() => setStat(tag, value, !disabled, i)}
                  />
                ))}
              </Stack>
            </>
          )}
          <InitialStatDropdown onSelect={newTarget} />
          <Text size="xs" fw={700} c="dimmed">
            Enemy Stats
          </Text>
          <Stack gap={4}>
            {enemyStats.map(({ tag, value }, i) => (
              <EnemyStatRow
                key={JSON.stringify(tag) + i}
                tag={tag}
                value={value}
                setValue={(value) => setEnemyStat(tag, value, i)}
                onDelete={() => setEnemyStat(tag, null, i)}
                setTag={(tag) => setEnemyStat(tag, value, i)}
              />
            ))}
          </Stack>
          <InitialEnemyStatDropdown onSelect={newEnemyTarget} />
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

function InitialStatDropdown({
  onSelect,
}: {
  onSelect: (key: BonusStatKey) => void
}) {
  return (
    <DropdownButton title="Add Bonus Stat" size="compact-sm" w="auto">
      {bonusStatKeys.map((statKey) => (
        <MenuItem key={statKey} onClick={() => onSelect(statKey)}>
          <StatDisplay statKey={statKey as StatKey} showPercent />
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function BonusStatRow({
  tag,
  setTag,
  value,
  disabled,
  setValue,
  onDelete,
  toggleDisabled,
}: {
  tag: BonusStatTag
  setTag: (tag: BonusStatTag) => void
  value: number
  disabled: boolean
  setValue: (value: number) => void
  onDelete: () => void
  toggleDisabled: () => void
}) {
  return (
    <CardThemed bgt="light" style={{ opacity: disabled ? 0.4 : undefined }}>
      <CardSection style={{ padding: '6px 8px' }}>
        <Stack gap={6}>
          <Flex gap={6} align="center">
            <ActionIcon
              onClick={toggleDisabled}
              size="sm"
              style={{ flex: 'none' }}
            >
              {disabled ? <IconSquare size={14} /> : <IconCheckbox size={14} />}
            </ActionIcon>
            <Text
              size="sm"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              <TagDisplay tag={tag} />
            </Text>
            <ActionIcon
              aria-label="Delete Bonus Stat"
              onClick={onDelete}
              size="sm"
              style={{ flex: 'none' }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Flex>
          <Flex gap={4} align="center" wrap="wrap">
            <QtDropdown qt={tag.qt} setQt={(qt) => setTag({ ...tag, qt })} />
            {['dmg_', 'sheer_dmg_', 'resIgn_'].includes(tag.q) && (
              <AttributeDropdown
                tag={tag}
                setAttribute={(ele) => {
                  const { attribute, ...rest } = tag
                  setTag(ele ? { ...rest, attribute: ele } : rest)
                }}
              />
            )}
            {bonusStatDmgTypeIncStats.includes(
              tag.q as (typeof bonusStatDmgTypeIncStats)[number]
            ) && (
              <DmgTypeDropdown
                dmgType={tag.damageType1}
                keys={bonusStatDamageTypes}
                setDmgType={(dmgType) => {
                  const { damageType1, ...rest } = tag
                  setTag(dmgType ? { ...rest, damageType1: dmgType } : rest)
                }}
              />
            )}
            {(['dmg_', 'crit_dmg_'] as const).includes(
              tag.q as 'dmg_' | 'crit_dmg_'
            ) && (
              <AfterShockToggleButton
                isAftershock={tag.damageType2 === 'aftershock'}
                setAftershock={(aftershock) => {
                  const { damageType2, ...rest } = tag
                  setTag(
                    aftershock ? { ...rest, damageType2: 'aftershock' } : rest
                  )
                }}
              />
            )}
            <NumberInputLazy
              float
              value={value}
              w={70}
              onChange={setValue}
              placeholder="Val"
              size="sm"
              style={{ flex: 'none' }}
              suffix={percentageStats.has(tag.q) ? '%' : undefined}
            />
          </Flex>
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

function AttributeDropdown({
  tag,
  setAttribute,
}: {
  tag: BonusStatTag
  setAttribute: (ele: Attribute | null) => void
}) {
  return (
    <DropdownButton
      title={
        tag.attribute ? (
          <AttributeName attribute={tag.attribute} />
        ) : (
          'No Attribute'
        )
      }
      color={tag.attribute!}
      size="compact-sm"
    >
      <MenuItem onClick={() => setAttribute(null)}>No Attribute</MenuItem>
      {allAttributeKeys.map((attr) => (
        <MenuItem key={attr} onClick={() => setAttribute(attr)}>
          <ColorText color={attr}>
            <AttributeName attribute={attr} />
          </ColorText>
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function QtDropdown({
  qt,
  setQt,
}: {
  qt: Tag['qt']
  setQt: (ele: (typeof bonusStatQtKeys)[number]) => void
}) {
  return (
    <DropdownButton
      title={(qt && qtMap[qt as keyof typeof qtMap]) ?? qt}
      size="compact-sm"
    >
      {bonusStatQtKeys.map((q) => (
        <MenuItem
          key={q}
          onClick={() => setQt(q)}
          style={
            qt === q
              ? { backgroundColor: 'var(--mantine-color-blue-light)' }
              : undefined
          }
          disabled={qt === q}
        >
          {qtMap[q]}
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function InitialEnemyStatDropdown({
  onSelect,
}: {
  onSelect: (key: EnemyStatKey) => void
}) {
  return (
    <DropdownButton title="Add Enemy Stat" size="compact-sm" w="auto">
      {enemyStatKeys.map((statKey) => (
        <MenuItem key={statKey} onClick={() => onSelect(statKey)}>
          <TagDisplay
            tag={{ q: statKey, qt: 'common', et: 'enemy', sheet: 'agg' }}
            showPercent
          />
        </MenuItem>
      ))}
    </DropdownButton>
  )
}

function EnemyStatRow({
  tag,
  setTag,
  value,
  setValue,
  onDelete,
}: {
  tag: EnemyStatsTag
  setTag: (tag: EnemyStatsTag) => void
  value: number
  setValue: (value: number) => void
  onDelete: () => void
}) {
  return (
    <CardThemed bgt="light">
      <CardSection style={{ padding: '6px 8px' }}>
        <Stack gap={6}>
          <Flex gap={6} align="center">
            <Text
              size="sm"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              <TagDisplay tag={tag} />
            </Text>
            <ActionIcon
              aria-label="Delete Enemy Stat"
              onClick={onDelete}
              size="sm"
              style={{ flex: 'none' }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Flex>
          <Flex gap={4} align="center" wrap="wrap">
            {isIn(['res_', 'resRed_'] as const, tag.q) && (
              <EnemyAttributeDropdown
                tag={tag}
                setAttribute={(ele) => {
                  const { attribute, ...rest } = tag
                  setTag(ele ? { ...rest, attribute: ele } : rest)
                }}
              />
            )}
            <NumberInputLazy
              float
              value={value}
              w={70}
              onChange={setValue}
              placeholder="Val"
              size="sm"
              style={{ flex: 'none' }}
              suffix={percentageStats.has(tag.q) ? '%' : undefined}
            />
          </Flex>
        </Stack>
      </CardSection>
    </CardThemed>
  )
}

function EnemyAttributeDropdown({
  tag,
  setAttribute,
}: {
  tag: EnemyStatsTag
  setAttribute: (ele: Attribute | null) => void
}) {
  return (
    <DropdownButton
      title={
        tag.attribute ? (
          <AttributeName attribute={tag.attribute} />
        ) : (
          'No Attribute'
        )
      }
      color={tag.attribute!}
      size="compact-sm"
    >
      <MenuItem onClick={() => setAttribute(null)}>No Attribute</MenuItem>
      {allAttributeKeys.map((attr) => (
        <MenuItem key={attr} onClick={() => setAttribute(attr)}>
          <ColorText color={attr}>
            <AttributeName attribute={attr} />
          </ColorText>
        </MenuItem>
      ))}
    </DropdownButton>
  )
}
