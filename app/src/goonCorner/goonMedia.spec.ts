import { fetchGoonMedia, parseStatusMedia } from './goonMedia'

function photoEntry(overrides: object = {}) {
  return {
    id: '1',
    type: 'photo',
    url: 'https://pbs.twimg.com/media/AbC.jpg?name=orig',
    width: 1000,
    height: 1500,
    ...overrides,
  }
}

function videoEntry(overrides: object = {}) {
  return {
    id: '2',
    type: 'video',
    url: 'https://video.twimg.com/amplify_video/2/vid/avc1/720x1280/x.mp4?tag=1',
    thumbnail_url: 'https://pbs.twimg.com/amplify_video_thumb/2/img/y.jpg',
    width: 720,
    height: 1280,
    format: 'video/mp4',
    ...overrides,
  }
}

describe('parseStatusMedia', () => {
  it('reads mixed media from `all` in post order', () => {
    const payload = {
      code: 200,
      status: { id: '9', media: { all: [photoEntry(), videoEntry()] } },
    }
    const items = parseStatusMedia(payload)
    expect(items.map((item) => item.type)).toEqual(['photo', 'video'])
    expect(items[0].url).toContain('pbs.twimg.com')
    expect(items[1].thumbnailUrl).toContain('amplify_video_thumb')
  })

  it('falls back to the photos/videos buckets', () => {
    const payload = {
      code: 200,
      status: {
        id: '9',
        media: { photos: [{ url: 'https://pbs.twimg.com/media/x.jpg' }] },
      },
    }
    expect(parseStatusMedia(payload)).toEqual([
      { type: 'photo', url: 'https://pbs.twimg.com/media/x.jpg' },
    ])
  })

  it('returns [] for text-only or malformed payloads', () => {
    expect(parseStatusMedia({ code: 200, status: { id: '9' } })).toEqual([])
    expect(parseStatusMedia({ code: 200, status: { media: {} } })).toEqual([])
    expect(parseStatusMedia(null)).toEqual([])
    expect(parseStatusMedia('nope')).toEqual([])
    // Entries without a usable url are dropped, not returned half-formed.
    expect(
      parseStatusMedia({
        status: { media: { all: [{ type: 'photo' }, null, 42] } },
      })
    ).toEqual([])
  })
})

describe('fetchGoonMedia', () => {
  function jsonResponse(body: unknown, ok = true, status = 200) {
    return {
      ok,
      status,
      json: async () => body,
    } as Response
  }

  it('resolves media on success and hits the v2 endpoint', async () => {
    const seen: string[] = []
    const stub = async (input: string) => {
      seen.push(input)
      return jsonResponse({
        code: 200,
        status: { id: '9', media: { all: [photoEntry()] } },
      })
    }
    const items = await fetchGoonMedia('9', stub)
    expect(seen).toEqual(['https://api.fxtwitter.com/2/status/9'])
    expect(items).toHaveLength(1)
  })

  it('resolves [] when the tweet has no media', async () => {
    const stub = async () => jsonResponse({ code: 200, status: { id: '9' } })
    await expect(fetchGoonMedia('9', stub)).resolves.toEqual([])
  })

  it('rejects on http and api errors so the ui can offer retry', async () => {
    const stub404 = async () => jsonResponse({}, false, 404)
    await expect(fetchGoonMedia('9', stub404)).rejects.toThrow('404')
    const stubGone = async () =>
      jsonResponse({ code: 404, message: 'NOT_FOUND' })
    await expect(fetchGoonMedia('9', stubGone)).rejects.toThrow()
  })
})
