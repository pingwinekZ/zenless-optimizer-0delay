import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Seth } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Seth'
const ns = 'char_Seth_gen'
const [, ch] = trans('char', key)
const cond = Seth.conditionals
const buff = Seth.buffs
const formula = Seth.formulas

function CoreAnomProfDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDescSlice
          ns={ns}
          key18="mindscapes.1.desc"
          from="When <ct color=#FFFFFF>Shield of Firm Resolve</ct> ends"
          to="additional 10s"
        />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreAnomProfDescription />,
        metadata: cond.shield_active,
        fields: [fieldForBuff(buff.core_anomProf)],
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
        metadata: cond.chain_finish_hit,
        fields: [fieldForBuff(buff.ability_anomBuildupRes_)],
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
          from="Hitting an enemy with"
          to="by 35%"
        />
      ),
      header: { icon: null, text: ch('m2_header') },
      fields: [
        {
          title: (
            <ColorText
              color={getVariant(buff.m2_basic_electric_anomBuildup_.tag)}
            >
              {ch('m2_electrified_anomBuildup_')}
            </ColorText>
          ),
          fieldRef: buff.m2_basic_electric_anomBuildup_.tag,
        },
      ],
    },
  ],
  m4: [
    {
      type: 'fields',
      description: <GameDesc ns={ns} key18="mindscapes.4.desc" />,
      header: { icon: null, text: ch('m4_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(buff.m4_defensiveAssist_dazeInc_.tag)}>
              {ch('m4_thundershield_daze_')}
            </ColorText>
          ),
          fieldRef: buff.m4_defensiveAssist_dazeInc_.tag,
        },
      ],
    },
  ],
  m6: [
    {
      type: 'fields',
      description: <GameDesc ns={ns} key18="mindscapes.6.desc" />,
      header: { icon: null, text: ch('m6_header') },
      fields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    },
  ],
})

export default sheet
