/**
 * Parser for exported X (Twitter) bookmarks. Two shapes are understood.
 *
 * 1. Browser extensions that scrape the bookmarks page emit plain JSON:
 *
 *        [{ "id": "123", "url": "https://twitter.com/handle/status/123", … }]
 *
 * 2. The official data archive's `data/bookmark.js` is not JSON — it is a
 *    JavaScript assignment:
 *
 *        window.YTD.bookmark.part0 = [
 *          { "bookmark": { "tweetId": "123", "fullText": "…",
 *                          "expandedUrl": "https://twitter.com/i/web/status/123" } }
 *        ]
 *
 *    Large archives split these across `bookmark-part1.js`, `bookmark-part2.js`,
 *    … (`window.YTD.bookmark.part1`, …), so callers pass every part they find.
 *
 * These are the only supported sources: X does not expose bookmarks without
 * either a paid API tier or the account's session cookies.
 */

/** Matches the `window.YTD.bookmark.partN =` assignment prefix. */
const ASSIGNMENT = /^\s*(?:window\.)?YTD\.bookmark\.part\d+\s*=\s*/

/** Tweet ids from one archive part file, in file order. */
export function extractBookmarkIds(source: string): string[] {
  const body = source.replace(/^\uFEFF/, '').trim()
  if (!body) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(body.replace(ASSIGNMENT, ''))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const ids: string[] = []
  for (const entry of parsed) {
    const id = bookmarkIdFromEntry(entry)
    if (id) ids.push(id)
  }
  return ids
}

function bookmarkIdFromEntry(entry: unknown): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined
  const record = entry as Record<string, unknown>
  // Archive entries nest the payload under `bookmark`; extension exports put
  // `id`/`url` at the top level.
  const nested = record.bookmark
  return idFromFields(
    nested && typeof nested === 'object'
      ? (nested as Record<string, unknown>)
      : record
  )
}

function idFromFields(record: Record<string, unknown>): string | undefined {
  for (const candidate of [record.tweetId, record.id]) {
    if (typeof candidate === 'string' && /^\d+$/.test(candidate.trim())) {
      return candidate.trim()
    }
  }
  // Fall back to the permalink when the id field is missing or malformed.
  for (const candidate of [record.expandedUrl, record.url]) {
    if (typeof candidate !== 'string') continue
    const match = candidate.match(/\/status(?:es)?\/(\d+)/)
    if (match) return match[1]
  }
  return undefined
}

/** De-duplicated ids across parts, preserving first-seen order. */
export function bookmarkIdsFromParts(sources: readonly string[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const source of sources) {
    for (const id of extractBookmarkIds(source)) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

/** Canonical permalinks the widget's embed accepts. */
export function bookmarkTweetUrls(ids: readonly string[]): string[] {
  return ids.map((id) => `https://x.com/i/status/${id}`)
}

/**
 * Render the generated module. Kept in Biome's house style (single quotes, no
 * semicolons, trailing commas) so `bun biome ci` never wants to rewrite it.
 * The list is emitted one URL per line: arrays that are already broken across
 * lines stay broken under Biome's formatter.
 */
export function renderTweetsGen(urls: readonly string[]): string {
  const declaration =
    urls.length === 0
      ? ['export const GOON_BOOKMARK_TWEETS: string[] = []']
      : [
          'export const GOON_BOOKMARK_TWEETS: string[] = [',
          ...urls.map((url) => `  '${url}',`),
          ']',
        ]
  return [
    '// GENERATED FILE — do not edit by hand.',
    '// Source: exported X bookmarks (browser-extension JSON or data archive).',
    '// Regenerate: bun app/src/goonCorner/scripts/gen-bookmarks.ts <path>',
    '',
    ...declaration,
    '',
  ].join('\n')
}
