import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Jane } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Jane'
const [, ch] = trans('char', key)
const cond = Jane.conditionals
const buff = Jane.buffs
const formula = Jane.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      Passion: [
        {
          type: 'conditional',
          conditional: {
            label: ch('passionCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Jane_gen"
                key18="basic.Passion.desc"
              />
            ),
            metadata: cond.passion,
            fields: [fieldForBuff(buff.passion_atk)],
            linked: ['m1_passion', 'm6_passion'],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      fields: [
        fieldForBuff(buff.core_assault_crit_),
        fieldForBuff(buff.core_assault_crit_dmg_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('coreGnawedCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.core_gnawed,
        linked: ['m2_gnawed'],
        fields: [
          fieldForBuff(buff.core_assault_crit_),
          fieldForBuff(buff.core_assault_crit_dmg_),
        ],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m1_header') },
      fields: [fieldForBuff(buff.m1_common_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m1PassionCond'),
        description: <GameDesc ns="char_Jane_gen" key18="mindscapes.1.desc" />,
        metadata: cond.m1_passion,
        fields: [fieldForBuff(buff.m1_common_dmg_)],
        linked: ['passion', 'm6_passion'],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [
        fieldForBuff(buff.m2_defIgn_),
        fieldForBuff(buff.m2_assault_defIgn_),
        fieldForBuff(buff.m2_assault_crit_dmg_),
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2GnawedCond'),
        description: <GameDesc ns="char_Jane_gen" key18="mindscapes.2.desc" />,
        metadata: cond.m2_gnawed,
        linked: ['core_gnawed'],
        fields: [
          fieldForBuff(buff.m2_defIgn_),
          fieldForBuff(buff.m2_assault_defIgn_),
          fieldForBuff(buff.m2_assault_crit_dmg_),
        ],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_anomaly_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Jane_gen" key18="mindscapes.4.desc" />,
        metadata: cond.assault_or_disorder_triggered,
        fields: [fieldForBuff(buff.m4_anomaly_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        fieldForBuff(buff.m6_crit_),
        fieldForBuff(buff.m6_crit_dmg_),
        {
          title: (
            <ColorText color={getVariant(formula.m6_additional_dmg.tag)}>
              {ch('m6_additional_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_dmg.tag,
        },
      ],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m6PassionCond'),
        description: <GameDesc ns="char_Jane_gen" key18="mindscapes.6.desc" />,
        metadata: cond.m6_passion,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
        linked: ['passion', 'm1_passion'],
      },
    },
  ],
})

export default sheet
