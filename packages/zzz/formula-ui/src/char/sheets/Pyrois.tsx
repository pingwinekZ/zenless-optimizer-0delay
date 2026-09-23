import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Pyrois } from '@zenless-optimizer/zzz/formula'
import { trans } from '../../util'
import {
  CoreGameDesc,
  condSection,
  createBaseSheet,
  fieldsSection,
} from '../sheetUtil'

const key: CharacterKey = 'Pyrois'
const [, ch] = trans('char', key)
const cond = Pyrois.conditionals
const buff = Pyrois.buffs

const sheet = createBaseSheet(key, {
  core: [
    condSection(
      cond.sunflare,
      [buff.sunflare_enerRegen_, buff.sunflare_common_dmg_],
      {
        label: ch('sunflareCond'),
        description: <CoreGameDesc characterKey={key} paragraph={3} />,
      }
    ),
  ],
  ability: [fieldsSection(ch('ability_crit_dmg_'), [buff.ability_crit_dmg_])],
  m1: [fieldsSection(ch('m1_crit_'), [buff.m1_crit_])],
})

export default sheet
