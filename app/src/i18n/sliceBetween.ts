/**
 * Extracts a substring of `text` starting at the first occurrence of `from`
 * and extending through the end of the sentence containing the first
 * occurrence of `to` (i.e. through the next `.`, or to the end of the
 * string if there is no period). When `opts.exact` is set, the slice ends at
 * the end of the `to` marker instead, allowing a clause that ends mid-sentence
 * to be isolated.
 *
 * Markup such as `<ct color=...>` is preserved verbatim so the result can
 * be rendered with the same rich-text path as the full description.
 *
 * Returns `undefined` when either marker is not found or `to` precedes `from`.
 */
export function sliceBetween(
  text: string,
  from: string,
  to: string,
  opts?: { exact?: boolean }
): string | undefined {
  const start = text.indexOf(from)
  if (start < 0) return undefined
  const toIdx = text.indexOf(to, start + from.length)
  if (toIdx < 0) return undefined
  if (opts?.exact) {
    const slice = text.slice(start, toIdx + to.length)
    return /[.!?]$/.test(slice) ? slice : slice + '.'
  }
  const end = text.indexOf('.', toIdx)
  if (end < 0) return text.slice(start)
  return text.slice(start, end + 1)
}
