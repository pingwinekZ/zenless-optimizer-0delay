import { ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { StarlightBilly } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'

const key: CharacterKey = 'StarlightBilly'
const [, ch] = trans('char', key)
const cond = StarlightBilly.conditionals
const buff = StarlightBilly.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: 'CP CRIT DMG buff',
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.cpCritDmg,
        fields: [fieldForBuff(buff.core_critDmg)],
      },
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: 'CP Sheer Force conversion',
      },
      fields: [
        {
          title: 'HP to Sheer Force',
          fieldRef: buff.core_hpSheerForce.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_StarlightBilly_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_StarlightBilly_gen" key18="ability.desc.1" />
          </>
        ),
        metadata: cond.starlightStacks,
        fields: [
          fieldForBuff(buff.ability_chain_dmg_),
          fieldForBuff(buff.ability_ult_dmg_),
          {
            title: 'EX Special DMG',
            fieldRef: buff.ability_exSpecial_dmg_.tag,
          },
          {
            title: 'Full-Throttle Starlight DMG',
            fieldRef: buff.ability_basic_dmg_.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: 'M1 Physical RES Ignore',
        description: (
          <GameDesc ns="char_StarlightBilly_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.m1PhysResIgn,
        fields: [fieldForBuff(buff.m1_physResIgn)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(2)} size={1.5} />,
        text: 'M2 DMG buff',
      },
      fields: [
        {
          title: 'Full-Throttle Starlight DMG',
          fieldRef: buff.m2_basic_dmg_.tag,
        },
        {
          title: 'Cool Wheelie DMG',
          fieldRef: buff.m2_exSpecial_dmg_.tag,
        },
        {
          title: 'Ultimate DMG',
          fieldRef: buff.m2_ult_dmg_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: 'M4 CRIT DMG buff',
        description: (
          <GameDesc ns="char_StarlightBilly_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.m4CritDmgStacks,
        fields: [fieldForBuff(buff.m4_critDmg)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: 'M6 Sheer DMG buff',
      },
      fields: [
        {
          title: 'Ultimate Sheer DMG',
          fieldRef: buff.m6_ult_sheer_.tag,
        },
        {
          title: 'Full-Throttle Starlight Sheer DMG',
          fieldRef: buff.m6_basic_sheer_.tag,
        },
      ],
    },
  ],
})

export default sheet
