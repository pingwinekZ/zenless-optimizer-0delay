/**
 * Media lookup for the Goon Corner hybrid gallery. The official X embed is a
 * cross-origin iframe, so image clicks inside it cannot be intercepted. This
 * module fetches the same tweet's media through the public FxEmbed v2 API
 * (`https://api.fxtwitter.com/2/status/{id}`, CORS `*`, no key) so the widget
 * can show photos/videos fullscreen in its own modal while keeping the
 * official embed for text and likes.
 */

export interface GoonMediaItem {
  type: 'photo' | 'video' | 'gif'
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
}

const MEDIA_API = 'https://api.fxtwitter.com/2/status'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isMediaType(value: unknown): value is GoonMediaItem['type'] {
  return value === 'photo' || value === 'video' || value === 'gif'
}

function toMediaItem(entry: unknown): GoonMediaItem | undefined {
  if (!isRecord(entry)) return undefined
  const url = entry['url']
  if (typeof url !== 'string' || !url) return undefined
  const rawType = entry['type']
  // `all` entries carry `type`; legacy `photos`/`videos` buckets may not, so
  // infer from the bucket when the caller passes it in.
  const type = isMediaType(rawType) ? rawType : undefined
  if (!type) return undefined
  const item: GoonMediaItem = { type, url }
  const thumbnailUrl = entry['thumbnail_url']
  if (typeof thumbnailUrl === 'string' && thumbnailUrl) {
    item.thumbnailUrl = thumbnailUrl
  }
  const width = entry['width']
  if (typeof width === 'number' && Number.isFinite(width)) item.width = width
  const height = entry['height']
  if (typeof height === 'number' && Number.isFinite(height)) {
    item.height = height
  }
  return item
}

function bucketed(
  entry: unknown,
  fallback: GoonMediaItem['type']
): GoonMediaItem | undefined {
  if (!isRecord(entry)) return undefined
  const withType: Record<string, unknown> = { ...entry }
  if (!isMediaType(withType['type'])) withType['type'] = fallback
  return toMediaItem(withType)
}

/**
 * Pull media items out of an FxEmbed v2 payload. Prefers `status.media.all`
 * (mixed photos/videos in post order), falls back to `photos` + `videos`.
 * Returns `[]` for text-only or unrecognized payloads — never throws.
 */
export function parseStatusMedia(payload: unknown): GoonMediaItem[] {
  if (!isRecord(payload)) return []
  const status = payload['status']
  if (!isRecord(status)) return []
  const media = status['media']
  if (!isRecord(media)) return []
  const all = media['all']
  if (Array.isArray(all)) {
    const items = all
      .map((entry) => toMediaItem(entry))
      .filter((item): item is GoonMediaItem => !!item)
    if (items.length > 0) return items
  }
  const photos = media['photos']
  const videos = media['videos']
  const items: GoonMediaItem[] = []
  if (Array.isArray(photos)) {
    for (const entry of photos) {
      const item = bucketed(entry, 'photo')
      if (item) items.push(item)
    }
  }
  if (Array.isArray(videos)) {
    for (const entry of videos) {
      const item = bucketed(entry, 'video')
      // A bucketed `gif` keeps its own type; only videos without one land here.
      if (item) items.push(item)
    }
  }
  return items
}

export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>

/**
 * Confirm whether a tweet is actually gone (deleted, private or suspended).
 * Resolves `true` only on definitive FxEmbed gone signals (HTTP or API 404 /
 * 401); every other outcome — tweet exists, rate-limited, network or timeout
 * failure — resolves `false` so callers never retire a live bookmark over a
 * transient error. Never rejects.
 */
export async function isGoonTweetGone(
  id: string,
  fetchImpl: FetchImpl = fetch,
  timeoutMs = 15_000
): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${MEDIA_API}/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
    if (response.status === 404 || response.status === 401) return true
    if (!response.ok) return false
    const payload: unknown = await response.json()
    if (isRecord(payload) && typeof payload['code'] === 'number') {
      const code = payload['code'] as number
      return code === 404 || code === 401
    }
    return false
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch a tweet's media. Resolves `[]` when the tweet has no media; rejects on
 * network/HTTP/API errors so the caller can show Retry instead of "no media".
 */
export async function fetchGoonMedia(
  id: string,
  fetchImpl: FetchImpl = fetch,
  timeoutMs = 15_000
): Promise<GoonMediaItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${MEDIA_API}/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`media fetch failed: ${response.status}`)
    const payload: unknown = await response.json()
    if (isRecord(payload) && typeof payload['code'] === 'number') {
      const code = payload['code'] as number
      if (code === 404 || code === 401) {
        throw new Error(`tweet unavailable: ${code}`)
      }
      if (code !== 200) throw new Error(`media fetch failed: ${code}`)
    }
    return parseStatusMedia(payload)
  } finally {
    clearTimeout(timer)
  }
}

export interface GoonStatusAuthor {
  name: string
  screenName: string
  avatarUrl?: string
}

/** Backup tweet card for the widget's own render path (no official embed). */
export interface GoonStatusCard {
  id: string
  text: string
  author: GoonStatusAuthor
  createdAt: string
  likes: number
  reposts: number
  replies: number
  views?: number
  sensitive: boolean
  url: string
  media: GoonMediaItem[]
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Pull a tweet card out of an FxEmbed v2 payload. Returns `undefined` for
 * unrecognized payloads — never throws.
 */
export function parseStatusCard(payload: unknown): GoonStatusCard | undefined {
  if (!isRecord(payload)) return undefined
  const status = payload['status']
  if (!isRecord(status)) return undefined
  const id = status['id']
  if (typeof id !== 'string' || !id) return undefined
  const rawAuthor = status['author']
  const authorRecord = isRecord(rawAuthor) ? rawAuthor : {}
  const name = authorRecord['name']
  const screenName = authorRecord['screen_name']
  const avatarUrl = authorRecord['avatar_url']
  const author: GoonStatusAuthor = {
    name: typeof name === 'string' && name ? name : 'Unknown',
    screenName:
      typeof screenName === 'string' && screenName ? screenName : 'unknown',
  }
  if (typeof avatarUrl === 'string' && avatarUrl) {
    author.avatarUrl = avatarUrl
  }
  const text = status['text']
  const rawText = status['raw_text']
  const rawTextValue = isRecord(rawText) ? rawText['text'] : undefined
  const createdAt = status['created_at']
  const url = status['url']
  const views = status['views']
  const card: GoonStatusCard = {
    id,
    text:
      typeof text === 'string'
        ? text
        : typeof rawTextValue === 'string'
          ? rawTextValue
          : '',
    author,
    createdAt: typeof createdAt === 'string' ? createdAt : '',
    likes: toCount(status['likes']),
    reposts: toCount(status['reposts']),
    replies: toCount(status['replies']),
    sensitive: status['possibly_sensitive'] === true,
    url: typeof url === 'string' && url ? url : `https://x.com/i/status/${id}`,
    media: parseStatusMedia(payload),
  }
  if (typeof views === 'number' && Number.isFinite(views)) card.views = views
  return card
}

/**
 * Fetch a tweet's card. Resolves the card; rejects on network/HTTP/API
 * errors or unrecognized payloads so the caller can show Retry instead.
 */
export async function fetchGoonStatus(
  id: string,
  fetchImpl: FetchImpl = fetch,
  timeoutMs = 15_000
): Promise<GoonStatusCard> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${MEDIA_API}/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`status fetch failed: ${response.status}`)
    }
    const payload: unknown = await response.json()
    if (isRecord(payload) && typeof payload['code'] === 'number') {
      const code = payload['code'] as number
      if (code !== 200) throw new Error(`status fetch failed: ${code}`)
    }
    const card = parseStatusCard(payload)
    if (!card) throw new Error('status unrecognized')
    return card
  } finally {
    clearTimeout(timer)
  }
}
