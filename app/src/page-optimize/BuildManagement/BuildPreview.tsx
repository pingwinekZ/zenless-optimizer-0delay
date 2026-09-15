import { memo, useMemo } from 'react'
import type { CharacterKey } from '../../consts'
import { useCharacter, useTeam } from '../../db-ui'
import { CharacterPreview } from '../../page-characters/CharacterPreview'
import type { SavedBuild } from '../../zood'
import styles from './BuildsModal.module.css'
import { previewOverrideFromBuild } from './buildConverter'

/**
 * HSR parity: the build preview is the full showcase CharacterPreview with
 * the saved build applied as an override — the same card as the character
 * tab, showing stats, score, W-Engine and discs exactly as saved.
 */
export const BuildPreview = memo(function BuildPreview({
  characterKey,
  build,
}: {
  characterKey: CharacterKey
  build: SavedBuild | null
}) {
  const character = useCharacter(characterKey)
  const team = useTeam(characterKey)
  const override = useMemo(
    () =>
      build
        ? previewOverrideFromBuild(
            characterKey,
            { char: character, team },
            build
          )
        : null,
    [build, character, team, characterKey]
  )

  if (!character) return <div className={styles.emptyPreview}></div>
  return (
    <CharacterPreview characterKey={characterKey} buildOverride={override} />
  )
})
