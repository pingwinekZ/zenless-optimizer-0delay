import { isComboTarget, type TargetTag } from '@zenless-optimizer/zzz/db'
import type { Tag } from '@zenless-optimizer/zzz/formula'

export function isOptTargetTag(
  tag: Tag,
  target: TargetTag | undefined
): boolean {
  if (!target) return false
  // An active combo target highlights its hits; a staged rotation under a
  // single-target selection highlights only the single target.
  if (isComboTarget(target)) {
    return target.rotation.some(
      ({ sheet, name }) => tag.sheet === sheet && tag.name === name
    )
  }
  return (
    (tag.sheet === target.sheet && tag.name === target.name) ||
    target.q === tag.q
  )
}

/** Inset ring so opt-target rows show on striped `FieldDisplayList` rows. */
export const optTargetRowSx = {
  boxShadow: '0px 0px 0px 2px rgba(0, 200, 0, 0.55) inset',
} as const
