import { subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import {
  allBoolConditionals,
  own,
  ownBuff,
  percent,
  registerBuff,
} from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'CattyLuck'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { exSpecialUsed } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  entriesForWengine(key),
  registerBuff(
    'passive_def_',
    ownBuff.combat.def_.add(
      cmpSpecialtyAndEquipped(key, percent(subscript(phase, dm.def_)))
    ),
    showSpecialtyAndEquipped(key)
  ),
  registerBuff(
    'cond_ex_def_',
    ownBuff.combat.def_.add(
      cmpSpecialtyAndEquipped(
        key,
        exSpecialUsed.ifOn(percent(subscript(phase, dm.ex_def_)))
      )
    ),
    showSpecialtyAndEquipped(key)
  )
)
export default sheet
