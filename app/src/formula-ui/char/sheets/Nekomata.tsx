import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Nekomata } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Nekomata'
const [, ch] = trans('char', key)
const cond = Nekomata.conditionals
const buff = Nekomata.buffs
const formula = Nekomata.formulas

function AbilityDescription() {
  return (
    <>
      <GameDesc ns="char_Nekomata_gen" key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDesc ns="char_Nekomata_gen" key18="ability.desc.1" />
      </AbilityBodyText>
    </>
  )
}

function PotentialDescription() {
  return <GameDesc ns="char_Nekomata_gen" key18="potential.desc.6" />
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.dodgeCounter_quickAssist_hit,
        fields: [fieldForBuff(buff.core_common_dmg_)],
      },
    },
    {
      type: 'fields',
      header: { icon: null, text: ch('additional_dmg_header') },
      description: <CoreGameDesc characterKey={key} paragraph={6} />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_pawprint_dmg.tag)}>
              {ch('core_pawprint_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_pawprint_dmg.tag,
        },
      ],
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityCond'),
        description: <AbilityDescription />,
        metadata: cond.assaults_inflicted,
        fields: [
          fieldForBuff(buff.ability_exSpecial_dmg_),
          fieldForBuff(buff.ability_dodgeCounter_dmg_),
        ],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('potentialCond'),
        description: <PotentialDescription />,
        metadata: cond.pawpad_ambush,
        fields: [fieldForBuff(buff.potential_crit_dmg_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: (
          <GameDesc ns="char_Nekomata_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.from_behind,
        fields: [fieldForBuff(buff.m1_physical_resIgn_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Nekomata_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.one_enemy_onField,
        fields: [fieldForBuff(buff.m2_enerRegen_)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: (
          <GameDesc ns="char_Nekomata_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.exSpecials_used,
        fields: [fieldForBuff(buff.m4_crit_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: (
          <GameDesc ns="char_Nekomata_gen" key18="mindscapes.6.desc" />
        ),
        metadata: cond.chain_ult_used,
        fields: [fieldForBuff(buff.m6_crit_dmg_)],
      },
    },
  ],
})

export default sheet
