import { cmpEq, subscript } from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../../../../consts'
import { mappedStats } from '../../../../stats'
import { allBoolConditionals, own, ownBuff, registerBuff } from '../../util'
import {
  cmpSpecialtyAndEquipped,
  entriesForWengine,
  registerWengine,
  showSpecialtyAndEquipped,
} from '../util'

const key: WengineKey = 'SolExuvia'
const dm = mappedStats.wengine[key]
const { phase } = own.wengine

const { eclipse_active } = allBoolConditionals(key)

const sheet = registerWengine(
  key,
  // Handles base stats and passive buffs
  entriesForWengine(key),

  // Passive: 20% CRIT Rate (works for all Attack characters)
  registerBuff(
    'crit_',
    ownBuff.combat.crit_.add(
      cmpSpecialtyAndEquipped(key, subscript(phase, dm.crit_))
    ),
    showSpecialtyAndEquipped(key)
  ),
  // Conditional: Eclipse effect - Ether RES ignore (Pyrois only)
  registerBuff(
    'etherResIgn_',
    ownBuff.combat.resIgn_.ether.add(
      cmpSpecialtyAndEquipped(
        key,
        // Only applies when equipped by Pyrois (Phaethon faction)
        cmpEq(
          'Phaethon',
          own.char.faction,
          eclipse_active.ifOn(subscript(phase, dm.etherResIgn_))
        )
      )
    ),
    cmpEq('Phaethon', own.char.faction, showSpecialtyAndEquipped(key), '')
  )
)
export default sheet
