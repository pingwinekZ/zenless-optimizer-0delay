import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { AstraYao } from '../../../formula'
import { GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'AstraYao'
const [, ch] = trans('char', key)
const cond = AstraYao.conditionals
const buff = AstraYao.buffs
const formula = AstraYao.formulas

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns="char_AstraYao_gen"
          key18="mindscapes.2.desc"
          from="The ATK buff"
          to="maximum of 400"
        />
      </PrefixedLine>
    </>
  )
}

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
                paragraph={0}
              />
            ),
            metadata: cond.idyllic_cadenza,
            fields: [
              fieldForBuff(buff.common_dmg_),
              fieldForBuff(buff.crit_dmg_),
            ],
            linked: ['m6_cadenza', 'm4_cadenza'],
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
        label: ch('coreCond'),
        description: <CoreDescription />,
        metadata: cond.core_atk_cond,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDescSlice
            ns="char_AstraYao_gen"
            key18="mindscapes.1.desc"
            from="When Astra Yao's attack hits"
            to="Repeated triggers reset the duration"
          />
        ),
        metadata: cond.attack_hits,
        fields: [fieldForBuff(buff.m1_resRed_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4CadenzaCond'),
        description: (
          <GameDescSlice
            ns="char_AstraYao_gen"
            key18="mindscapes.4.desc"
            from="While in the "
            to="50% increased Daze"
          />
        ),
        metadata: cond.m4_cadenza,
        fields: [
          {
            title: (
              <ColorText
                color={getVariant(buff.m4_attack_quickAssist_extraDmg.tag)}
              >
                {ch('m4_attack_dmg')}
              </ColorText>
            ),
            fieldRef: buff.m4_attack_quickAssist_extraDmg.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m4_anomaly_quickAssist_anomBuildup_.tag)}
              >
                {ch('m4_anomaly_anomBuildup_')}
              </ColorText>
            ),
            fieldRef: buff.m4_anomaly_quickAssist_anomBuildup_.tag,
          },
          {
            title: (
              <ColorText
                color={getVariant(buff.m4_stun_quickAssist_dazeInc_.tag)}
              >
                {ch('m4_stun_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.m4_stun_quickAssist_dazeInc_.tag,
          },
        ],
        linked: ['idyllic_cadenza', 'm6_cadenza'],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6CadenzaCond'),
        description: (
          <GameDescSlice
            ns="char_AstraYao_gen"
            key18="mindscapes.6.desc"
            from="While in the "
            to="CRIT Rate is increased by 80%"
          />
        ),
        metadata: cond.m6_cadenza,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_mv_mult_.tag)}>
                {ch('m6_mv_mult_')}
              </ColorText>
            ),
            fieldRef: buff.m6_mv_mult_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_crit_.tag)}>
                {ch('m6_crit_')}
              </ColorText>
            ),
            fieldRef: buff.m6_crit_.tag,
          },
        ],
        linked: ['idyllic_cadenza', 'm4_cadenza'],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns="char_AstraYao_gen"
            key18="mindscapes.6.desc"
            from="When triggering a "
            to="trigger once every 10s"
          />
        ),
        metadata: cond.precise_assist_triggered,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_capriccio_crit_.tag)}>
                {ch('m6_capriccio_crit_')}
              </ColorText>
            ),
            fieldRef: buff.m6_capriccio_crit_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
