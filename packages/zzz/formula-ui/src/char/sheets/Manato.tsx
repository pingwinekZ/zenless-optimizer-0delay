import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Manato } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Manato'
const ns = 'char_Manato_gen'
const [, ch] = trans('char', key)
const cond = Manato.conditionals
const buff = Manato.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      header: { icon: null, text: ch('core_sheerForce_header') },
      fields: [fieldForBuff(buff.core_hpSheerForce)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond_consumingHp'),
        description: <CoreGameDesc characterKey={key} paragraph={4} />,
        metadata: cond.consumingHp_consecutiveStrikes,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_basic_crit_dmg_.tag)}>
                {ch('core_basic_crit_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_basic_crit_dmg_.tag,
          },
          fieldForBuff(buff.core_assistFollowUp_crit_dmg_),
        ],
      },
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond_moltenEdge'),
        description: <CoreGameDesc characterKey={key} paragraph={5} />,
        metadata: cond.moltenEdge,
        linked: ['moltenEdge_m2'],
        fields: [
          fieldForBuff(buff.core_crit_),
          fieldForBuff(buff.core_fire_dmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.1.desc" />,
        metadata: cond.hpTallied,
        fields: [
          {
            title: (
              <ColorText
                color={getVariant(buff.m1_assistFollowUp_fire_dmg_.tag)}
              >
                {ch('m1_assistFollowUp_fire_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_assistFollowUp_fire_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m1_basic_fire_dmg_.tag)}>
                {ch('m1_basic_fire_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m1_basic_fire_dmg_.tag,
          },
        ],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.2.desc"
            from="While in the <ct color=#FFFFFF>Molten Edge</ct> state"
            to="Fire RES"
          />
        ),
        metadata: cond.moltenEdge_m2,
        linked: ['moltenEdge'],
        fields: [fieldForBuff(buff.m2_fire_resIgn_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_hp_)],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.6.desc"
            from="When his <ct color=#FFFFFF>Assist Follow-Up</ct> hits an enemy"
            to="up to 5 times"
          />
        ),
        metadata: cond.assistFollowUpHitsEnemy,
        fields: [fieldForBuff(buff.m6_fire_dmg_)],
      },
    },
  ],
})

export default sheet
