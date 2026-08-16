import type { CharacterKey } from '../../../consts'
import { Sunna } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import {
  CoreGameDesc,
  createBaseSheet,
  fieldForBuff,
  SkillGameDesc,
} from '../sheetUtil'

const key: CharacterKey = 'Sunna'
const [, ch] = trans('char', key)
const cond = Sunna.conditionals
const buff = Sunna.buffs

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      EXSpecialAttackSpecialPhotographyTechnique: [
        {
          type: 'conditional',
          conditional: {
            label: ch('etherVeilRepriseCond'),
            description: (
              <SkillGameDesc
                characterKey={key}
                ns="char_Sunna_gen"
                key18="special.EXSpecialAttackSpecialPhotographyTechnique.desc"
              />
            ),
            metadata: cond.etherVeilReprise,
            fields: [fieldForBuff(buff.ability_atk_flat)],
          },
        },
      ],
    },
  },
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} paragraph={0} />,
        metadata: cond.boolConditional,
        fields: [fieldForBuff(buff.core_atk)],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.1.desc" />,
        metadata: cond.m1DefReductionStacks,
        fields: [fieldForBuff(buff.m1_defRed_)],
      },
    },
  ],
  m2: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m2Cond'),
        description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.2.desc" />,
        metadata: cond.etherVeil,
        fields: [fieldForBuff(buff.m2_etherVeil_atk)],
      },
    },
  ],
  m4: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m4Cond'),
        description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.4.desc" />,
        metadata: cond.ult_used,
        fields: [fieldForBuff(buff.m4_dmg_)],
      },
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns="char_Sunna_gen" key18="mindscapes.6.desc" />,
        metadata: cond.focusedCreation,
        fields: [fieldForBuff(buff.m6_crit_), fieldForBuff(buff.m6_crit_dmg_)],
      },
    },
  ],
})

export default sheet
