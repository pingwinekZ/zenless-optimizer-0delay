import { type DiscSetKey } from '../../consts'
import { Translate } from '../../i18n'
export function DiscSetName({ setKey }: { setKey: DiscSetKey }) {
  return <Translate ns="discNames_gen" key18={setKey} />
}
export function DiscSet2p({ setKey }: { setKey: DiscSetKey }) {
  return <Translate ns={`disc_${setKey}_gen`} key18="desc2" />
}

export function DiscSet4p({ setKey }: { setKey: DiscSetKey }) {
  return <Translate ns={`disc_${setKey}_gen`} key18="desc4" />
}
