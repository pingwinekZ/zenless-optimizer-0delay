import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Nicole } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Nicole'
const [, ch] = trans('char', key)
const cond = Nicole.conditionals
const buff = Nicole.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.bulletsOrFieldHit,
        linked: ['bulletsOrFieldHit_ability'],
        fields: [fieldForBuff(buff.core_defRed_)],
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
            <GameDesc ns="char_Nicole_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Nicole_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.bulletsOrFieldHit_ability,
        linked: ['bulletsOrFieldHit'],
        fields: [fieldForBuff(buff.ability_ether_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'fields',
      description: <GameDesc ns="char_Nicole_gen" key18="mindscapes.1.desc" />,
      header: { icon: null, text: ch('m1_header') },
      fields: [
        fieldForBuff(buff.m1_exSpecial_dmg_),
        {
          title: (
            <ColorText color={getVariant(buff.m1_exSpecial_anomBuildup_.tag)}>
              {ch('m1_exSpecial_anomBuildup')}
            </ColorText>
          ),
          fieldRef: buff.m1_exSpecial_anomBuildup_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Nicole_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.fieldHitsEnemy,
        fields: [fieldForBuff(buff.m6_crit_)],
      },
    },
  ],
})

export default sheet
