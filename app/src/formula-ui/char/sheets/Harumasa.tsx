import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Harumasa } from '../../../formula'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Harumasa'
const [, ch] = trans('char', key)
const cond = Harumasa.conditionals
const buff = Harumasa.buffs
const formula = Harumasa.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [fieldForBuff(buff.core_dash_crit_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.gleaming_edge,
        fields: [fieldForBuff(buff.core_dash_crit_dmg_)],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Harumasa_gen"
            key18="ability.desc"
          />
        ),
        metadata: cond.enemy_anomaly,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Harumasa_gen"
            key18="mindscapes.2.desc"
          />
        ),
        metadata: cond.electro_blitz,
        fields: [fieldForBuff(buff.m2_dash_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        fieldForBuff(buff.m6_electric_resIgn_),
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Harumasa_gen"
            key18="mindscapes.6.desc"
          />
        ),
        metadata: cond.haOtoNoYa,
        fields: [
          fieldForBuff(buff.m6_electric_resIgn_),
          {
            title: (
              <ColorText color={getVariant(formula.m6_dmg.tag)}>
                {ch('m6_dmg')}
              </ColorText>
            ),
            fieldRef: formula.m6_dmg.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
