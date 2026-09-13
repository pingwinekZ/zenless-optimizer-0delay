import type { CharacterKey } from '../../../consts'
import { PanYinhu } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  PrefixedLine,
  useEffectiveMindscape,
} from '../sheetUtil'

const key: CharacterKey = 'PanYinhu'
const ns = 'char_PanYinhu_gen'
const [, ch] = trans('char', key)
const cond = PanYinhu.conditionals
const buff = PanYinhu.buffs
const formula = PanYinhu.formulas

function CoreDescription() {
  const mindscape = useEffectiveMindscape(key)
  return (
    <>
      <CoreGameDesc characterKey={key} />
      <PrefixedLine prefix="M6" dimmed={mindscape < 6}>
        <GameDesc ns={ns} key18="mindscapes.6.desc" />
      </PrefixedLine>
    </>
  )
}

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    chain: {
      UltimateAFeastFitForAnEmperor: [
        {
          type: 'fields',
          fields: [
            {
              title: ch('ultimate_heal'),
              fieldRef: formula.ultimate_heal.tag,
            },
            {
              title: ch('ultimate_healOverTime'),
              fieldRef: formula.ultimate_healOverTime.tag,
            },
          ],
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreDescription />,
        metadata: cond.meridian_flow,
        targeted: true,
        fields: [fieldForBuff(buff.core_sheerForce)],
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
        metadata: cond.depleted_qi,
        linked: ['depleted_qi_m1'],
        fields: [fieldForBuff(buff.ability_dmgInc_)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.1.desc" />,
        metadata: cond.depleted_qi_m1,
        linked: ['depleted_qi'],
        fields: [fieldForBuff(buff.m1_dmgInc_)],
      },
    },
  ],
})

export default sheet
