import type { FilterConfigs, SortConfigs } from '@zenless-optimizer/common/util'
import type { WengineSortKey } from '../../db'
import { i18n } from '../../i18n'
import { getWengineStat } from '../../stats'
import type { IWengine } from '../../zood'

export function wengineSortConfigs(): SortConfigs<WengineSortKey, IWengine> {
  return {
    level: (we) => we.level * (we.modification + 1),
    rarity: (we) => getWengineStat(we.key).rarity,
    name: (we) => i18n.t(`${we.key}`) as string,
  }
}
export function wengineFilterConfigs(): FilterConfigs<
  'rarity' | 'speciality' | 'name',
  IWengine
> {
  return {
    rarity: (we, filter) => filter.includes(getWengineStat(we.key).rarity),
    speciality: (we, filter) => filter.includes(getWengineStat(we.key).type),
    name: (we, filter) =>
      i18n.t(`${we.key}`).toLowerCase().includes(filter.toLowerCase()),
  }
}

export const wengineSortMap: Partial<Record<WengineSortKey, WengineSortKey[]>> =
  {
    name: ['name'],
    level: ['level', 'rarity', 'name'],
    rarity: ['rarity', 'level', 'name'],
  }
