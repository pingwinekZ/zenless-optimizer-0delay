import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Aria } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff, SkillGameDesc } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Aria'
const [, ch] = trans('char', key)
const cond = Aria.conditionals
const buff = Aria.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      Ultimate100Energy: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Aria_gen"
                key18="chain.Ultimate100Energy.desc"
              />
            ),
            metadata: cond.etherVeil,
            fields: [fieldForBuff(buff.ultimate_atk)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [fieldForBuff(buff.core_anomProf)],
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_abloom.tag)}>
              {ch('m1_abloom')}
            </ColorText>
          ),
          fieldRef: buff.m1_abloom.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.m1_abloom_crit_dmg.tag)}>
              {ch('m1_abloom_crit_dmg')}
            </ColorText>
          ),
          fieldRef: buff.m1_abloom_crit_dmg.tag,
        },
      ],
    },
  ],
  m2: [
    {
      type: 'fields',
      fields: [fieldForBuff(buff.m2_defIgn_base)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns="char_Aria_gen" key18="mindscapes.2.desc" />,
        metadata: cond.m2Delusion,
        fields: [fieldForBuff(buff.m2_defIgn_delusion)],
        linked: 'm6Delusion',
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns="char_Aria_gen" key18="mindscapes.6.desc" />,
        metadata: cond.m6Delusion,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_perfectPitch_dmg_.tag)}>
                {ch('m6_perfectPitch_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_perfectPitch_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_ult_dmg_.tag)}>
                {ch('m6_ult_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_ult_dmg_.tag,
          },
        ],
        linked: 'm2Delusion',
      },
    },
  ],
})

export default sheet
