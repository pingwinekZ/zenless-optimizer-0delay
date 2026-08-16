import { Skeleton } from '@mantine/core'
import type { GeneralAutocompleteOption } from '@zenless-optimizer/common/ui'
import { GeneralAutocomplete, ImgIcon } from '@zenless-optimizer/common/ui'
import { Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { wengineAsset } from '../../assets'
import type { WengineKey } from '../../consts'
import { allWengineKeys } from '../../consts'

export function WengineAutocomplete({
  wkey,
  setWKey,
  ...props
}: {
  wkey: WengineKey | ''
  setWKey: (v: WengineKey | '') => void
} & Omit<
  React.ComponentProps<typeof GeneralAutocomplete>,
  'options' | 'valueKey' | 'onChange' | 'toImg' | 'renderInput'
>) {
  const { t } = useTranslation('wengineNames_gen')

  const options: GeneralAutocompleteOption<WengineKey | ''>[] = useMemo(
    () => [
      {
        key: '',
        label: 'Select a Wengine',
      },
      ...allWengineKeys.map(
        (key): GeneralAutocompleteOption<WengineKey | ''> => ({
          key,
          label: t(key),
        })
      ),
    ],
    [t]
  )
  const toImg = useCallback(
    (key: WengineKey | '') =>
      !key ? undefined : (
        <ImgIcon size={2} style={{ width: 'auto' }} src={wengineAsset(key)} />
      ),
    []
  )
  return (
    <Suspense fallback={<Skeleton width={100} />}>
      <GeneralAutocomplete
        size="sm"
        options={options}
        toImg={toImg}
        valueKey={wkey}
        onChange={(k) => setWKey(k ?? '')}
        {...props}
      />
    </Suspense>
  )
}
