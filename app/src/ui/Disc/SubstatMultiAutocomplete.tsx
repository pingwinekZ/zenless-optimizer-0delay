import { Badge } from '@mantine/core'
import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { GeneralAutocompleteMulti } from '@zenless-optimizer/common/ui'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DiscSubStatKey } from '../../consts'
import { StatIcon } from '../../svgicons'

export function SubstatMultiAutocomplete<
  SubstatKeyParam extends DiscSubStatKey,
>({
  substatKeys,
  setSubstatKeys,
  totals,
  allSubstatKeys,
}: {
  substatKeys: SubstatKeyParam[]
  setSubstatKeys: (keys: SubstatKeyParam[]) => void
  totals: any
  allSubstatKeys: SubstatKeyParam[]
}) {
  const { t } = useTranslation('disc')
  const { t: tk } = useTranslation('statKey_gen')
  const options = useMemo(
    () =>
      allSubstatKeys.map((key) => ({
        key,
        label: `${tk(key)}${getUnitStr(key)}`,
      })),
    [allSubstatKeys, tk]
  )
  const toImg = useCallback(
    (key: DiscSubStatKey) => (
      <StatIcon statKey={key} iconProps={iconInlineProps} />
    ),
    []
  )
  const toExLabel = useCallback(
    (key: SubstatKeyParam) => <strong>{totals[key]}</strong>,
    [totals]
  )
  const toExItemLabel = useCallback(
    (key: SubstatKeyParam) => <Badge size="sm">{totals[key]}</Badge>,
    [totals]
  )
  return (
    <GeneralAutocompleteMulti
      options={options}
      toImg={toImg}
      toExLabel={toExLabel}
      toExItemLabel={toExItemLabel}
      valueKeys={substatKeys}
      onChange={setSubstatKeys}
      label={t('autocompleteLabels.substats')}
    />
  )
}
