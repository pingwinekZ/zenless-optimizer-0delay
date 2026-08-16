import { Badge, Box, Text } from '@mantine/core'
import { GeneralAutocompleteMulti, ImgIcon } from '@zenless-optimizer/common/ui'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { discDefIcon } from '../../assets'
import type { DiscRarityKey, DiscSetKey } from '../../consts'
import { allDiscRarityKeys } from '../../consts'
import { setKeysByRarities } from '../../util'

export function DiscSetMultiAutocomplete({
  allowRarities = [...allDiscRarityKeys],
  discSetKeys,
  setDiscSetKeys,
  totals,
}: {
  allowRarities?: DiscRarityKey[]
  discSetKeys: DiscSetKey[]
  setDiscSetKeys: (keys: DiscSetKey[]) => void
  totals: Record<DiscSetKey, string>
}) {
  const { t } = useTranslation(['disc', 'discNames_gen'])

  const toImg = useCallback(
    (key: DiscSetKey | '') =>
      key ? <ImgIcon src={discDefIcon(key)} size={2} /> : undefined,
    []
  )
  const toExLabel = useCallback(
    (key: DiscSetKey) => <strong>{totals[key]}</strong>,
    [totals]
  )
  const toExItemLabel = useCallback(
    (key: DiscSetKey) => <Badge size="sm">{totals[key]}</Badge>,
    [totals]
  )

  const allDiscSetsAndRarities = useMemo(
    () =>
      Object.entries(setKeysByRarities)
        .flatMap(([rarity, sets]) => {
          return sets.map((set) => ({
            key: set,
            grouper: rarity as DiscRarityKey,
            label: t(`discNames_gen:${set}`),
          }))
        })
        .filter((group) => allowRarities.includes(group.grouper))
        .sort(),
    [allowRarities, t]
  )

  return (
    <GeneralAutocompleteMulti
      options={allDiscSetsAndRarities}
      valueKeys={discSetKeys}
      label={t('disc:autocompleteLabels.sets')}
      toImg={toImg}
      toExLabel={toExLabel}
      toExItemLabel={toExItemLabel}
      onChange={setDiscSetKeys}
      groupBy={(option) => option.grouper?.toString() ?? ''}
      renderGroup={(params: { group: string; children: React.ReactNode }) =>
        params.group ? (
          <Box key={params.group}>
            <Text
              style={{
                position: 'sticky',
                top: '-1em',
                fontWeight: 700,
                padding: '4px 8px',
                fontSize: '0.75rem',
              }}
            >
              {params.group}
            </Text>
            {params.children}
          </Box>
        ) : null
      }
    />
  )
}
