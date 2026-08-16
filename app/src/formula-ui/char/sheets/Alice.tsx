import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Alice } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Alice'
const [, ch] = trans('char', key)
const cond = Alice.conditionals
const buff = Alice.buffs
const formula = Alice.formulas

const sheet = createBaseSheet(key, {
  core: [],
  abilityParagraph: 2,
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      paragraph: 2,
      fields: [fieldForBuff(buff.ability_anomProf)],
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1AssaultCond'),
        description: <GameDesc ns="char_Alice_gen" key18="mindscapes.1.desc" />,
        metadata: cond.assault_triggered,
        fields: [fieldForBuff(buff.m1_defRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      fields: [fieldForBuff(buff.m2_assault_dmg_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('m2PhysicalAnomalyCond'),
        description: <GameDesc ns="char_Alice_gen" key18="mindscapes.2.desc" />,
        metadata: cond.physical_anomaly_enemy,
        fields: [fieldForBuff(buff.m2_disorder_dmg_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m4_header') },
      fields: [fieldForBuff(buff.m4_phys_resIgn_)],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m6_crit_.tag)}>
              {ch('m6_crit_')}
            </ColorText>
          ),
          fieldRef: buff.m6_crit_.tag,
        },
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
  ],
})

export default sheet
