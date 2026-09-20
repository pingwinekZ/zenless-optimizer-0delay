import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Piper } from '@zenless-optimizer/zzz/formula'
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

const key: CharacterKey = 'Piper'
const ns = 'char_Piper_gen'
const [, ch] = trans('char', key)
const cond = Piper.conditionals
const buff = Piper.buffs

// M1 raises the Power cap from 20 to 30
const powerMaxByMindscape = { 0: 20, 1: 30 }

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M1" dimmed={mindscape < 1}>
        <GameDesc ns={ns} key18="mindscapes.1.desc" />
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
        description: <CoreDescription />,
        metadata: cond.power,
        linked: ['power_ability', 'power_m2'],
        maxByMindscape: powerMaxByMindscape,
        fields: [fieldForBuff(buff.core_physical_anomBuildup_)],
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
        metadata: cond.power_ability,
        linked: ['power', 'power_m2'],
        maxByMindscape: powerMaxByMindscape,
        fields: [fieldForBuff(buff.ability_common_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: (
          <GameDescSlice
            ns={ns}
            key18="mindscapes.2.desc"
            from="When using"
            to="further increased by 1%"
          />
        ),
        metadata: cond.power_m2,
        linked: ['power', 'power_ability'],
        maxByMindscape: powerMaxByMindscape,
        fields: [
          {
            title: (
              <ColorText color={getVariant(buff.m2_physical_dmg_.tag)}>
                {ch('m2_oneTrillionTons_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_physical_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_physical_dmg_.tag)}>
                {ch('m2_reallyHeavy_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_physical_dmg_.tag,
          },
          {
            title: (
              <ColorText color={getVariant(buff.m2_physical_dmg_.tag)}>
                {ch('m2_holdOnTight_dmg_')}
              </ColorText>
            ),
            fieldRef: buff.m2_physical_dmg_.tag,
          },
        ],
      },
    },
  ],
})

export default sheet
