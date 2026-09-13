import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Ben } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Ben'
const [, ch] = trans('char', key)
const cond = Ben.conditionals
const buff = Ben.buffs
const formula = Ben.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      description: <CoreGameDesc characterKey={key} paragraph={0} />,
      header: { icon: null, text: ch('core_header') },
      fields: [fieldForBuff(buff.core_atk)],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('shieldCond'),
        description: (
          <>
            <GameDesc ns="char_Ben_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Ben_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.shieldOn,
        fields: [fieldForBuff(buff.ability_crit_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      description: <GameDesc ns="char_Ben_gen" key18="mindscapes.2.desc" />,
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m2_dmg.tag)}>
              {ch('m2_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m2_dmg.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Ben_gen" key18="mindscapes.4.desc" />,
        metadata: cond.enemyBlocked_m4,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m4_dmg_.tag)}>
                {ch('m4_fiscal_fist_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m4_dmg_.tag)}>
                {ch('m4_cashflow_counter_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m4_dmg_.tag,
          },
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns="char_Ben_gen" key18="mindscapes.6.desc" />,
        metadata: cond.attackLaunched,
        fields: [
          fieldForBuff(buff.m6_basic_dazeInc_),
          fieldForBuff(buff.m6_dash_dazeInc_),
          fieldForBuff(buff.m6_dodgeCounter_dazeInc_),
        ],
      },
    },
  ],
})

export default sheet
