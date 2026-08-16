import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Evelyn } from '../../../formula'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Evelyn'
const [, ch] = trans('char', key)
const cond = Evelyn.conditionals
const buff = Evelyn.buffs
const formula = Evelyn.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('core_header') },
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.binding_seal,
        fields: [fieldForBuff(buff.core_crit_)],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      fields: [
        fieldForBuff(buff.ability_chain_ult_dmg_),
        fieldForBuff(buff.ability_chainSkill_mv_mult),
      ],
    },
  ],
  m1: [
    {
      type: 'conditional',
      header: { icon: null, text: ch('m1_header') },
      conditional: {
        label: ch('m1Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Evelyn_gen"
            key18="mindscapes.1.desc"
          />
        ),
        metadata: cond.enemy_bound,
        fields: [fieldForBuff(buff.m1_defIgn_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [fieldForBuff(buff.m2_atk_)],
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: ch('m4_shield'),
          fieldRef: formula.m4_shield.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <SkillGameDesc
            characterKey={key}
            ns="char_Evelyn_gen"
            key18="mindscapes.4.desc"
          />
        ),
        metadata: cond.m4_shield_exists,
        fields: [fieldForBuff(buff.m4_crit_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_follow_up_dmg_.tag)}>
              {ch('m6_follow_up_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_follow_up_dmg_.tag,
        },
      ],
    },
  ],
})

export default sheet
