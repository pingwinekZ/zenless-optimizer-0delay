import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Soldier0Anby } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,

  useAbilityActive,
  usePotentialDescKey,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Soldier0Anby'
const [, ch] = trans('char', key)
const cond = Soldier0Anby.conditionals
const buff = Soldier0Anby.buffs
const formula = Soldier0Anby.formulas

function CoreDescription() {
  const char = useCharacter(key)
  const coreLevel = char?.core ?? 0
  const potential = char?.potential ?? 0
  const ns = 'char_Soldier0Anby_gen'
  const coreKey = usePotentialDescKey(
    key,
    ns,
    `core.desc.${coreLevel}${potential > 0 ? '.0' : ''}`
  )
  const coreKey1 = `core.descPotential.${coreLevel}.1`
  return (
    <>
      <GameDescSlice
        ns={ns}
        key18={coreKey}
        from={
          potential > 0 ? 'Soldier 0 - Anby deals' : "Soldier 0 - Anby's DMG"
        }
        to="of Soldier 0 - Anby's CRIT DMG"
      />
      <PrefixedLine prefix="P1" dimmed={potential < 1}>
        <GameDescSlice
          ns={ns}
          key18={coreKey1}
          from="The Aftershock CRIT DMG bonus"
          to="Soldier 0 - Anby's CRIT DMG"
        />
      </PrefixedLine>

    </>
  )
}

function AbilityDescription() {
  const ns = 'char_Soldier0Anby_gen'
  const desc1 = usePotentialDescKey(key, ns, 'ability.desc.1')
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice
          ns={ns}
          key18={desc1}
          from="Soldier 0 - Anby's CRIT Rate increases by"
          to="10%"
        />
      </AbilityBodyText>
    </>
  )
}

function AbilityConditionalDescription() {
  const potential = useCharacter(key)?.potential ?? 0
  const active = useAbilityActive(key)
  const ns = 'char_Soldier0Anby_gen'
  const desc1 = usePotentialDescKey(key, ns, 'ability.desc.1')
  const from =
    potential > 0
      ? 'When the current active character is Soldier 0 - Anby'
      : 'When Soldier 0 - Anby is the active character'
  return (
    <>
      <GameDesc ns={ns} key18="ability.desc.0" />
      <AbilityBodyText characterKey={key}>
        <GameDescSlice ns={ns} key18={desc1} from={from} to="Silver Star" />
      </AbilityBodyText>
      <PrefixedLine prefix="P2+" dimmed={!active || potential < 2}>
        <GameDesc ns={ns} key18={`potential.desc.${Math.max(potential, 2)}`} />
      </PrefixedLine>
    </>
  )
}

function PotentialDescription() {
  const potential = useCharacter(key)?.potential ?? 0
  const ns = 'char_Soldier0Anby_gen'
  return (
    <>
      <PrefixedLine prefix="P1" dimmed={potential < 1}>
        <GameDesc ns={ns} key18="ability.descPotential.2" />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  potential: [
    {
      type: 'fields',
      header: { icon: null, text: ch('potential_header') },
      description: <PotentialDescription />,
      fields: [],
    },
  ],
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('markedWithSilverStarCond'),
        description: <CoreDescription />,
        metadata: cond.markedWithSilverStar,
        fields: [
          fieldForBuff(buff.core_common_dmg_),
          fieldForBuff(buff.core_markedWithSilverStar_crit_dmg_),
        ],
        linked: ['abilityAftershock', 'm4_electric_resIgn'],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [fieldForBuff(buff.ability_crit_)],
    },
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityAftershockCond'),
        description: <AbilityConditionalDescription />,
        metadata: cond.abilityAftershock,
        fields: [fieldForBuff(buff.ability_aftershock_dmg_)],
        linked: ['markedWithSilverStar', 'm4_electric_resIgn'],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4_electric_resIgn'),
        description: (
          <GameDescSlice
            ns="char_Soldier0Anby_gen"
            key18="mindscapes.4.desc"
            from="When hitting an enemy marked with"
            to="Electric RES"
          />
        ),
        metadata: cond.m4_electric_resIgn,
        fields: [fieldForBuff(buff.m4_electric_resIgn_)],
        linked: ['markedWithSilverStar', 'abilityAftershock'],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m2_header') },
      description: (
        <GameDescSlice
          ns="char_Soldier0Anby_gen"
          key18="mindscapes.2.desc.0"
          from="Soldier 0 - Anby's CRIT Rate increases by"
          to="12%"
        />
      ),
      fields: [fieldForBuff(buff.m2_crit_)],
    },
  ],
  m6: [
    {
      type: 'fields',
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_additional_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
