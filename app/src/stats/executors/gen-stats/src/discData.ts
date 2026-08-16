import { objMap } from '@zenless-optimizer/common/util'
import type { DiscSetKey } from '../../../../consts'
import { discsDetailedJSONData } from '../../../../dm'
import type { DiscDatum } from '../../../disc'

export type discsData = Record<DiscSetKey, DiscDatum>
export function getDiscsData(): discsData {
  return objMap(discsDetailedJSONData, (_d) => ({}))
}
