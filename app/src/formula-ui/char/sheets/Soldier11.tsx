import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Soldier11 } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Soldier11'
const [, ch] = trans('char', key)
const cond = Soldier11.conditionals
const buff = Soldier11.buffs

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Soldier11_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Soldier11_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

function PotentialDescription() {
  return <GameDesc ns="char_Soldier11_gen" key18="potential.desc.6" />
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'fields',
      header: { icon: null, text: ch('core_header') },
      // Custom description doubles as the optimizer hover-card text: without
      // it the hover lookup auto-computes `core.desc.<level>.0`, which misses
      // (this core desc is a plain string, not paragraphs) and renders the raw key.
      description: <CoreGameDesc characterKey={key} />,
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
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [fieldForBuff(buff.ability_fire_dmg_)],
    },
  ],
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      description: <PotentialDescription />,
      fields: [fieldForBuff(buff.ability_crit_dmg_)],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Soldier11_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.m2_stacks,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_common_dmg_.tag)}>
                {ch('m2_common_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_common_dmg_.tag,
          },
          fieldForBuff(buff.m2_dodgeCounter_dmg_),
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6ChargeConsumedCond'),
        description: (
          <GameDesc ns="char_Soldier11_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.charge_consumed,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_fire_resIgn_.tag)}>
                {ch('m6_fire_resIgn_')}
              </ColorText>
            ),
            fieldRef: buff.m6_fire_resIgn_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
