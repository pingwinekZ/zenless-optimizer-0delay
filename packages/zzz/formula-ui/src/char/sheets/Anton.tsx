import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Anton } from '@zenless-optimizer/zzz/formula'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Anton'
const [, ch] = trans('char', key)
const cond = Anton.conditionals
const buff = Anton.buffs
const formula = Anton.formulas

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      description: <CoreGameDesc characterKey={key} />,
      header: { icon: null, text: ch('core_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.core_piledriver_dmg_.tag)}>
              {ch('core_piledriver_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_piledriver_dmg_.tag,
        },
        {
          title: (
            <ColorText color={getVariant(buff.core_drill_dmg_.tag)}>
              {ch('core_drill_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.core_drill_dmg_.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'fields',
      description: (
        <>
          <GameDesc ns="char_Anton_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Anton_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      header: { icon: null, text: ch('ability_additional_dmg') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.ability_dmg.tag)}>
              {ch('ability_shock_dmg')}
            </ColorText>
          ),
          fieldRef: formula.ability_dmg.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Anton_gen" key18="mindscapes.4.desc" />,
        metadata: cond.chain_ult_used,
        fields: [fieldForBuff(buff.m4_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns="char_Anton_gen" key18="mindscapes.6.desc" />,
        metadata: cond.piledriver_crits,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_dmg_.tag)}>
                {ch('m6_basic_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m6_dmg_.tag)}>
                {ch('m6_dodgeCounter_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
