import type { FilterConfigs, SortConfigs } from '@zenless-optimizer/common/util'
import {
  type AttributeKey,
  allAttributeKeys,
  allCharacterRarityKeys,
  allSpecialityKeys,
  type CharacterKey,
  type CharacterRarityKey,
  type SpecialityKey,
} from '../../consts'
import type { ZzzDatabase } from '../../db'
import { i18n } from '../../i18n'
import { getCharStat } from '../../stats'
import { calculateCharacterScore } from '../../util'
export const characterSortKeys = [
  'new',
  'level',
  'rarity',
  'name',
  'custom',
  'score',
] as const
export type CharacterSortKey = (typeof characterSortKeys)[number]

export function characterSortConfigs(
  database: ZzzDatabase
): SortConfigs<CharacterSortKey, CharacterKey> {
  return {
    new: (ck) => (database.chars.get(ck as CharacterKey) ? 0 : 1),
    name: (ck) => i18n.t(ck).toString(),
    level: (ck) => {
      const char = database.chars.get(ck as CharacterKey)
      return char ? char.level * (char.promotion + 1) : 0
    },
    rarity: (ck) => getCharStat(ck).rarity ?? 0,
    custom: (ck) => {
      const order = database.displayCharacter.get()?.customSortOrder
      if (!order) return 0
      const idx = order.indexOf(ck as CharacterKey)
      return idx === -1 ? -9999 : -idx
    },
    score: (ck) => {
      const char = database.chars.get(ck as CharacterKey)
      if (!char) return 0
      const discSlots = [
        char.equippedDiscs['1'],
        char.equippedDiscs['2'],
        char.equippedDiscs['3'],
        char.equippedDiscs['4'],
        char.equippedDiscs['5'],
        char.equippedDiscs['6'],
      ]
      const discs = discSlots.map((id) =>
        id ? database.discs.get(id) : undefined
      )
      return calculateCharacterScore(discs, ck as CharacterKey).efficiency
    },
  }
}

export const characterFilterKeys = [
  'attribute',
  'specialtyType',
  'rarity',
  'name',
  'new',
] as const
export type CharacterFilterKey = (typeof characterFilterKeys)[number]

export type CharacterFilterConfigs = FilterConfigs<
  CharacterFilterKey,
  CharacterKey
>
export function characterFilterConfigs(
  database: ZzzDatabase
): CharacterFilterConfigs {
  return {
    attribute: (ck, filter) =>
      !filter?.length || filter.includes(getCharStat(ck).attribute),
    specialtyType: (ck, filter) =>
      !filter?.length || filter.includes(getCharStat(ck).specialty),
    rarity: (ck, filter) =>
      !filter?.length || filter.includes(getCharStat(ck).rarity),
    name: (ck, filter) =>
      filter === undefined ||
      i18n.t(ck).toLowerCase().includes(filter.toLowerCase()),
    new: (ck, filter) =>
      filter === undefined ||
      filter === (database.chars.get(ck as CharacterKey) ? 'no' : 'yes'),
  }
}

export const characterSortMap: Partial<
  Record<CharacterSortKey, CharacterSortKey[]>
> = {
  name: ['name'],
  level: ['level', 'rarity', 'name'],
  rarity: ['rarity', 'level', 'name'],
  new: ['new'],
  custom: ['custom'],
  score: ['score', 'level', 'rarity', 'name'],
}

export const initialCharacterDisplayState = (): {
  sortType: CharacterSortKey
  ascending: boolean
  specialtyType: SpecialityKey[]
  attribute: AttributeKey[]
  rarity: CharacterRarityKey[]
  pageIndex: number
} => ({
  sortType: characterSortKeys[0],
  ascending: false,
  specialtyType: [...allSpecialityKeys],
  attribute: [...allAttributeKeys],
  rarity: [...allCharacterRarityKeys],
  pageIndex: 0,
})
