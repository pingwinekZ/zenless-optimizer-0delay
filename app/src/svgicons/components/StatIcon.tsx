import type { SvgIconProps } from '@zenless-optimizer/common/svgicons'
import type { AttributeKey } from '../../consts'
import { allAttributeKeys } from '../../consts'
import {
  AnomMasIcon,
  AnomProfIcon,
  AtkIcon,
  CritDmgIcon,
  CritIcon,
  DefIcon,
  EnerRegenIcon,
  HPIcon,
  ImpactIcon,
  PenIcon,
  PenRatioIcon,
  SheerForceIcon,
} from '../icons'
import { ElementIcon } from './ElementIcon'

export function StatIcon({
  statKey,
  iconProps = {},
}: {
  statKey: string
  iconProps?: SvgIconProps
}) {
  switch (statKey) {
    case 'hp':
    case 'hp_':
    case 'hp_base':
    case 'cond_hp':
    case 'cond_hp_':
    case 'initial_hp':
    case 'final_hp':
      return <HPIcon {...iconProps} />
    case 'atk':
    case 'atk_':
    case 'atk_base':
    case 'cond_atk':
    case 'cond_atk_':
    case 'initial_atk':
    case 'final_atk':
      return <AtkIcon {...iconProps} />
    case 'def':
    case 'def_':
    case 'def_base':
    case 'cond_def':
    case 'cond_def_':
    case 'initial_def':
    case 'final_def':
      return <DefIcon {...iconProps} />
    case 'crit_':
      return <CritIcon {...iconProps} />
    case 'crit_dmg_':
      return <CritDmgIcon {...iconProps} />
    case 'enerRegen':
    case 'enerRegen_':
    case 'enerRegen_base':
    case 'cond_enerRegen':
    case 'cond_enerRegen_':
    case 'final_enerRegen':
      return <EnerRegenIcon {...iconProps} />
    case 'anomMas':
    case 'anomMas_':
    case 'anomMas_base':
    case 'cond_anomMas':
    case 'cond_anomMas_':
    case 'final_anomMas':
      return <AnomMasIcon {...iconProps} />
    case 'anomProf':
    case 'anomProf_':
    case 'anomProf_base':
    case 'cond_anomProf':
    case 'cond_anomProf_':
    case 'final_anomProf':
      return <AnomProfIcon {...iconProps} />
    case 'impact':
    case 'impact_':
      return <ImpactIcon {...iconProps} />
    case 'pen':
      return <PenIcon {...iconProps} />
    case 'pen_':
      return <PenRatioIcon {...iconProps} />
    case 'sheerForce':
      return <SheerForceIcon {...iconProps} />
  }

  const ele = statKey.split('_')[0]
  if (allAttributeKeys.includes(ele as AttributeKey))
    return <ElementIcon ele={ele as AttributeKey} iconProps={iconProps} />

  return null
}
