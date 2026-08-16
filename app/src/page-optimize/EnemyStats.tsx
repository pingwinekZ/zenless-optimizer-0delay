import {
  ActionIcon,
  Box,
  Button,
  CardSection,
  MenuItem,
  Stack,
  Switch,
  Text,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import {
  CardThemed,
  ColorText,
  DropdownButton,
  NumberInputLazy,
} from '@zenless-optimizer/common/ui'
import { isIn } from '@zenless-optimizer/common/util'
import { useCallback } from 'react'
import { allAttributeAnomalyKeys } from '../consts'
import type { EnemyStatKey, EnemyStatsTag } from '../db'
import { enemyStatKeys, getTeamFrame0, newEnemyStatTag } from '../db'
import { useCharacterContext, useDatabaseContext, useTeam } from '../db-ui'
import { type Attribute, type Tag } from '../formula'
import { TagDisplay } from '../formula-ui'
import { AttributeName } from '../ui'

export function EnemyStatsSection() {
  const { database } = useDatabaseContext()
  const { key: characterKey } = useCharacterContext()!
  const team = useTeam(characterKey)!
  const { enemyLvl, enemyDef, enemyStunMultiplier } = team
  const frame0 = getTeamFrame0(team)
  const { enemyStats } = frame0
  const frameIndex = 0

  const isStunnedCond = frame0.conditionals?.find(
    (c) =>
      c.sheet === 'enemy' &&
      c.condKey === 'isStunned' &&
      c.src === characterKey &&
      c.dst === null
  )
  const enemyStunned = isStunnedCond?.condValue ?? 1

  const setStunned = useCallback(
    (value: boolean) =>
      database.teams.setFrameConditional(
        characterKey,
        frameIndex,
        'enemy',
        'isStunned',
        characterKey,
        null,
        value ? 1 : 0
      ),
    [database, characterKey]
  )
  const setStat = useCallback(
    (tag: EnemyStatsTag, value: number | null, index?: number) =>
      database.teams.setFrameEnemyStat(
        characterKey,
        frameIndex,
        tag,
        value,
        index
      ),
    [database, characterKey]
  )
  const newTarget = (q: EnemyStatKey) =>
    database.teams.setFrameEnemyStat(
      characterKey,
      frameIndex,
      newEnemyStatTag(q),
      0
    )

  return (
    <Stack gap="sm">
      <CardThemed bgt="light">
        <CardSection style={{ padding: 8 }}>
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              Enemy State
            </Text>
            <Switch
              label="Enemy is Stunned"
              checked={enemyStunned > 0}
              onChange={(e) => setStunned(e.currentTarget.checked)}
              size="xs"
            />
          </Stack>
        </CardSection>
      </CardThemed>

      <CardThemed bgt="light">
        <CardSection style={{ padding: 8 }}>
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              Enemy Base Stats
            </Text>
            <Box style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <NumberInputLazy
                label="Enemy Lvl"
                value={enemyLvl}
                onChange={(v) =>
                  database.teams.set(characterKey, { enemyLvl: v })
                }
              />
              <NumberInputLazy
                label="Enemy DEF"
                value={enemyDef}
                onChange={(v) =>
                  database.teams.set(characterKey, { enemyDef: v })
                }
              />
              <NumberInputLazy
                label="Enemy Stun Multiplier"
                value={enemyStunMultiplier}
                onChange={(v) =>
                  database.teams.set(characterKey, { enemyStunMultiplier: v })
                }
              />
            </Box>
          </Stack>
        </CardSection>
      </CardThemed>

      <CardThemed bgt="light">
        <CardSection style={{ padding: 8 }}>
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              Elemental Resistances & Weaknesses
            </Text>
            <Box
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Text
                size="sm"
                fw={700}
                style={{ minWidth: '4em', color: 'var(--mantine-color-red-4)' }}
              >
                Resists
              </Text>
              {/* Enemies can't be weak/resist lumiflux - exclude */}
              {allAttributeAnomalyKeys.map((attr) => {
                const isActive = enemyStats.some(
                  (s) =>
                    s.tag.q === 'res_' &&
                    s.tag.attribute === attr &&
                    s.value > 0
                )
                return (
                  <Button
                    key={attr}
                    size="compact-sm"
                    variant={isActive ? 'filled' : 'outline'}
                    color={isActive ? 'red.5' : 'gray'}
                    onClick={() => {
                      const existing = enemyStats.findIndex(
                        (s) => s.tag.q === 'res_' && s.tag.attribute === attr
                      )
                      if (existing !== -1 && enemyStats[existing].value > 0)
                        setStat({ q: 'res_', attribute: attr }, null, existing)
                      else setStat({ q: 'res_', attribute: attr }, 40)
                    }}
                  >
                    {isActive ? (
                      <AttributeName attribute={attr} />
                    ) : (
                      <ColorText color={attr}>
                        <AttributeName attribute={attr} />
                      </ColorText>
                    )}
                  </Button>
                )
              })}
            </Box>
            <Box
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Text
                size="sm"
                fw={700}
                style={{
                  minWidth: '4em',
                  color: 'var(--mantine-color-teal-3)',
                }}
              >
                Weak
              </Text>
              {/* Enemies can't be weak/resist lumiflux - exclude */}
              {allAttributeAnomalyKeys.map((attr) => {
                const isActive = enemyStats.some(
                  (s) =>
                    s.tag.q === 'res_' &&
                    s.tag.attribute === attr &&
                    s.value < 0
                )
                return (
                  <Button
                    key={attr}
                    size="compact-sm"
                    variant={isActive ? 'filled' : 'outline'}
                    color={isActive ? 'teal.4' : 'gray'}
                    onClick={() => {
                      const existing = enemyStats.findIndex(
                        (s) => s.tag.q === 'res_' && s.tag.attribute === attr
                      )
                      if (existing !== -1 && enemyStats[existing].value < 0)
                        setStat({ q: 'res_', attribute: attr }, null, existing)
                      else setStat({ q: 'res_', attribute: attr }, -20)
                    }}
                  >
                    {isActive ? (
                      <AttributeName attribute={attr} />
                    ) : (
                      <ColorText color={attr}>
                        <AttributeName attribute={attr} />
                      </ColorText>
                    )}
                  </Button>
                )
              })}
            </Box>
          </Stack>
        </CardSection>
      </CardThemed>

      {enemyStats.length > 0 && (
        <CardThemed bgt="light">
          <CardSection style={{ padding: 8 }}>
            <Stack gap="xs">
              <Text size="sm" fw={700}>
                Custom Enemy Stats
              </Text>
              {enemyStats.map(({ tag, value }, i) => (
                <EnemyStatDisplay
                  key={JSON.stringify(tag) + i}
                  tag={tag}
                  value={value}
                  setValue={(value) => setStat(tag, value, i)}
                  onDelete={() => setStat(tag, null, i)}
                  setTag={(tag) => setStat(tag, value, i)}
                />
              ))}
              <InitialStatDropdown onSelect={newTarget} />
            </Stack>
          </CardSection>
        </CardThemed>
      )}
      {enemyStats.length === 0 && <InitialStatDropdown onSelect={newTarget} />}
    </Stack>
  )
}

function InitialStatDropdown({
  tag,
  onSelect,
}: {
  tag?: Tag
  onSelect: (key: EnemyStatKey) => void
}) {
  return (
    <DropdownButton
      size="compact-sm"
      w="auto"
      title={
        (tag && (
          <TagDisplay
            tag={{ ...tag, qt: 'common', et: 'enemy', sheet: 'agg' }}
          />
        )) ??
        'Add Enemy Stat'
      }
    >
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

function EnemyStatDisplay({
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
      <CardSection
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '8px 12px',
        }}
      >
        <Text>
          <TagDisplay tag={tag} />
        </Text>
        {isIn(['res_', 'resRed_'] as const, tag.q) && (
          <AttributeDropdown
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
          style={{ flexBasis: 100, height: '100%' }}
          onChange={setValue}
          placeholder="Stat Value"
          size="sm"
        />
        <ActionIcon aria-label="Delete Enemy Stat" onClick={onDelete}>
          <IconTrash size={16} />
        </ActionIcon>
      </CardSection>
    </CardThemed>
  )
}

function AttributeDropdown({
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
    >
      <MenuItem onClick={() => setAttribute(null)}>No Attribute</MenuItem>
      {/* Enemies can't be weak/resist lumiflux - exclude */}
      {allAttributeAnomalyKeys.map((attr) => (
        <MenuItem key={attr} onClick={() => setAttribute(attr)}>
          <ColorText color={attr}>
            <AttributeName attribute={attr} />
          </ColorText>
        </MenuItem>
      ))}
    </DropdownButton>
  )
}
