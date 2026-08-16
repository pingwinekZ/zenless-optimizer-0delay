import type { CharacterKey } from '../../../consts'
import { Pyrois } from '../../../formula'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Pyrois'
const [, ch] = trans('char', key)
const cond = Pyrois.conditionals
const buff = Pyrois.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('sunflareCond'),
        description: <CoreGameDesc characterKey={key} paragraph={3} />,
        metadata: cond.sunflare,
        fields: [
          fieldForBuff(buff.sunflare_enerRegen_),
          fieldForBuff(buff.sunflare_common_dmg_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_crit_dmg_') },
      fields: [fieldForBuff(buff.ability_crit_dmg_)],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_crit_') },
      fields: [fieldForBuff(buff.m1_crit_)],
    },
  ],
})

export default sheet
