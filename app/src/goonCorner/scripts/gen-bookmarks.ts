import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  bookmarkIdsFromParts,
  bookmarkTweetUrls,
  renderTweetsGen,
} from '../bookmarkArchive'

/**
 * Regenerates `tweets_gen.ts` from exported X bookmarks.
 *
 * X does not expose bookmarks without a paid API tier or the account's session
 * cookies, so both supported sources are user-initiated exports:
 *
 *  - a bookmark-export browser extension's JSON (e.g.
 *    `~/Downloads/twitter-Bookmarks-1234567890.json`), or
 *  - the official data archive (`data/bookmark.js`, plus `bookmark-part1.js` …)
 *    from Settings → Your Account → Download an archive of your data.
 *
 * Point it at a single export file or at a folder; a folder contributes every
 * bookmark source it contains (archive parts in order, and any `*ookmarks*.json`
 * exports), de-duplicated by tweet id.
 *
 * This runs as part of `gen-file`, which CI executes. With nothing configured
 * it prints a notice and exits 0 *without writing*, so CI's clean-worktree
 * check still passes.
 */
const OUT_FILE = fileURLToPath(new URL('../tweets_gen.ts', import.meta.url))

/** `bookmark.js` is part 0; `bookmark-part7.js` is part 7. */
function partNumber(file: string): number {
  return Number(file.match(/-part(\d+)\.js$/)?.[1] ?? 0)
}

/** Source files under a path (a file, an archive root, or its data/). */
function collectSourceFiles(target: string): string[] {
  if (!existsSync(target)) return []
  if (statSync(target).isFile()) return [target]

  const files: string[] = []
  for (const dir of [target, join(target, 'data')]) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (
        /^bookmark(-part\d+)?\.js$/.test(name) ||
        /bookmarks.*\.json$/i.test(name)
      ) {
        files.push(join(dir, name))
      }
    }
  }
  // Stable order, with multi-part archives (bookmark, then part1, part2, …)
  // before extension exports.
  return files.sort(
    (a, b) => partNumber(a) - partNumber(b) || a.localeCompare(b)
  )
}

const target =
  process.argv[2] ?? process.env.X_BOOKMARKS_FILE ?? process.env.X_ARCHIVE_DIR

if (!target) {
  console.log(
    'gen-bookmarks: no bookmark export configured — leaving tweets_gen.ts as-is.'
  )
  console.log(
    '  pass a path:  bun app/src/goonCorner/scripts/gen-bookmarks.ts ~/Downloads/twitter-Bookmarks-1234.json'
  )
  console.log(
    '  or set X_BOOKMARKS_FILE to the export (or X_ARCHIVE_DIR to the archive root).'
  )
  process.exit(0)
}

const files = collectSourceFiles(target)
if (files.length === 0) {
  console.error(`gen-bookmarks: no bookmark export found under ${target}`)
  console.error(
    'Expected a bookmark-export JSON (*ookmarks*.json) or an archive data/bookmark.js.'
  )
  process.exit(1)
}

const ids = bookmarkIdsFromParts(
  files.map((file) => readFileSync(file, 'utf-8'))
)
if (ids.length === 0) {
  console.warn(
    `gen-bookmarks: read ${files.length} file(s) but found no bookmark ids — leaving tweets_gen.ts untouched.`
  )
  process.exit(0)
}

writeFileSync(OUT_FILE, renderTweetsGen(bookmarkTweetUrls(ids)))
console.log(
  `gen-bookmarks: wrote ${ids.length} bookmarks to tweets_gen.ts (from ${files.length} file(s))`
)
