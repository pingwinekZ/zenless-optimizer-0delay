import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Norma } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Norma'
const [, ch] = trans('char', key)
const cond = Norma.conditionals
const buff = Norma.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_critDmg_') },
      fields: [fieldForBuff(buff.core_critDmg_)],
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('core_header'),
      },
      fields: [
        fieldForBuff(buff.core_exSpecial_dazeInc_),
        fieldForBuff(buff.core_special_dazeInc_),
        fieldForBuff(buff.core_ult_dazeInc_),
      ],
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('core_atk') },
      fields: [fieldForBuff(buff.core_atk)],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns="char_Norma_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Norma_gen" key18="ability.desc.3" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Norma_gen" key18="ability.desc.4" />
          </>
        ),
        metadata: cond.enNahBarrage,
        fields: [
          fieldForBuff(buff.ability_atk),
          fieldForBuff(buff.ability_squadDmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_Norma_gen" key18="mindscapes.1.desc" />,
        metadata: cond.warheadHit,
        fields: [fieldForBuff(buff.m1_allResRed_)],
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
            <ColorText color={getVariant(buff.m6_daze_.tag)}>
              {ch('m6_daze_')}
            </ColorText>
          ),
          fieldRef: buff.m6_daze_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_dmg_.tag)}>
              {ch('m6_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m6_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
