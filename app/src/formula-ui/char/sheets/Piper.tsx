import type { CharacterKey } from '../../../consts'
import { Piper } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Piper'
const [, ch] = trans('char', key)
const cond = Piper.conditionals
const buff = Piper.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          'Increases Physical Anomaly Buildup while Piper has stacks of Power.',
        metadata: cond.power,
        fields: [fieldForBuff(buff.core_physical_anomBuildup_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: "Increases Piper's damage while she has stacks of Power.",
        metadata: cond.power,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          'Increases Downward Smash damage while Piper has stacks of Power.',
        metadata: cond.power,
        fields: [
          {
            title: ch('m2_physical_dmg_'),
            fieldRef: buff.m2_physical_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
