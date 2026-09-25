import {
  fetchGoonMedia,
  fetchGoonStatus,
  isGoonTweetGone,
  parseStatusCard,
  parseStatusMedia,
} from './goonMedia'

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

function statusPayload(overrides: object = {}) {
  return {
    code: 200,
    status: {
      id: '9',
      text: 'hello https://t.co/x',
      url: 'https://x.com/someone/status/9',
      created_at: 'Sun Sep 13 20:08:01 +0000 2026',
      possibly_sensitive: true,
      likes: 93,
      reposts: 4,
      replies: 0,
      views: 785,
      author: {
        name: 'Cheremsha',
        screen_name: 'Cheremsha_cos',
        avatar_url: 'https://pbs.twimg.com/profile_images/x.jpg',
      },
      media: { all: [photoEntry()] },
      ...overrides,
    },
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

describe('isGoonTweetGone', () => {
  function goneHttp(status: number) {
    return {
      ok: false,
      status,
      json: async () => ({}),
    } as Response
  }

  function apiCode(code: number) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ code }),
    } as Response
  }

  it('reports gone on definitive http and api signals', async () => {
    await expect(isGoonTweetGone('9', async () => goneHttp(404))).resolves.toBe(
      true
    )
    await expect(isGoonTweetGone('9', async () => goneHttp(401))).resolves.toBe(
      true
    )
    await expect(isGoonTweetGone('9', async () => apiCode(404))).resolves.toBe(
      true
    )
    await expect(isGoonTweetGone('9', async () => apiCode(401))).resolves.toBe(
      true
    )
  })

  it('never retires on unknown outcomes', async () => {
    const exists = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, status: { id: '9' } }),
      }) as Response
    await expect(isGoonTweetGone('9', exists)).resolves.toBe(false)
    // Rate-limited or server error: unknown, not gone.
    await expect(isGoonTweetGone('9', async () => goneHttp(429))).resolves.toBe(
      false
    )
    const networkDown = async () => {
      throw new TypeError('offline')
    }
    await expect(isGoonTweetGone('9', networkDown)).resolves.toBe(false)
  })
})

describe('parseStatusCard', () => {
  it('reads a card with author, counts and media', () => {
    const card = parseStatusCard(statusPayload())
    expect(card?.id).toBe('9')
    expect(card?.text).toContain('hello')
    expect(card?.author).toEqual({
      name: 'Cheremsha',
      screenName: 'Cheremsha_cos',
      avatarUrl: 'https://pbs.twimg.com/profile_images/x.jpg',
    })
    expect(card?.likes).toBe(93)
    expect(card?.reposts).toBe(4)
    expect(card?.sensitive).toBe(true)
    expect(card?.url).toContain('/status/9')
    expect(card?.media).toHaveLength(1)
  })

  it('falls back to raw text and fills defaults for missing fields', () => {
    const card = parseStatusCard(
      statusPayload({
        text: undefined,
        author: {},
        likes: 'many',
        possibly_sensitive: undefined,
      })
    )
    expect(card?.text).toBe('')
    expect(card?.author.name).toBe('Unknown')
    expect(card?.author.screenName).toBe('unknown')
    expect(card?.author.avatarUrl).toBeUndefined()
    expect(card?.likes).toBe(0)
    expect(card?.sensitive).toBe(false)
    expect(card?.url).toContain('/status/9')
  })

  it('returns undefined for malformed payloads', () => {
    expect(parseStatusCard(null)).toBeUndefined()
    expect(parseStatusCard({})).toBeUndefined()
    expect(parseStatusCard({ status: { text: 'no id' } })).toBeUndefined()
  })
})

describe('fetchGoonStatus', () => {
  it('resolves the card on success', async () => {
    const stub = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => statusPayload(),
      }) as Response
    const card = await fetchGoonStatus('9', stub)
    expect(card.id).toBe('9')
    expect(card.media).toHaveLength(1)
  })

  it('rejects on http, api and unrecognized payloads', async () => {
    const stub404 = async () =>
      ({
        ok: false,
        status: 404,
        json: async () => ({}),
      }) as Response
    await expect(fetchGoonStatus('9', stub404)).rejects.toThrow('404')
    const stubGone = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ code: 401 }),
      }) as Response
    await expect(fetchGoonStatus('9', stubGone)).rejects.toThrow('401')
    const stubBare = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ code: 200 }),
      }) as Response
    await expect(fetchGoonStatus('9', stubBare)).rejects.toThrow()
  })
})
