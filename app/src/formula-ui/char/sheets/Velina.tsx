import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Velina } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Velina'
const [, ch] = trans('char', key)
const cond = Velina.conditionals
const buff = Velina.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_dmg_') },
      fields: [
        fieldForBuff(buff.core_common_dmg_),
        fieldForBuff(buff.core_anomMas),
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_wind_dmg_') },
      fields: [
        fieldForBuff(buff.ability_wind_dmg_),
        fieldForBuff(buff.ability_vortex_dmg_),
      ],
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('ability_header'),
      },
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(buff.ability_sweepingCyclone_dazeInc_.tag)}
            >
              {ch('ability_sweepingCyclone_dazeInc_')}
            </ColorText>
          ),
          fieldRef: buff.ability_sweepingCyclone_dazeInc_.tag,
        },
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1VortexCond'),
        description: (
          <GameDesc ns="char_Velina_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.vortexAllResIgn,
        fields: [fieldForBuff(buff.m1_all_resIgn_)],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1WindsweptCond'),
        description: (
          <GameDesc ns="char_Velina_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.windsweptWindResIgn,
        fields: [fieldForBuff(buff.m1_wind_resIgn_)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_sweepingCyclone_dazeInc_') },
      fields: [fieldForBuff(buff.m1_sweepingCyclone_dazeInc_)],
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_wind_dmg_') },
      fields: [
        fieldForBuff(buff.m2_wind_dmg_),
        fieldForBuff(buff.m2_vortex_dmg_),
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDesc ns="char_Velina_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.exSpecialAtk,
        fields: [fieldForBuff(buff.m4_atk_)],
      },
    },
  ],
})

export default sheet
