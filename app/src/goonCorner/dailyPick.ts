import { GOON_BOOKMARK_TWEETS } from './tweets_gen'

/**
 * localStorage keys owned by the Goon Corner widget. The pick keys
 * (`queue`/`seen`/`invalid`/`current`) hold per-user daily state; `open`,
 * `geom` and `dismissed` hold the widget UI preferences.
 */
export const GOON_STORAGE_KEYS = {
  queue: 'goon-queue',
  seen: 'goon-seen',
  invalid: 'goon-invalid',
  current: 'goon-current',
  open: 'goon-open',
  geom: 'goon-geom',
  intro: 'goon-intro-seen',
  dismissed: 'goon-dismissed',
} as const

/** The tweet currently on screen and the local day it was picked for. */
export interface GoonCurrent {
  id: string
  date: string
}

/** Per-user pick state, persisted across reloads. */
export interface GoonState {
  /** Randomly ordered ids not yet consumed this cycle. */
  queue: string[]
  /** Ids already served this cycle; excluded from `queue`. */
  seen: string[]
  /** Ids confirmed deleted/private; never served again. */
  invalid: string[]
  /** Today's pick, or null when there is nothing left to serve. */
  current: GoonCurrent | null
}

/** The slice of the Web Storage API this module needs (tests pass a stub). */
export interface GoonStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Local `YYYY-MM-DD` key, so the pick flips at local midnight (not UTC). */
export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extract the numeric status id from an X/Twitter link. Bare numeric ids are
 * accepted so list entries can be written without a full URL.
 */
export function parseTweetId(url: string): string | undefined {
  const trimmed = url.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  if (!/(?:^|\/\/)(?:[\w-]+\.)?(?:twitter|x)\.com\//i.test(trimmed)) {
    return undefined
  }
  return trimmed.match(/\/status(?:es)?\/(\d+)/)?.[1]
}

/** Fisher-Yates shuffle; `random` is injectable for deterministic tests. */
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random
): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

function unique(items: readonly string[]): string[] {
  return Array.from(new Set(items))
}

/** Parsed, de-duplicated, order-preserving ids from the tweet list. */
export function goonIds(
  urls: readonly string[] = GOON_BOOKMARK_TWEETS
): string[] {
  return unique(
    urls.map((url) => parseTweetId(url)).filter((id): id is string => !!id)
  )
}

function parseStringArray(raw: string | null): string[] | undefined {
  if (raw === null) return undefined
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is string => typeof item === 'string' && item.length > 0
    )
  } catch {
    return []
  }
}

function parseCurrent(raw: string | null): GoonCurrent | null {
  if (raw === null) return null
  try {
    const value = JSON.parse(raw) as { id?: unknown; date?: unknown }
    if (
      typeof value?.id === 'string' &&
      value.id &&
      typeof value?.date === 'string' &&
      value.date
    ) {
      return { id: value.id, date: value.date }
    }
    return null
  } catch {
    return null
  }
}

/** Read persisted state, or null when this user has never been initialized. */
export function readState(storage: GoonStorage): GoonState | null {
  const queue = parseStringArray(storage.getItem(GOON_STORAGE_KEYS.queue))
  if (queue === undefined) return null
  return {
    queue,
    seen: parseStringArray(storage.getItem(GOON_STORAGE_KEYS.seen)) ?? [],
    invalid: parseStringArray(storage.getItem(GOON_STORAGE_KEYS.invalid)) ?? [],
    current: parseCurrent(storage.getItem(GOON_STORAGE_KEYS.current)),
  }
}

export function writeState(storage: GoonStorage, state: GoonState): void {
  storage.setItem(GOON_STORAGE_KEYS.queue, JSON.stringify(state.queue))
  storage.setItem(GOON_STORAGE_KEYS.seen, JSON.stringify(state.seen))
  storage.setItem(GOON_STORAGE_KEYS.invalid, JSON.stringify(state.invalid))
  storage.setItem(GOON_STORAGE_KEYS.current, JSON.stringify(state.current))
}

/** Splice fresh ids into the queue at random spots so orders diverge per user. */
function injectRandomly(
  queue: readonly string[],
  ids: readonly string[],
  random: () => number
): string[] {
  const out = [...queue]
  for (const id of ids) {
    const at = Math.floor(random() * (out.length + 1))
    out.splice(at, 0, id)
  }
  return out
}

interface PickContext {
  queue: string[]
  usable: string[]
  today: string
  random: () => number
}

interface Picked {
  queue: string[]
  current: GoonCurrent | null
  /** True when the queue ran dry and a fresh cycle was reshuffled. */
  cycled: boolean
}

function pickNext(context: PickContext, exclude: string | null): Picked {
  const queue = [...context.queue]
  const next = queue.shift()
  if (next) {
    return { queue, current: { id: next, date: context.today }, cycled: false }
  }
  // Exhausted (should not happen while the list keeps growing): start a new
  // cycle over everything still usable, minus the tweet we just served.
  let candidates = shuffle(
    context.usable.filter((id) => id !== exclude),
    context.random
  )
  // A single-tweet list has nothing but the tweet we just served; repeat it
  // rather than going blank until the owner adds more.
  if (candidates.length === 0 && context.usable.length > 0) {
    candidates = shuffle(context.usable, context.random)
  }
  const first = candidates.shift()
  return {
    queue: candidates,
    current: first ? { id: first, date: context.today } : null,
    cycled: true,
  }
}

export interface GoonPickOptions {
  /** Persisted state from `readState`, or null on a user's first run. */
  state: GoonState | null
  allIds: readonly string[]
  today: string
  random?: () => number
}

/**
 * Return the state that should be on screen for `today`: initialize the queue
 * on first run, inject newly added links, roll over at local midnight, and
 * refuse to serve anything already seen or marked invalid.
 */
export function resolveDailyPick({
  state,
  allIds,
  today,
  random = Math.random,
}: GoonPickOptions): GoonState {
  const base = state ?? { queue: [], seen: [], invalid: [], current: null }
  const invalid = unique(base.invalid)
  const usable = unique(allIds).filter((id) => !invalid.includes(id))
  let seen = unique(base.seen).filter((id) => !invalid.includes(id))
  let queue = unique(base.queue).filter(
    (id) => !invalid.includes(id) && !seen.includes(id)
  )
  const current =
    base.current && !invalid.includes(base.current.id) ? base.current : null

  const known = new Set([
    ...queue,
    ...seen,
    ...invalid,
    ...(current ? [current.id] : []),
  ])
  queue = injectRandomly(
    queue,
    usable.filter((id) => !known.has(id)),
    random
  )

  if (current && current.date === today) {
    return { queue, seen, invalid, current }
  }
  if (current) seen = unique([...seen, current.id])

  const picked = pickNext({ queue, usable, today, random }, current?.id ?? null)
  return {
    queue: picked.queue,
    seen: picked.cycled ? [] : seen,
    invalid,
    current: picked.current,
  }
}

export interface GoonSkipOptions {
  state: GoonState
  allIds: readonly string[]
  today: string
  random?: () => number
}

/**
 * Deleted/private tweet: retire the id (it is not counted as `seen` and does
 * not consume the day) and serve the next queued one for the same day.
 */
export function markCurrentInvalid({
  state,
  allIds,
  today,
  random = Math.random,
}: GoonSkipOptions): GoonState {
  const current = state.current
  if (!current) return state
  const invalid = unique([...state.invalid, current.id])
  const usable = unique(allIds).filter((id) => !invalid.includes(id))
  const seen = unique(state.seen).filter((id) => !invalid.includes(id))
  const queue = unique(state.queue).filter(
    (id) => !invalid.includes(id) && !seen.includes(id)
  )
  const picked = pickNext({ queue, usable, today, random }, null)
  return {
    queue: picked.queue,
    seen: picked.cycled ? [] : seen,
    invalid,
    current: picked.current,
  }
}
