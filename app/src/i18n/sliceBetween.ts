/**
 * Extracts a substring of `text` starting at the first occurrence of `from`
 * and extending through the end of the sentence containing the first
 * occurrence of `to` (i.e. through the next `.`, or to the end of the
 * string if there is no period).
 *
 * Markup such as `<ct color=...>` is preserved verbatim so the result can
 * be rendered with the same rich-text path as the full description.
 *
 * Returns `undefined` when either marker is not found.
 */
export function sliceBetween(
  text: string,
  from: string,
  to: string
): string | undefined {
  const start = text.indexOf(from)
  if (start < 0) return undefined
  const toIdx = text.indexOf(to, start + from.length)
  if (toIdx < 0) return undefined
  const end = text.indexOf('.', toIdx)
  if (end < 0) return text.slice(start)
  return text.slice(start, end + 1)
}
