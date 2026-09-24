import type { GoonState, GoonStorage } from './dailyPick'
import {
  GOON_STORAGE_KEYS,
  goonIds,
  markCurrentInvalid,
  parseTweetId,
  readState,
  resolveDailyPick,
  shuffle,
  todayKey,
  writeState,
} from './dailyPick'

interface TestStorage extends GoonStorage {
  map: Map<string, string>
}

function memoryStorage(): TestStorage {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

/** Deterministic LCG so shuffle results are reproducible in tests. */
function seededRandom(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

const DAY_1 = '2026-01-01'
const DAY_2 = '2026-01-02'
const DAY_3 = '2026-01-03'
const DAY_4 = '2026-01-04'

/** Everything the widget would show or serve next (invalid ids excluded). */
function servedOrQueued(state: GoonState): string[] {
  return [
    ...state.queue,
    ...state.seen,
    ...(state.current ? [state.current.id] : []),
  ]
}

describe('parseTweetId', () => {
  it('reads ids from x and twitter links', () => {
    expect(parseTweetId('https://x.com/someone/status/1234567890')).toBe(
      '1234567890'
    )
    expect(
      parseTweetId('https://twitter.com/someone/status/42?s=20&t=abc')
    ).toBe('42')
    expect(parseTweetId('https://mobile.twitter.com/someone/statuses/99')).toBe(
      '99'
    )
    expect(parseTweetId('https://x.com/i/web/status/7')).toBe('7')
  })

  it('accepts bare ids and rejects non-status urls', () => {
    expect(parseTweetId('  1234  ')).toBe('1234')
    expect(parseTweetId('https://x.com/someone')).toBeUndefined()
    expect(parseTweetId('https://example.com/someone/status/1')).toBeUndefined()
    expect(parseTweetId('not a url')).toBeUndefined()
  })
})

describe('todayKey', () => {
  it('formats the local date with zero padding', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 59, 59))).toBe('2026-01-05')
    expect(todayKey(new Date(2026, 11, 31, 0, 0, 0))).toBe('2026-12-31')
  })
})

describe('shuffle', () => {
  it('keeps every element and leaves the input untouched', () => {
    const input = ['a', 'b', 'c', 'd']
    const out = shuffle(input, seededRandom(7))
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })

  it('is reproducible for a given random source', () => {
    expect(shuffle([1, 2, 3, 4, 5], seededRandom(1))).toEqual(
      shuffle([1, 2, 3, 4, 5], seededRandom(1))
    )
  })
})

describe('goonIds', () => {
  it('parses, de-duplicates and drops unparsable entries', () => {
    expect(
      goonIds([
        'https://x.com/a/status/1',
        'https://twitter.com/b/status/2',
        'https://x.com/a/status/1',
        'https://x.com/not-a-tweet',
      ])
    ).toEqual(['1', '2'])
  })
})

describe('storage round trip', () => {
  it('returns null until state is written', () => {
    expect(readState(memoryStorage())).toBeNull()
  })

  it('persists every field', () => {
    const storage = memoryStorage()
    const state: GoonState = {
      queue: ['2', '3'],
      seen: ['1'],
      invalid: ['4'],
      current: { id: '5', date: DAY_1 },
    }
    writeState(storage, state)
    expect(readState(storage)).toEqual(state)
    expect(storage.map.has(GOON_STORAGE_KEYS.current)).toBe(true)
  })
})

describe('resolveDailyPick', () => {
  it('initializes the queue and serves one tweet on the first run', () => {
    const state = resolveDailyPick({
      state: null,
      allIds: ['1', '2', '3'],
      today: DAY_1,
      random: seededRandom(3),
    })
    expect(state.current?.date).toBe(DAY_1)
    expect(state.current?.id).toBeDefined()
    expect([...state.queue, state.current?.id].sort()).toEqual(['1', '2', '3'])
    expect(state.seen).toEqual([])
  })

  it('keeps the same tweet for the rest of the day', () => {
    const first = resolveDailyPick({
      state: null,
      allIds: ['1', '2', '3'],
      today: DAY_1,
      random: seededRandom(3),
    })
    const second = resolveDailyPick({
      state: first,
      allIds: ['1', '2', '3'],
      today: DAY_1,
      random: seededRandom(9),
    })
    expect(second.current).toEqual(first.current)
    expect(second.queue).toEqual(first.queue)
  })

  it('rolls over to a new tweet on the next day without repeating', () => {
    let state = resolveDailyPick({
      state: null,
      allIds: ['1', '2', '3'],
      today: DAY_1,
      random: seededRandom(3),
    })
    const served = [state.current!.id]
    for (const today of [DAY_2, DAY_3]) {
      state = resolveDailyPick({
        state,
        allIds: ['1', '2', '3'],
        today,
        random: seededRandom(4),
      })
      expect(state.current?.date).toBe(today)
      served.push(state.current!.id)
    }
    // Three days, three distinct tweets; the first two are retired into
    // `seen` and the third is still on screen.
    expect(new Set(served).size).toBe(3)
    expect(state.seen).toEqual(served.slice(0, -1))
    expect(state.queue).toEqual([])
  })

  it('cycles the list once every tweet has been served', () => {
    let state = resolveDailyPick({
      state: null,
      allIds: ['1', '2'],
      today: DAY_1,
      random: seededRandom(3),
    })
    const first = state.current!.id
    state = resolveDailyPick({
      state,
      allIds: ['1', '2'],
      today: DAY_2,
      random: seededRandom(4),
    })
    expect(state.current!.id).not.toBe(first)
    state = resolveDailyPick({
      state,
      allIds: ['1', '2'],
      today: DAY_3,
      random: seededRandom(5),
    })
    // Exhausted: a fresh cycle starts, never repeating yesterday's tweet.
    expect(state.current?.id).toBe(first)
    expect(state.seen).toEqual([])
    expect(state.queue).toEqual([])
  })

  it('repeats the only tweet in a single-entry list', () => {
    let state = resolveDailyPick({
      state: null,
      allIds: ['1'],
      today: DAY_1,
      random: seededRandom(3),
    })
    for (const today of [DAY_2, DAY_3]) {
      state = resolveDailyPick({
        state,
        allIds: ['1'],
        today,
        random: seededRandom(4),
      })
      expect(state.current?.id).toBe('1')
    }
  })

  it('injects links added after the initial shuffle', () => {
    const before = resolveDailyPick({
      state: null,
      allIds: ['1', '2'],
      today: DAY_1,
      random: seededRandom(3),
    })
    const after = resolveDailyPick({
      state: before,
      allIds: ['1', '2', '3'],
      today: DAY_1,
      random: seededRandom(4),
    })
    expect(after.current).toEqual(before.current)
    const known = [...after.queue, after.seen, after.invalid].flat()
    expect(known).toContain('3')
    expect(known.length).toBe(2)
  })

  it('never serves or re-queues an invalid id', () => {
    const state = resolveDailyPick({
      state: {
        queue: ['4'],
        seen: ['1'],
        invalid: ['3'],
        current: { id: '1', date: DAY_1 },
      },
      allIds: ['1', '2', '3', '4'],
      today: DAY_2,
      random: seededRandom(3),
    })
    expect(state.invalid).toEqual(['3'])
    expect(servedOrQueued(state)).not.toContain('3')
    // The invalid id never takes the day; a valid one does.
    expect(['2', '4']).toContain(state.current?.id)
  })

  it('drops a current tweet that became invalid', () => {
    const state = resolveDailyPick({
      state: {
        queue: ['2'],
        seen: [],
        invalid: ['1'],
        current: { id: '1', date: DAY_1 },
      },
      allIds: ['1', '2'],
      today: DAY_1,
      random: seededRandom(3),
    })
    expect(state.current?.id).toBe('2')
    expect(state.invalid).toEqual(['1'])
  })

  it('has nothing to serve when the list is empty', () => {
    const state = resolveDailyPick({
      state: null,
      allIds: [],
      today: DAY_1,
    })
    expect(state.current).toBeNull()
    expect(state.queue).toEqual([])
  })
})

describe('markCurrentInvalid', () => {
  it('retires the tweet without consuming the day and serves the next', () => {
    const start = resolveDailyPick({
      state: null,
      allIds: ['1', '2'],
      today: DAY_1,
      random: seededRandom(3),
    })
    const skipped = start.current!.id
    const next = markCurrentInvalid({
      state: start,
      allIds: ['1', '2'],
      today: DAY_1,
    })
    expect(next.invalid).toEqual([skipped])
    expect(next.seen).toEqual([])
    expect(next.current?.date).toBe(DAY_1)
    expect(next.current?.id).not.toBe(skipped)
    expect(next.queue).toEqual([])
  })

  it('keeps a retired id out of future picks', () => {
    let state = resolveDailyPick({
      state: null,
      allIds: ['1', '2'],
      today: DAY_1,
      random: seededRandom(3),
    })
    state = markCurrentInvalid({
      state,
      allIds: ['1', '2'],
      today: DAY_1,
    })
    const retired = state.invalid[0]
    for (const today of [DAY_2, DAY_3, DAY_4]) {
      state = resolveDailyPick({
        state,
        allIds: ['1', '2'],
        today,
        random: seededRandom(4),
      })
      expect(state.current?.id).not.toBe(retired)
      expect(state.queue).not.toContain(retired)
    }
    expect(state.invalid).toEqual([retired])
  })

  it('leaves state untouched when nothing is on screen', () => {
    const empty: GoonState = {
      queue: [],
      seen: [],
      invalid: [],
      current: null,
    }
    expect(
      markCurrentInvalid({ state: empty, allIds: ['1'], today: DAY_1 })
    ).toBe(empty)
  })

  it('reports no pick when every id has been retired', () => {
    const state = markCurrentInvalid({
      state: {
        queue: [],
        seen: [],
        invalid: [],
        current: { id: '1', date: DAY_1 },
      },
      allIds: ['1'],
      today: DAY_1,
    })
    expect(state.current).toBeNull()
    expect(state.invalid).toEqual(['1'])
  })
})
