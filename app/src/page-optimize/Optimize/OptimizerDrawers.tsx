import {
  CardSection,
  Drawer,
  Flex,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { IconBolt, IconTarget } from '@tabler/icons-react'
import { CardThemed } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import type { Team } from '@zenless-optimizer/zzz/db'
import { getTeamFrame0, isComboTarget } from '@zenless-optimizer/zzz/db'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import { useCallback } from 'react'
import { AfterShockToggleButton } from '../AfterShockToggleButton'
import { AppliedBuffStats } from '../AppliedBuffStats'
import { DeadlyAssaultBuffs } from '../DeadlyAssaultBuffs'
import { EnemyStatsSection } from '../EnemyStats'
import { CritModeSelector } from '../OptTargetRow/CritModeSelector'
import { SpecificDmgTypeSelector } from '../OptTargetRow/SpecificDmgTypeSelector'
import { ShiyuDefenseBuffs } from '../ShiyuDefenseBuffs'

/**
 * The three advanced-options drawers on the right edge of the optimizer form
 * (damage configuration, enemy configurations, extra combat buffs). Verbatim
 * move from `OptimizerForm`; the parent owns which drawer is open.
 */
export function OptimizerDrawers({
  activeDrawer,
  onClose,
  characterKey,
  team,
}: {
  /** Open drawer id, or null when all are closed. */
  activeDrawer: string | null
  onClose: () => void
  characterKey: CharacterKey
  team: Team
}) {
  const { database } = useDatabaseContext()
  const { tag: target } = getTeamFrame0(team)
  const isRotation = isComboTarget(target)
  const isAftershock = target?.damageType2 === 'aftershock'
  const setAftershock = useCallback(
    (aftershock: boolean) =>
      database.teams.setFrame0(characterKey, (frame) => {
        const { tag: oldTarget = {} } = frame
        const { damageType2, ...oTarget } = oldTarget
        if (!aftershock) return { tag: oTarget }
        return {
          tag: {
            ...oTarget,
            damageType2: 'aftershock',
          },
        }
      }),
    [database, characterKey]
  )

  return (
    <>
      <Drawer
        opened={activeDrawer === 'damage'}
        onClose={onClose}
        title="Damage Configuration"
        position="right"
        size={400}
      >
        <Flex direction="column" gap="xs">
          {isRotation ? (
            <Text size="sm" c="dimmed">
              Combo targets do not use individual damage configuration options.
            </Text>
          ) : (
            <>
              <CritModeSelector />
              <SpecificDmgTypeSelector />
              {target?.name === 'standardDmgInst' ||
              target?.name === 'sheerDmgInst' ? (
                <AfterShockToggleButton
                  isAftershock={isAftershock}
                  setAftershock={setAftershock}
                />
              ) : null}
            </>
          )}
        </Flex>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'enemy'}
        onClose={onClose}
        title={
          <Flex align="center" gap="xs">
            <IconTarget size={20} />
            <Text>Enemy Configurations</Text>
          </Flex>
        }
        position="right"
        size={500}
        padding="md"
      >
        <ScrollArea style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
          <Stack gap="md">
            <CardThemed bgt="light">
              <CardSection
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Flex align="center" gap="xs" mb={4}>
                  <IconTarget size={18} opacity={0.7} />
                  <Text size="sm" fw={700}>
                    Enemy Stats & Resistances
                  </Text>
                </Flex>
                <Text size="xs" c="dimmed">
                  Configure enemy level, DEF, stun multiplier, elemental
                  resistances, and weaknesses for accurate damage calculations.
                </Text>
              </CardSection>
            </CardThemed>
            <EnemyStatsSection />
          </Stack>
        </ScrollArea>
      </Drawer>

      <Drawer
        opened={activeDrawer === 'buffs'}
        onClose={onClose}
        title={
          <Flex align="center" gap="xs">
            <IconBolt size={20} />
            <Text>Extra Combat Buffs</Text>
          </Flex>
        }
        position="right"
        size={650}
        padding="md"
      >
        <ScrollArea style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
          <Stack gap="md">
            <CardThemed bgt="light">
              <CardSection
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Flex align="center" gap="xs" mb={4}>
                  <IconBolt size={18} opacity={0.7} />
                  <Text size="sm" fw={700}>
                    Combat Buffs Configuration
                  </Text>
                </Flex>
                <Text size="xs" c="dimmed">
                  Configure bonus stats that apply during combat, such as Deadly
                  Assault buffs and Shiyu Defense buffs.
                </Text>
              </CardSection>
            </CardThemed>

            <DeadlyAssaultBuffs />
            <ShiyuDefenseBuffs />
            <AppliedBuffStats />
          </Stack>
        </ScrollArea>
      </Drawer>
    </>
  )
}
