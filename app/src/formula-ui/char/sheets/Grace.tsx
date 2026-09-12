import type { CharacterKey } from '../../../consts'
import { Grace } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  AbilityBodyText,
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
} from '../sheetUtil'

const key: CharacterKey = 'Grace'
const [, ch] = trans('char', key)
const cond = Grace.conditionals
const buff = Grace.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('fullZapCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.fullZap,
        fields: [
          fieldForBuff(buff.core_special_electric_anomBuildup_),
          fieldForBuff(buff.core_exSpecial_electric_anomBuildup_),
        ],
        linked: ['m6_fullZap'],
      },
    },
  ],
  ability: [
    {
      type: 'conditional',
      conditional: {
        label: ch('exSpecialHitCond'),
        description: (
          <>
            <GameDesc ns="char_Grace_gen" key18="ability.desc.0" />
            <AbilityBodyText characterKey={key}>
              <GameDesc ns="char_Grace_gen" key18="ability.desc.1" />
            </AbilityBodyText>
          </>
        ),
        metadata: cond.exSpecialHit,
        fields: [fieldForBuff(buff.ability_shock_dmg_)],
      },
    },
  ],
  potential: [
    {
      type: 'conditional',
      conditional: {
        label: ch('zapConsumedCond'),
        description: <GameDesc ns="char_Grace_gen" key18="potential.desc.6" />,
        metadata: cond.zapConsumed,
        fields: [fieldForBuff(buff.potential_electric_dmg_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('grenadeHitCond'),
        description: <GameDesc ns="char_Grace_gen" key18="mindscapes.2.desc" />,
        metadata: cond.grenadeHit,
        fields: [
          fieldForBuff(buff.m2_electric_resRed_),
          fieldForBuff(buff.m2_electric_anomBuildupResRed_),
        ],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6FullZapCond'),
        description: <GameDesc ns="char_Grace_gen" key18="mindscapes.6.desc" />,
        metadata: cond.m6_fullZap,
        fields: [
          fieldForBuff(buff.m6_special_mv_mult_),
          fieldForBuff(buff.m6_exSpecial_mv_mult_),
        ],
        linked: ['fullZap'],
      },
    },
  ],
})

export default sheet
