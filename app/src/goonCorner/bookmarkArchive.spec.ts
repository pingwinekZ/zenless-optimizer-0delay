import {
  bookmarkIdsFromParts,
  bookmarkTweetUrls,
  extractBookmarkIds,
  renderTweetsGen,
} from './bookmarkArchive'

function archivePart(
  entries: Array<Record<string, unknown>>,
  part = 0
): string {
  return `window.YTD.bookmark.part${part} = ${JSON.stringify(
    entries.map((bookmark) => ({ bookmark }))
  )}`
}

describe('extractBookmarkIds', () => {
  it('reads ids out of the window.YTD assignment', () => {
    const source = archivePart([
      {
        tweetId: '111',
        fullText: 'one',
        expandedUrl: 'https://x.com/a/status/111',
      },
      { tweetId: '222' },
    ])
    expect(extractBookmarkIds(source)).toEqual(['111', '222'])
  })

  it('accepts part suffixes, missing prefixes, BOM and CRLF', () => {
    expect(extractBookmarkIds(archivePart([{ tweetId: '333' }], 12))).toEqual([
      '333',
    ])
    expect(extractBookmarkIds('[{"bookmark":{"tweetId":"444"}}]')).toEqual([
      '444',
    ])
    expect(
      extractBookmarkIds(
        `\uFEFFwindow.YTD.bookmark.part0 = [\r\n{"bookmark":{"tweetId":"555"}}\r\n]\r\n`
      )
    ).toEqual(['555'])
  })

  it('falls back to the permalink when tweetId is unusable', () => {
    expect(
      extractBookmarkIds(
        archivePart([
          { expandedUrl: 'https://twitter.com/someone/status/666' },
          { expandedUrl: 'https://x.com/i/web/status/777' },
        ])
      )
    ).toEqual(['666', '777'])
  })

  it('skips entries without a usable id and non-numeric ids', () => {
    expect(
      extractBookmarkIds(
        archivePart([
          { tweetId: 'abc' },
          { fullText: 'no id here' },
          { tweetId: '888' },
        ])
      )
    ).toEqual(['888'])
    expect(
      extractBookmarkIds(archivePart([{ tweetId: 999 } as never]))
    ).toEqual([])
  })

  it('reads the JSON shape emitted by bookmark-export extensions', () => {
    const source = JSON.stringify([
      {
        id: '2099524506507472902',
        created_at: '2026-09-14 17:43:44 +02:00',
        full_text: 'Too cute for just one look. https://t.co/XwXDU5qB3D',
        screen_name: 'Aleph6Zero9',
        url: 'https://twitter.com/Aleph6Zero9/status/2099524506507472902',
      },
      {
        id: '2102954323076653093',
        url: 'https://twitter.com/hikou777/status/2102954323076653093',
      },
    ])
    expect(extractBookmarkIds(source)).toEqual([
      '2099524506507472902',
      '2102954323076653093',
    ])
  })

  it('falls back to the extension url when id is malformed', () => {
    expect(
      extractBookmarkIds(
        JSON.stringify([
          { id: null, url: 'https://x.com/someone/status/1234' },
          { id: 'not-numeric', url: 'https://twitter.com/i/web/status/5678' },
        ])
      )
    ).toEqual(['1234', '5678'])
  })

  it('prefers the nested archive payload over a top-level id', () => {
    expect(
      extractBookmarkIds(
        JSON.stringify([{ id: '111', bookmark: { tweetId: '222' } }])
      )
    ).toEqual(['222'])
  })

  it('returns nothing for empty, malformed or non-array input', () => {
    expect(extractBookmarkIds('')).toEqual([])
    expect(extractBookmarkIds('window.YTD.bookmark.part0 = [')).toEqual([])
    expect(extractBookmarkIds('window.YTD.bookmark.part0 = {}')).toEqual([])
    expect(extractBookmarkIds('{"bookmark":{"tweetId":"1"}}')).toEqual([])
  })
})

describe('bookmarkIdsFromParts', () => {
  it('concatenates parts and de-duplicates keeping first-seen order', () => {
    const ids = bookmarkIdsFromParts([
      archivePart([{ tweetId: '1' }, { tweetId: '2' }], 0),
      archivePart([{ tweetId: '2' }, { tweetId: '3' }], 1),
    ])
    expect(ids).toEqual(['1', '2', '3'])
  })
})

describe('bookmarkTweetUrls / renderTweetsGen', () => {
  it('builds canonical permalinks', () => {
    expect(bookmarkTweetUrls(['42'])).toEqual(['https://x.com/i/status/42'])
  })

  it('renders a Biome-clean module ending in a newline', () => {
    const rendered = renderTweetsGen(['https://x.com/i/status/42'])
    expect(rendered).toContain(
      'export const GOON_BOOKMARK_TWEETS: string[] = ['
    )
    expect(rendered).toContain("  'https://x.com/i/status/42',")
    expect(rendered.endsWith('\n')).toBe(true)
    expect(rendered.endsWith(']\n')).toBe(true)
  })

  it('renders an empty list for no bookmarks', () => {
    expect(renderTweetsGen([])).toContain(
      'export const GOON_BOOKMARK_TWEETS: string[] = []'
    )
  })
})
