import type { TargetTag } from '../db'
import type { Tag } from '../formula'

export function isOptTargetTag(
  tag: Tag,
  target: TargetTag | undefined
): boolean {
  if (!target) return false
  if (target.rotation) {
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
