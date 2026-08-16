import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Promeia } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Promeia'
const [, ch] = trans('char', key)
const cond = Promeia.conditionals
const buff = Promeia.buffs
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('core_header'),
      },
      fields: [
        fieldForBuff(buff.core_anomProf),
        fieldForBuff(buff.core_abloomDmg),
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
            <GameDesc ns="char_Promeia_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Promeia_gen" key18="ability.desc.3" />
          </>
        ),
        metadata: cond.presumptionOfGuilt,
        fields: [fieldForBuff(buff.ability_presumptionDefIgn)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(1)} size={1.5} />,
        text: ch('m1_header'),
      },
      fields: [fieldForBuff(buff.m1_defIgn_)],
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
        fieldForBuff(buff.m2_anomProf),
        {
          title: ch('m2_trialAbloomMult'),
          fieldValue: dm.m2.trialAbloomMult * 100,
          unit: '%',
        },
      ],
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
            <ColorText color={getVariant(buff.m6_resIgn_anomaly.tag)}>
              {ch('m6_resIgn_anomaly')}
            </ColorText>
          ),
          fieldRef: buff.m6_resIgn_anomaly.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m6_resIgn_disorder.tag)}>
              {ch('m6_resIgn_disorder')}
            </ColorText>
          ),
          fieldRef: buff.m6_resIgn_disorder.tag,
        },
      ],
    },
  ],
})

export default sheet
