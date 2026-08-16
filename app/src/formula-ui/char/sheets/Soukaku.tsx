import type { CharacterKey } from '../../../consts'
import { Soukaku } from '../../../formula'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'Soukaku'
const [, ch] = trans('char', key)
const cond = Soukaku.conditionals
const buff = Soukaku.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateJumboPuddingSlash: [
        {
          type: 'conditional',
          conditional: {
            label: ch('ultCond'),
            description:
              "Increases Soukaku's CRIT Rate for her Ultimate while in the Masked state.",
            metadata: cond.masked,
            fields: [fieldForBuff(buff.ult_crit_)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description:
          'The entire squad gains bonus ATK when Soukaku launches Fly the Flag.',
        metadata: cond.flyTheFlag,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond2'),
        description:
          'Activates additional effects when consuming Vortex during Fly the Flag.',
        metadata: cond.vortexConsumed,
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond2'),
        description:
          "Increases Soukaku's Ice DMG when consuming Vortex during Fly the Flag.",
        metadata: cond.vortexConsumed,
        fields: [fieldForBuff(buff.ability_ice_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description:
          "Reduces the enemy's Ice RES when Fly the Flag hits an enemy.",
        metadata: cond.flyTheFlagHit,
        fields: [fieldForBuff(buff.m4_ice_resRed_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description:
          "Increases Soukaku's Enhanced Basic and Dash Attack DMG while in the Frosted Banner state.",
        metadata: cond.frostedBanner,
        fields: [
          {
            title: ch('m6_dmg_'),
            fieldRef: buff.m6_common_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
