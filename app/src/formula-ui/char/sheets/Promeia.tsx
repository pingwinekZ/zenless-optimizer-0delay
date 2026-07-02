import { ImgIcon } from '@zenless-optimizer/common/ui'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { Promeia } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'

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
        text: 'CP AM to AP and Abloom DMG%',
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
        label: 'AA Presumption of Guilt state',
        description: (
          <>
            <GameDesc ns="char_Promeia_gen" key18="ability.desc.0" />
            <div style={{ marginBottom: 8 }} />
            <GameDesc ns="char_Promeia_gen" key18="ability.desc.3" />
          </>
        ),
        metadata: cond.presumptionOfGuilt,
        fields: [
          {
            title: 'Abloom DEF Ignore',
            fieldRef: buff.ability_presumptionDefIgn.tag,
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(2)} size={1.5} />,
        text: 'M2 AP buff',
      },
      fields: [
        {
          fieldRef: buff.m2_anomProf.tag,
          title: fieldForBuff(buff.m2_anomProf).title,
        },
        {
          title: 'Trial by Cold Abloom DMG%',
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
        text: 'M6 RES Ignore',
      },
      fields: [
        {
          title: ch('m6_resIgn_'),
          fieldRef: buff.m6_resIgn_anomaly.tag,
        },
      ],
    },
  ],
})

export default sheet
