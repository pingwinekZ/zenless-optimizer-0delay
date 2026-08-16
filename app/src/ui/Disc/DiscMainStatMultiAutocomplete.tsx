import { Badge } from '@mantine/core'
import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { GeneralAutocompleteMulti } from '@zenless-optimizer/common/ui'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscMainStatKey, StatKey } from '../../consts'
import { allDiscMainStatKeys } from '../../consts'
import { StatIcon } from '../../svgicons'

export function DiscMainStatMultiAutocomplete({
  mainStatKeys,
  setMainStatKeys,
  totals,
}: {
  mainStatKeys: any[]
  setMainStatKeys: (keys: DiscMainStatKey[]) => void
  totals: any
}) {
  const { t } = useTranslation('disc')
  const { t: tk } = useTranslation('statKey_gen')
  const options = useMemo(
    () =>
      allDiscMainStatKeys.map((key) => ({
        key,
        label: `${tk(key)}${getUnitStr(key)}`,
        variant: 'fix variant',
      })),
    [tk]
  )

  const toImg = useCallback(
    (key: StatKey) => <StatIcon statKey={key} iconProps={iconInlineProps} />,
    []
  )
  const toExLabel = useCallback(
    (key: DiscMainStatKey) => <strong>{totals[key]}</strong>,
    [totals]
  )
  const toExItemLabel = useCallback(
    (key: DiscMainStatKey) => <Badge size="sm">{totals[key]}</Badge>,
    [totals]
  )
  return (
    <GeneralAutocompleteMulti
      options={options}
      valueKeys={mainStatKeys}
      onChange={setMainStatKeys}
      toImg={toImg}
      toExLabel={toExLabel}
      toExItemLabel={toExItemLabel}
      label={t('autocompleteLabels.mainStats')}
    />
  )
}
