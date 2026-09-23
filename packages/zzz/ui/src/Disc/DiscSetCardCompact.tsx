import { Stack, Text } from '@mantine/core'
import { CardThemed, ImgIcon, SqBadge } from '@zenless-optimizer/common/ui'
import { discDefIcon } from '@zenless-optimizer/zzz/assets'
import type { DiscSlotKey } from '@zenless-optimizer/zzz/consts'
import type { ICachedDisc } from '@zenless-optimizer/zzz/db'
import { useDiscSets } from '@zenless-optimizer/zzz/db-ui'
import { useTranslation } from 'react-i18next'
import { ZCard } from '../Components'
import { COMPACT_CARD_HEIGHT_PX, EmptyCompactCard } from '../util'
import { DiscSetName } from './DiscTrans'

export function DiscSetCardCompact({
  discs,
}: {
  discs: Record<DiscSlotKey, ICachedDisc | undefined>
}) {
  const { t } = useTranslation('disc')
  const sets = useDiscSets(discs)

  return sets && Object.keys(sets).length ? (
    <ZCard
      bgt="dark"
      style={{
        width: '100%',
      }}
    >
      <Stack gap={4} p={4} style={{ height: `${COMPACT_CARD_HEIGHT_PX}px` }}>
        {Object.entries(sets).map(([key, count]) => (
          <CardThemed
            key={key}
            bgt="light"
            style={{
              height: `${(COMPACT_CARD_HEIGHT_PX - 16) / 3}px`,
              display: 'flex',
              padding: '0 4px',
              borderRadius: '12px',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ImgIcon size={2.4} src={discDefIcon(key)} />
            <Text
              key={key}
              style={{
                fontWeight: '900',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1,
              }}
            >
              <DiscSetName setKey={key} />
            </Text>
            <SqBadge
              color="primary"
              style={{
                borderRadius: '12px',
                padding: '5px 10px',
                fontWeight: '900',
              }}
            >
              {count}
            </SqBadge>
          </CardThemed>
        ))}
      </Stack>
    </ZCard>
  ) : (
    <EmptyCompactCard placeholder={t('noActiveSets')} />
  )
}
