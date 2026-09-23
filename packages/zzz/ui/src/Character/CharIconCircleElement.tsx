import { Image } from '@mantine/core'
import { characterAsset } from '@zenless-optimizer/zzz/assets'
import type { CharacterKey } from '@zenless-optimizer/zzz/consts'

export function CharIconCircle({
  characterKey,
}: {
  characterKey: CharacterKey
}) {
  const charAsset = characterAsset(characterKey, 'circle')
  return <Image src={charAsset} w="1.5em" h="1.5em" />
}
