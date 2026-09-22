import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Nicole } from '@zenless-optimizer/zzz/formula'
import { GameDesc } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  condSection,
  createBaseSheet,
  fieldsSection,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Nicole'
const [, ch] = trans('char', key)
const cond = Nicole.conditionals
const buff = Nicole.buffs

const sheet = createBaseSheet(key, {
  core: [
    condSection(cond.bulletsOrFieldHit, [buff.core_defRed_], {
      label: ch('coreCond'),
      description: <CoreGameDesc characterKey={key} />,
      linked: ['bulletsOrFieldHit_ability'],
    }),
  ],
  ability: [
    condSection(cond.bulletsOrFieldHit_ability, [buff.ability_ether_dmg_], {
      label: ch('abilityCond'),
      description: (
        <>
          <GameDesc ns="char_Nicole_gen" key18="ability.desc.0" />
          <AbilityBodyText characterKey={key}>
            <GameDesc ns="char_Nicole_gen" key18="ability.desc.1" />
          </AbilityBodyText>
        </>
      ),
      linked: ['bulletsOrFieldHit'],
    }),
  ],
  m1: [
    fieldsSection(ch('m1_header'), [buff.m1_exSpecial_dmg_], {
      description: <GameDesc ns="char_Nicole_gen" key18="mindscapes.1.desc" />,
      extraFields: [
        {
          title: (
            <ColorText color={getVariant(buff.m1_exSpecial_anomBuildup_.tag)}>
              {ch('m1_exSpecial_anomBuildup')}
            </ColorText>
          ),
          fieldRef: buff.m1_exSpecial_anomBuildup_.tag,
        },
      ],
    }),
  ],
  m6: [
    condSection(cond.fieldHitsEnemy, [buff.m6_crit_], {
      label: ch('m6Cond'),
      description: <GameDesc ns="char_Nicole_gen" key18="mindscapes.6.desc" />,
    }),
  ],
})

export default sheet
