import { ColorText } from '@zenless-optimizer/common/ui'
import type { CharacterKey } from '../../../consts'
import { Anby } from '../../../formula'
import { GameDesc } from '../../../i18n'
import { trans } from '../../util'
import { CoreGameDesc, createBaseSheet, fieldForBuff } from '../sheetUtil'
import { getVariant } from '../util'

const key: CharacterKey = 'Anby'
const ns = 'char_Anby_gen'
const [, ch] = trans('char', key)
const cond = Anby.conditionals
const buff = Anby.buffs

const sheet = createBaseSheet(key, {
  core: [
    {
      type: 'conditional',
      conditional: {
        label: ch('coreCond'),
        description: <CoreGameDesc characterKey={key} />,
        metadata: cond.core_after3rdBasic,
        fields: [
          {
            title: (
              <ColorText
                color={getVariant(buff.core_after3rdBasic_dazeInc_.tag)}
              >
                {ch('core_dazeInc_')}
              </ColorText>
            ),
            fieldRef: buff.core_after3rdBasic_dazeInc_.tag,
          },
        ],
      },
    },
  ],
  m1: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m1Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.1.desc" />,
        metadata: cond.m1After4thBasicHit,
        fields: [fieldForBuff(buff.m1_after4thHit_energyRegen_)],
      },
    },
  ],
  m2: [
    {
      type: 'fields',
      description: <GameDesc ns={ns} key18="mindscapes.2.desc" />,
      header: { icon: null, text: ch('m2_header') },
      fields: [
        fieldForBuff(buff.m2_stunned_basic_dmg_),
        fieldForBuff(buff.m2_unstunned_ex_dazeInc_),
      ],
    },
  ],
  m6: [
    {
      type: 'conditional',
      conditional: {
        label: ch('m6Cond'),
        description: <GameDesc ns={ns} key18="mindscapes.6.desc" />,
        metadata: cond.m6ChargeConsumed,
        fields: [
          fieldForBuff(buff.m6_charge_basic_dmg_),
          fieldForBuff(buff.m6_charge_dash_dmg_),
        ],
      },
    },
  ],
})

export default sheet
