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
