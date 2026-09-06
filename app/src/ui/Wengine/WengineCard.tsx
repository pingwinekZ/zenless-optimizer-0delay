import {
  ActionIcon,
  Box,
  Card,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconEdit } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import {
  CardThemed,
  ConditionalWrapper,
  ImgIcon,
} from '@zenless-optimizer/common/ui'
import type { ReactNode } from 'react'
import React, { memo, Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { WenginePhaseKey } from '../../assets'
import { specialityDefIcon, wengineAsset, wenginePhaseIcon } from '../../assets'
import type { PhaseKey } from '../../consts'
import { useWengine } from '../../db-ui'
import { getWengineStat, getWengineStats } from '../../stats'
import type { IWengine } from '../../zood'
import { StatDisplay } from '../Character'

import { ZCard } from '../Components'
import { WengineSubstatDisplay } from './WengineSubstatDisplay'
import { WengineName } from './WengineTrans'

const wenginePhaseIconsMap: Record<PhaseKey, WenginePhaseKey> = {
  1: 'p1',
  2: 'p2',
  3: 'p3',
  4: 'p4',
  5: 'p5',
}
export const WengineCard = memo(function WengineCard({
  wengineId,
  onEdit,
  onClick,
}: {
  key: string
  wengineId: string
  onEdit?: (id: string) => void
  onClick?: () => void
}) {
  const wengine = useWengine(wengineId)
  const onEditCB = useCallback(
    () => onEdit && onEdit(wengineId),
    [wengineId, onEdit]
  )
  if (!wengine) return null
  return (
    <WengineCardObj wengine={wengine} onEdit={onEditCB} onClick={onClick} />
  )
})
export function WengineCardObj({
  wengine,
  onClick,
  onEdit,
  extraButtons,
}: {
  wengine: IWengine
  onClick?: () => void
  onEdit?: () => void
  extraButtons?: React.JSX.Element
}) {
  const { t } = useTranslation('ui')
  const [show, onShow] = useBoolState()
  const wrapperFunc = useCallback(
    (children: ReactNode) => (
      <Box onClick={() => onClick?.()} style={{ cursor: 'pointer' }}>
        {children}
      </Box>
    ),
    [onClick]
  )
  const falseWrapperFunc = useCallback(
    (children: ReactNode) => <Box>{children}</Box>,
    []
  )
  const { key, level = 0, phase = 1, modification = 0 } = wengine
  if (!key)
    return (
      <CardThemed>
        <Text c="red">Error: Wengine not found</Text>
      </CardThemed>
    )
  const wengineStat = getWengineStat(key)
  const wengineStats = getWengineStats(key, level, phase, modification)
  const baseStatKey = wengineStat.baseStatkey
  const baseStat = baseStatKey === 'def_base' ? 'def' : 'atk'

  return (
    <Suspense fallback={<Skeleton width="100%" height={350} />}>
      <ZCard
        bgt="dark"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <ConditionalWrapper
          condition={!!onClick}
          wrapper={wrapperFunc}
          falseWrapper={falseWrapperFunc}
        >
          <Card.Section>
            <CardThemed bgt="light" style={{ borderRadius: '11px' }}>
              <Card.Section
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 16,
                }}
              >
                <Box onClick={onShow} style={{ cursor: 'pointer' }}>
                  <Tooltip
                    label={
                      <Box>
                        <Text>Description</Text>
                      </Box>
                    }
                    opened={show}
                    withinPortal={false}
                  >
                    <Text
                      style={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        maxWidth: '100%',
                        width: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ImgIcon
                        size={2}
                        src={specialityDefIcon(wengineStat.type)}
                      />{' '}
                      <WengineName wKey={key} />
                    </Text>
                  </Tooltip>
                </Box>
                <Box component="div">
                  <Box
                    component="img"
                    alt="Wengine Image"
                    src={wengineAsset(key)}
                    style={{
                      width: 'auto',
                      float: 'right',
                      height: '150px',
                    }}
                  />
                </Box>
                <Box
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    alignItems: 'center',
                  }}
                >
                  <Text fw="bold">Lv.{level}</Text>
                  <Box>
                    <ImgIcon
                      size={3}
                      src={wenginePhaseIcon(wenginePhaseIconsMap[phase])}
                      style={{ paddingTop: '10px', margin: 0, width: '5em' }}
                    />{' '}
                  </Box>
                </Box>
              </Card.Section>
            </CardThemed>
            <Stack gap={4} p="md">
              <Box
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    fontWeight: 'bold',
                  }}
                >
                  <StatDisplay statKey={baseStat} />
                </Text>
                <Text fw="bold">{wengineStats[baseStatKey].toFixed()}</Text>
              </Box>
              <WengineSubstatDisplay
                substatKey={wengineStat['second_statkey']}
                substatValue={wengineStats[wengineStat['second_statkey']]}
              />
            </Stack>
          </Card.Section>
        </ConditionalWrapper>

        <Box style={{ flexGrow: 1 }} />
        <Box
          style={{
            padding: 8,
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box style={{ flexGrow: 1 }} />
          <Box
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'stretch',
              height: '100%',
            }}
          >
            {!!onEdit && (
              <Tooltip label={t('edit')}>
                <ActionIcon color="blue" size="sm" onClick={() => onEdit()}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {extraButtons}
          </Box>
        </Box>
      </ZCard>
    </Suspense>
  )
}
