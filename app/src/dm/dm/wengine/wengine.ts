import { isPercentStat } from '@zenless-optimizer/common/util'
import type {
  SpecialityKey,
  WengineKey,
  WengineRarityKey,
} from '../../../consts'
import { readNanokaJSON } from '../../util'
import {
  specialityMap,
  subStatMap,
  WengineIdMap,
  wengineRarityMap,
} from './consts'

const SCALING = 10000

export const baseStatMap = {
  'Base ATK': 'atk_base',
  'Base DEF': 'def_base',
} as const
export type WengineBaseStatKey = (typeof baseStatMap)[keyof typeof baseStatMap]

type WengineRawData = {
  Rarity: number
  WeaponType: Record<string, string>
  Name: string
  Desc: string
  Desc2: string
  Desc3: string
  Icon: string
  BaseProperty: {
    Name: keyof typeof baseStatMap
    Name2: keyof typeof baseStatMap
    Format: '{0:0.#}'
    Value: 40
  }
  RandProperty: {
    Name: 'ATK'
    Name2: 'Percent ATK'
    Format: '{0:0.#%}'
    Value: 1000
  }
  Talents: Record<'1' | '2' | '3' | '4' | '5', { Name: string; Desc: string }>
}
export type WengineData = {
  name: string
  rarity: WengineRarityKey
  type: SpecialityKey
  baseStatkey: WengineBaseStatKey
  baseStatvalue: number
  second_statkey: (typeof subStatMap)[keyof typeof subStatMap]
  second_statvalue: number
  icon: string
  desc: string
  desc2: string
  desc3: string
  phase: PhaseData[]
}
type PhaseData = {
  name: string
  desc: string
}
export const wengineDetailedJSONData = Object.fromEntries(
  Object.entries(WengineIdMap).map(([id, name]) => {
    const raw = JSON.parse(
      readNanokaJSON(`weapon/${id}.json`)
    ) as WengineRawData
    const second_statkey = subStatMap[raw.RandProperty.Name2]
    const data: WengineData = {
      name: raw.Name,
      rarity: wengineRarityMap[raw.Rarity],
      type: specialityMap[Object.keys(raw.WeaponType)[0] as any],
      baseStatkey: baseStatMap[raw.BaseProperty.Name],
      baseStatvalue: raw.BaseProperty.Value,
      second_statkey,
      second_statvalue:
        raw.RandProperty.Value / (isPercentStat(second_statkey) ? SCALING : 1),
      icon: raw.Icon,
      desc: raw.Desc,
      desc2: raw.Desc2,
      desc3: raw.Desc3,
      phase: Object.values(raw.Talents).map(({ Name, Desc }) => ({
        name: Name,
        desc: Desc,
      })),
    }
    return [name, data] as const
  })
) as Record<WengineKey, WengineData>
