import type { CharacterKey } from '../../../consts'
import { Velina } from '../../../formula'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Velina'
const [, ch] = trans('char', key)
const cond = Velina.conditionals
const buff = Velina.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      fields: [
        {
          title: 'CP ER to DMG and AM',
          fieldRef: buff.core_common_dmg_.tag,
        },
        fieldForBuff(buff.core_anomMas),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('windbiteCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.windbite_consumed,
        fields: [fieldForBuff(buff.core_windbite_vortex_anom_mv_mult_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      fields: [
        {
          title: 'AA Windswept and Vortex DMG',
          fieldRef: buff.ability_wind_dmg_.tag,
        },
        fieldForBuff(buff.ability_vortex_dmg_),
      ],
    },
  ],
  m1: [
    {
      type: 'fields',
      fields: [
        {
          title: 'M1 RES Ignore',
          fieldRef: buff.m1_wind_resIgn_.tag,
        },
        fieldForBuff(buff.m1_all_resIgn_),
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [
        {
          title: 'M2 Windswept and Vortex DMG',
          fieldRef: buff.m2_wind_dmg_.tag,
        },
        fieldForBuff(buff.m2_vortex_dmg_),
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      fields: [
        {
          title: 'M4 ATK',
          fieldRef: buff.m4_atk_.tag,
        },
      ],
    },
  ],
})

export default sheet
