import { Badge, Skeleton } from '@mantine/core'
import type { GeneralAutocompleteOption } from '@zenless-optimizer/common/ui'
import { GeneralAutocompleteMulti } from '@zenless-optimizer/common/ui'
import { Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { allLocationKeys, type LocationKey } from '../../consts'
import { useDatabaseContext } from '../../db-ui'
import { CharIconCircle } from './CharIconCircleElement'

const toImg = (key: LocationKey) =>
  key ? <CharIconCircle characterKey={key} /> : undefined

export function LocationFilterMultiAutocomplete({
  locations,
  setLocations,
  totals,
  disabled,
}: {
  locations: LocationKey[]
  setLocations: (v: LocationKey[]) => void
  totals: Record<LocationKey, string>
  disabled?: boolean
}) {
  const { t } = useTranslation(['disc', 'charNames_gen'])
  const { database } = useDatabaseContext()

  const toExLabel = useCallback(
    (key: LocationKey) => <strong>{totals[key]}</strong>,
    [totals]
  )
  const toExItemLabel = useCallback(
    (key: LocationKey) => <Badge size="sm">{totals[key]}</Badge>,
    [totals]
  )

  const values = useMemo(
    () =>
      allLocationKeys
        .filter((key) => database.chars.get(key))
        .map(
          (v): GeneralAutocompleteOption<LocationKey> => ({
            key: v,
            label: t(v),
            favorite: false,
            alternateNames: [v],
          })
        )
        .sort((a, b) => {
          if (a.favorite && !b.favorite) return -1
          if (!a.favorite && b.favorite) return 1
          return a.label.localeCompare(b.label)
        }),
    [database.chars, t]
  )

  return (
    <Suspense fallback={<Skeleton width={100} height={20} />}>
      <GeneralAutocompleteMulti
        disabled={disabled}
        options={values}
        valueKeys={locations}
        onChange={(k) => setLocations(k)}
        toImg={toImg}
        toExLabel={toExLabel}
        toExItemLabel={toExItemLabel}
        label={t('disc:filterLocation.location')}
      />
    </Suspense>
  )
}
