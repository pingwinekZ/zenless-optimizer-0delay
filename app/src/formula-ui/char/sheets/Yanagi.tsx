import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Yanagi } from '../../../formula'
import { GameDesc, GameDescSlice } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  SkillGameDesc,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Yanagi'
const [, ch] = trans('char', key)
const cond = Yanagi.conditionals
const buff = Yanagi.buffs
const formula = Yanagi.formulas

const NS = 'char_Yanagi_gen'
const BASIC_DESC = 'basic.BasicAttackTsukuyomiKagura.desc'

function StanceDescription({ stance }: { stance: 'Jougen' | 'Kagen' }) {
  const paragraphs = stance === 'Jougen' ? [0, 3, 4, 6] : [0, 3, 5, 6]
  return (
    <>
      {paragraphs.map((p, i) => (
        <div
          key={p}
          style={{ marginBottom: i < paragraphs.length - 1 ? 8 : 0 }}
        >
          <GameDesc ns={NS} key18={`${BASIC_DESC}.${p}`} />
        </div>
      ))}
    </>
  )
}

function ThrustsDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <GameDesc ns={NS} key18="special.EXSpecialAttackGekkaRuten.desc.1" />
      </div>
      <div style={{ marginBottom: 8 }}>
        <GameDesc ns={NS} key18="special.EXSpecialAttackGekkaRuten.desc.2" />
      </div>
      <div>
        <SkillGameDesc
          characterKey={key}
          ns={NS}
          key18="special.EXSpecialAttackGekkaRuten.desc"
          paragraph={3}
        />
      </div>
      <PrefixedLine prefix="M2" dimmed={mindscape < 2}>
        <GameDescSlice
          ns={NS}
          key18="mindscapes.2.desc"
          from="Holding down the Special Attack button"
          to="extra thrusts"
        />
      </PrefixedLine>
      <PrefixedLine prefix="M6" dimmed={mindscape < 6}>
        <GameDescSlice
          ns={NS}
          key18="mindscapes.6.desc"
          from="The maximum number of times"
          to="halved"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    basic: {
      BasicAttackTsukuyomiKagura: [
        {
          type: 'conditional',
          conditional: {
            label: ch('jougenElectricDmgCond'),
            description: <StanceDescription stance="Jougen" />,
            metadata: cond.jougen,
            fields: [
              {
                title: (
                  <ColorText color={getVariant(buff.basic_electric_dmg_.tag)}>
                    {ch('basic_electric_dmg_')}
                  </ColorText>
                ),
                fieldRef: buff.basic_electric_dmg_.tag,
              },
            ],
          },
        },
        {
          type: 'conditional',
          conditional: {
            label: ch('kagenPenCond'),
            description: <StanceDescription stance="Kagen" />,
            metadata: cond.kagen,
            fields: [fieldForBuff(buff.basic_pen_)],
          },
        },
      ],
    },
    special: {
      EXSpecialAttackGekkaRuten: [
        {
          type: 'conditional',
          conditional: {
            label: ch('thrustsCond'),
            description: <ThrustsDescription />,
            metadata: cond.perSkill_thrusts,
            maxByMindscape: { 2: 2, 6: 4 },
            noDimWhenZero: true,
            fields: [
              {
                title: (
                  <ColorText color={getVariant(formula.polarity_dmg.tag)}>
                    {ch('polarityDisorderThrustsBuff')}
                  </ColorText>
                ),
                fieldRef: formula.polarity_dmg.tag,
              },
            ],
          },
        },
      ],
    },
    chain: {
      UltimateRaieiTenge: [
        {
          type: 'fields',
          header: { icon: null, text: ch('polarityDisorderChainHeader') },
          description: (
            <>
              <div style={{ marginBottom: 8 }}>
                <GameDesc
                  ns="char_Yanagi_gen"
                  key18="chain.UltimateRaieiTenge.desc.1"
                />
              </div>
              <div>
                <SkillGameDesc
                  characterKey={key}
                  ns="char_Yanagi_gen"
                  key18="chain.UltimateRaieiTenge.desc"
                  paragraph={2}
                />
              </div>
            </>
          ),
          fields: [
            {
              title: (
                <ColorText color={getVariant(formula.polarity_dmg_chain.tag)}>
                  {ch('polarityDisorderChainBuff')}
                </ColorText>
              ),
              fieldRef: formula.polarity_dmg_chain.tag,
            },
          ],
        },
      ],
    },
  },
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('abilityActiveCond'),
        description: (
          <>
            <GameDesc ns="char_Yanagi_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Yanagi_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.ability_active,
        fields: [fieldForBuff(buff.ability_electric_anomBuildup_)],
      },
    },
  ],
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreExSpecialCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.exSpecial_used,
        fields: [
          fieldForBuff(buff.core_addl_disorder_),
          {
            title: (
              <ColorText color={getVariant(buff.core_electric_dmg_.tag)}>
                {ch('core_electric_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.core_electric_dmg_.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('clarityAnomProfCond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.1.desc" />
        ),
        metadata: cond.clarity,
        fields: [fieldForBuff(buff.m1_anomProf)],
      },
    },
  ],

  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4ExposePenCond'),
        description: (
          <GameDesc ns="char_Yanagi_gen" key18="mindscapes.4.desc" />
        ),
        metadata: cond.exposed,
        fields: [fieldForBuff(buff.m4_pen_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6ShinrabanshouCond'),
        description: (
          <GameDescSlice
            ns="char_Yanagi_gen"
            key18="mindscapes.6.desc"
            from="After a thrust attack"
            to="by 20%"
          />
        ),
        metadata: cond.shinrabanshou,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m6_exSpecial_dmg_.tag)}>
                {ch('m6_exSpecial_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m6_exSpecial_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
