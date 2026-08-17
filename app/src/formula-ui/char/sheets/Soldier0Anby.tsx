import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Soldier0Anby } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
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
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <GameDescSlice
        ns="char_Soldier0Anby_gen"
        key18={`core.desc.${coreLevel}.0`}
        from="Soldier 0 - Anby deals"
        to="of Soldier 0 - Anby's CRIT DMG"
      />
      <PrefixedLine prefix="P1" dimmed={potential < 1}>
        <GameDescSlice
          ns="char_Soldier0Anby_gen"
          key18={`core.desc.${coreLevel}.1`}
          from="The Aftershock CRIT DMG bonus from Silver Star"
          to="Soldier 0 - Anby's CRIT DMG"
        />
      </PrefixedLine>
      <PrefixedLine prefix="M4" dimmed={mindscape < 4}>
        <GameDescSlice
          ns="char_Soldier0Anby_gen"
          key18="mindscapes.4.desc"
          from="When hitting an enemy marked with"
          to="Electric RES"
        />
      </PrefixedLine>
    </>
  )
}

function AbilityDescription() {
  const potential = useCharacter(key)?.potential ?? 0
  return (
    <>
      <GameDesc ns="char_Soldier0Anby_gen" key18="ability.desc.0" />
      <div style={{ marginTop: 8 }}>
        <GameDesc ns="char_Soldier0Anby_gen" key18="ability.desc.1" />
      </div>
      <PrefixedLine prefix="P1" dimmed={potential < 1}>
        <GameDesc ns="char_Soldier0Anby_gen" key18="ability.desc.2" />
      </PrefixedLine>
      <PrefixedLine prefix="P2+" dimmed={potential < 2}>
        <GameDesc
          ns="char_Soldier0Anby_gen"
          key18={`potential.desc.${Math.max(potential, 2)}`}
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  potential: [],
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
          fieldForBuff(buff.m4_electric_resIgn_),
        ],
      },
    },
  ],
  ability: [
    {
      type: 'fields',
      header: { icon: null, text: ch('ability_header') },
      description: <AbilityDescription />,
      fields: [
        fieldForBuff(buff.ability_crit_),
        fieldForBuff(buff.ability_aftershock_dmg_),
      ],
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
