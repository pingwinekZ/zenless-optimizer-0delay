import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { read } from '@zenless-optimizer/pando/engine'
import { commonDefIcon, mindscapeDefIcon } from '../../../assets'
import type { CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { Burnice } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Burnice'
const [, ch] = trans('char', key)
const cond = Burnice.conditionals
const buff = Burnice.buffs
const formula = Burnice.formulas

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDesc ns="char_Burnice_gen" key18="mindscapes.1.desc" />
      </PrefixedLine>
    </>
  )
}

function PotentialDescription() {
  const char = useCharacter(key)
  const potential = char?.potential ?? 0
  return (
    <PrefixedLine prefix="P2+" dimmed={potential < 2}>
      <GameDesc
        ns="char_Burnice_gen"
        key18={`potential.desc.${Math.max(potential, 2)}`}
      />
    </PrefixedLine>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      EXSpecialAttackIntenseHeatTossingMethod: [
        {
          type: 'fields',
          header: {
            icon: <ImgIcon src={commonDefIcon('specialFlat')} size={1.5} />,
            text: ch('abloom'),
          },
          fields: [
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_ether_abloomDmg.tag)}
                >
                  {ch('exSpecial_ether_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_ether_abloomDmg.tag,
            },
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_electric_abloomDmg.tag)}
                >
                  {ch('exSpecial_electric_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_electric_abloomDmg.tag,
            },
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_fire_abloomDmg.tag)}
                >
                  {ch('exSpecial_fire_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_fire_abloomDmg.tag,
            },
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_physical_abloomDmg.tag)}
                >
                  {ch('exSpecial_physical_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_physical_abloomDmg.tag,
            },
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_ice_abloomDmg.tag)}
                >
                  {ch('exSpecial_ice_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_ice_abloomDmg.tag,
            },
            {
              title: (
                <ColorText
                  color={getVariant(formula.exSpecial_wind_abloomDmg.tag)}
                >
                  {ch('exSpecial_wind_abloomDmg')}
                </ColorText>
              ),
              fieldRef: formula.exSpecial_wind_abloomDmg.tag,
            },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('core_header'),
      },
      description: <CoreDescription />,
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.core_afterburn_dmg.tag)}>
              {ch('core_afterburn_dmg')}
            </ColorText>
          ),
          fieldRef: formula.core_afterburn_dmg.tag,
        },
        {
          title: ch('core_afterburn_anomBuildup'),
          fieldRef: formula.core_afterburn_anomBuildup.tag,
        },
      ],
    },
    {
      type: 'text',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(1)} size={1.5} />,
        text: ch('m1_header'),
      },
      text: <GameDesc ns="char_Burnice_gen" key18="mindscapes.1.desc" />,
    },
  ],
  potential: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={commonDefIcon('coreFlat')} size={1.5} />,
        text: ch('potential_header'),
      },
      description: <PotentialDescription />,
      fields: [
        { ...fieldForBuff(buff.potential_anomMas), minPotential: 2 },
        { ...fieldForBuff(buff.potential_common_dmg_), minPotential: 2 },
      ],
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDesc ns="char_Burnice_gen" key18="mindscapes.2.desc" />
        ),
        metadata: cond.thermal_penetration,
        fields: [fieldForBuff(buff.m2_pen_)],
      },
    },
  ],
  m4: [
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(4)} size={1.5} />,
        text: ch('m4_header'),
      },
      description: <GameDesc ns="char_Burnice_gen" key18="mindscapes.4.desc" />,
      fields: [
        {
          title: ch('m4_exSpecial_crit_'),
          fieldRef: buff.m4_exSpecial_crit_.tag,
        },
        {
          title: ch('m4_assistSkill_crit_'),
          fieldRef: buff.m4_assistSkill_crit_.tag,
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
          <GameDescSlice
            ns="char_Burnice_gen"
            key18="mindscapes.6.desc"
            from="After hitting an enemy"
            to="will ignore 25%"
          />
        ),
        metadata: cond.exSpecial_active,
        fields: [
          fieldForBuff(buff.m6_burn_fire_resIgn_),
          {
            title: ch('m6_fire_resIgn'),
            fieldRef: buff.m6_burn_fire_resIgn_.tag,
          },
        ],
      },
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: ch('m6_additional_afterburn_header'),
      },
      description: (
        <GameDescSlice
          ns="char_Burnice_gen"
          key18="mindscapes.6.desc"
          from="When Burnice hits an enemy"
          to="does not consume"
        />
      ),
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(formula.m6_additional_afterburn_dmg.tag)}
            >
              {ch('m6_additional_afterburn_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_additional_afterburn_dmg.tag,
        },
      ],
    },
    {
      type: 'fields',
      header: {
        icon: <ImgIcon src={mindscapeDefIcon(6)} size={1.5} />,
        text: ch('m6_burn_header'),
      },
      description: (
        <GameDescSlice
          ns="char_Burnice_gen"
          key18="mindscapes.6.desc"
          from="fire blast hits an enemy"
          to="once every 20s"
          capitalize={true}
        />
      ),
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_burn_dmg.tag)}>
              {ch('m6_burn_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_burn_dmg.tag,
        },
      ],
    },
    {
      type: 'text',
      text: (calc) => {
        const val = calc.compute(read(formula.m6_burn_dmg.tag)).val ?? 0
        const dps = val * 2
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{ch('m6_burn_dmg')} (DPS)</span>
            <span>{dps.toFixed(0)}</span>
          </div>
        )
      },
    },
  ],
})

export default sheet
