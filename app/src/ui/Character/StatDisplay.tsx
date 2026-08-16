import { iconInlineProps } from '@zenless-optimizer/common/svgicons'
import { getUnitStr } from '@zenless-optimizer/common/util'
import { type StatKey, statKeyTextMap } from '../../consts'
import { StatIcon } from '../../svgicons'

export function StatDisplay({
  statKey,
  showPercent = false,
  disableIcon = false,
}: {
  statKey: StatKey
  showPercent?: boolean
  disableIcon?: boolean
}) {
  // const { t: tk } = useTranslation('statKey_gen')
  const text = (
    <span>
      {statKeyTextMap[statKey] ?? statKey}
      {/* TODO: translation {tk(statKey)} */}
      {showPercent && getUnitStr(statKey)}
    </span>
  )
  if (disableIcon) return text
  return (
    <span>
      {!disableIcon && (
        <StatIcon statKey={statKey} iconProps={iconInlineProps} />
      )}{' '}
      {text}
    </span>
  )
}
