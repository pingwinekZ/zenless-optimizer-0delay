import { ImgIcon } from '@zenless-optimizer/common/ui'
import { mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { AstraYao } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { mappedStats } from '../../../stats'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'AstraYao'
const [, ch] = trans('char', key)
const cond = AstraYao.conditionals
const buff = AstraYao.buffs
const formula = AstraYao.formulas
const dm = mappedStats.char[key]

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      IdyllicCadenza: [
        {
          type: 'conditional',
          conditional: {
            label: ch('idyllic_cadenzaCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_AstraYao_gen"
                key18="special.IdyllicCadenza.desc"
              />
            ),
            metadata: cond.idyllic_cadenza,
            fields: [
              fieldForBuff(buff.common_dmg_),
              fieldForBuff(buff.crit_dmg_),
            ],
          },
        },
      ],
    },
    chain: {
      UltimateFantasianSonata: [
        {
          type: 'fields',
          fields: [
            { title: ch('ult_heal'), fieldRef: formula.ultimate_heal.tag },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: 'CP ATK buff',
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.core_atk_cond,
        fields: [
          {
            title: 'CP ATK buff',
            fieldRef: buff.core_atk.tag,
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
          <GameDesc ns="char_AstraYao_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.attack_hits,
        fields: [fieldForBuff(buff.m1_resRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(2)} size={1.5} />,
        text: 'M2 ATK buff',
      },
      fields: [
        {
          title: ch('m2_atkBuffInc_'),
          fieldValue: dm.m2.atk_ * 100,
          unit: '%',
        },
        {
          title: ch('m2_maxIncrease'),
          fieldValue: dm.m2.max_increase,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m4_attack_quickAssist_extraDmg)],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: 'M6 CR and DMG buff',
      },
      fields: [
        {
          title: ch('m6_mv_mult_'),
          fieldValue: dm.m6.tremolo_tone_clusters_mv_mult * 100,
          unit: '%',
        },
        {
          title: ch('m6_crit_'),
          fieldValue: dm.m6.crit_ * 100,
          unit: '%',
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_AstraYao_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.precise_assist_triggered,
        fields: [
          {
            title: ch('m6_capriccio_crit_'),
            fieldRef: buff.m6_capriccio_crit_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
