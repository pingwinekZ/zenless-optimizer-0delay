import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'
import { Lucy } from '@zenless-optimizer/zzz/formula'
import { GameDesc, GameDescSlice } from '@zenless-optimizer/zzz/i18n'
import { trans } from '../../util'
import {
  condSection,
  createBaseSheet,
  fieldsSection,
  SkillGameDesc,
} from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Lucy'
const [, ch] = trans('char', key)
const cond = Lucy.conditionals
const buff = Lucy.buffs
const formula = Lucy.formulas

const sheet = createBaseSheet(key, {
  perSkillAbility: {
    special: {
      CheerOn: [
        condSection(cond.cheerOn, [buff.exSpecial_atk], {
          label: ch('cheerOnCond'),
          description: (
            <SkillGameDesc
              characterKey={key}
              ns="char_Lucy_gen"
              key18="special.CheerOn.desc"
            />
          ),
          linked: ['cheerOn_m4'],
        }),
      ],
    },
  },
  m4: [
    condSection(cond.cheerOn_m4, [buff.m4_crit_dmg_], {
      label: ch('cheerOnM4Cond'),
      description: <GameDesc ns="char_Lucy_gen" key18="mindscapes.4.desc" />,
      linked: ['cheerOn'],
    }),
  ],
  m6: [
    fieldsSection(ch('m6_additional_dmg'), [], {
      description: (
        <GameDescSlice
          ns="char_Lucy_gen"
          key18="mindscapes.6.desc"
          from="When another squad member in the"
          to="300% of the guard boar's ATK"
        />
      ),
      extraFields: [
        {
          title: (
            <ColorText color={getVariant(formula.m6_dmg.tag)}>
              {ch('m6_guard_boar_dmg')}
            </ColorText>
          ),
          fieldRef: formula.m6_dmg.tag,
        },
      ],
    }),
  ],
})

export default sheet
