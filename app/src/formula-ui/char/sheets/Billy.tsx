import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Billy } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Billy'
const ns = 'char_Billy_gen'
const [, ch] = trans('char', key)
const cond = Billy.conditionals
const buff = Billy.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.crouchingShot,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.core_common_dmg_.tag)}>
                {ch('core_common_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_common_dmg_.tag,
          },
        ],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: (
          <>
            <GameDesc ns={ns} key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns={ns} key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.ult_dmg_stacks,
        fields: [fieldForBuff(buff.ability_ult_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      description: (
        <GameDescSlice
          ns={ns}
          key18="mindscapes.2.desc"
          from="Billy's <ct color=#FFFFFF>Dodge Counter</ct> DMG increases"
          to="by 25%"
        />
      ),
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m2_dodgeCounter_dmg_.tag)}>
              {ch('m2_dodgeCounter_dmg_')}
            </ColorText>
          ),
          fieldRef: buff.m2_dodgeCounter_dmg_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.4.desc" />,
        metadata: cond.distance,
        fields: [fieldForBuff(buff.m4_exSpecial_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.6.desc" />,
        metadata: cond.m6_stacks,
        fields: [fieldForBuff(buff.m6_common_dmg_)],
      },
    },
  ],
})

export default sheet
