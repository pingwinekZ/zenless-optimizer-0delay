import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { StarlightBilly } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'StarlightBilly'
const [, ch] = trans('char', key)
const cond = StarlightBilly.conditionals
const buff = StarlightBilly.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={2} />,
        metadata: cond.cpCritDmg,
        fields: [fieldForBuff(buff.core_critDmg)],
      },
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('core_header'),
      },
      fields: [fieldForBuff(buff.core_hpSheerForce)],
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
            title: (
              <ColorText color={getVariant(buff.ability_exSpecial_dmg_.tag)}>
                {ch('ability_exSpecial_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.ability_exSpecial_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.ability_basic_dmg_.tag)}>
                {ch('ability_basic_dmg_')}
              </ColorText>
            ),
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
        label: ch('m1Cond'),
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
        text: ch('m2_header'),
      },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_basic_dmg_.tag)}>
              {ch('m2_basic_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_basic_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_exSpecial_dmg_.tag)}>
              {ch('m2_exSpecial_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_exSpecial_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m2_ult_dmg_.tag)}>
              {ch('m2_ult_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_ult_dmg_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
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
        text: ch('m6_header'),
      },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_ult_sheer_.tag)}>
              {ch('m6_ult_sheer_')}
            </ColorText>
          ),
          fieldRef: buff.m6_ult_sheer_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_basic_sheer_.tag)}>
              {ch('m6_basic_sheer_')}
            </ColorText>
          ),
          fieldRef: buff.m6_basic_sheer_.tag,
        },
      ],
    },
  ],
})

export default sheet
