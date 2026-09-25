import {
  ActionIcon,
  Box,
  Button,
  Loader,
  Modal,
  Paper,
  Portal,
  Text,
} from '@mantine/core'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconExternalLink,
  IconGhost,
  IconHeart,
  IconPhoto,
  IconPlayerPlay,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GoonState, GoonStorage } from './dailyPick'
import {
  GOON_STORAGE_KEYS,
  goonIds,
  markCurrentInvalid,
  readState,
  resolveDailyPick,
  todayKey,
  writeState,
} from './dailyPick'
import type { GoonMediaItem, GoonStatusCard } from './goonMedia'
import { fetchGoonMedia, fetchGoonStatus, isGoonTweetGone } from './goonMedia'

const Z_INDEX = 1000
/** The gallery modal must sit above the always-on-top widget. */
const GALLERY_Z_INDEX = 2000
/** Deleted-tweet skips allowed per day before giving up on the list. */
const MAX_SKIPS = 10

/**
 * Pinned bottom-right layout at an official-like fixed width; the height
 * hugs the content (scrolling internally past the viewport cap) so there is
 * never a dead gap below the card.
 */
const VIEWPORT_MARGIN = 16
const WIDGET_WIDTH = 500
const COLLAPSED_WIDTH = 260
const HEADER_HEIGHT = 34

type EmbedStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty'
type GalleryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** FxEmbed fetch budgets; failures surface as Retry, never a stuck spinner. */
const STATUS_TIMEOUT_MS = 10_000
const GONE_CHECK_TIMEOUT_MS = 10_000

/** Short local date for the card byline; '' when the stamp is unusable. */
function formatGoonDate(raw: string): string {
  if (!raw) return ''
  const time = new Date(raw).getTime()
  if (Number.isNaN(time)) return ''
  return new Date(time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Plain tweet text with bare URLs linkified. */
function renderGoonText(text: string): ReactNode[] {
  return text.split(/(https?:\/\/\S+)/g).map((part, index) =>
    /^https?:\/\/\S+$/.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}

/**
 * Video player that fetches through a blob URL. The CDN 403s media requests
 * carrying the page as `Referer`, and `<video>` supports no referrer policy
 * attribute — but `fetch` does, and the CDN answers `*` to CORS.
 */
function GoonVideoPlayer({
  url,
  poster,
  onReady,
}: {
  url: string
  poster?: string
  onReady?: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setSrc(null)
    setFailed(false)
    void (async () => {
      try {
        const response = await fetch(url, {
          referrerPolicy: 'no-referrer',
        })
        if (!response.ok) throw new Error(`video fetch failed`)
        const blob = await response.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (failed) {
    return (
      <Text size="sm" c="dimmed">
        Couldn't load this video.
      </Text>
    )
  }
  if (!src) return <Loader size="sm" />
  return (
    <video
      src={src}
      poster={poster}
      controls
      autoPlay
      loop
      playsInline
      preload="metadata"
      onLoadedMetadata={onReady}
      ref={(el) => {
        // `muted` must land as a property for autoplay policies to honor
        // it; the attribute alone is unreliable in React.
        if (el) {
          el.muted = true
          void el.play().catch(() => {})
        }
      }}
      style={{
        width: 'auto',
        height: '100%',
        maxWidth: '100%',
        objectFit: 'contain',
      }}
    />
  )
}

/** Poster thumb for a mosaic cell: photos use the full image. */
function goonThumb(item: GoonMediaItem): string {
  return item.type === 'photo' ? item.url : (item.thumbnailUrl ?? item.url)
}

/** Centered play chip over video/gif thumbs, like the official client. */
function GoonPlayBadge() {
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        style={{
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.55)',
          padding: 10,
          display: 'flex',
        }}
      >
        <IconPlayerPlay size={22} color="white" />
      </Box>
    </Box>
  )
}

/** One mosaic cell: fills its grid area, cover-cropped, opens the gallery. */
function GoonMosaicItem({
  item,
  onOpen,
  spanRows,
}: {
  item: GoonMediaItem
  onOpen: () => void
  spanRows?: boolean
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label="open media viewer"
      onClick={onOpen}
      style={{
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        position: 'relative',
        height: '100%',
        minHeight: 0,
        ...(spanRows ? { gridRow: '1 / span 2' } : {}),
      }}
    >
      <img
        src={goonThumb(item)}
        alt=""
        referrerPolicy="no-referrer"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {item.type !== 'photo' ? <GoonPlayBadge /> : null}
    </Box>
  )
}

function safeStorage(): GoonStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
function readOpen(): boolean {
  const raw = safeStorage()?.getItem(GOON_STORAGE_KEYS.open)
  return raw === 'true'
}

function writeOpen(open: boolean): void {
  safeStorage()?.setItem(GOON_STORAGE_KEYS.open, open ? 'true' : 'false')
}

function readDismissed(): boolean {
  return safeStorage()?.getItem(GOON_STORAGE_KEYS.dismissed) === 'true'
}

function writeDismissed(dismissed: boolean): void {
  safeStorage()?.setItem(
    GOON_STORAGE_KEYS.dismissed,
    dismissed ? 'true' : 'false'
  )
}

function readIntroSeen(): boolean {
  return safeStorage()?.getItem(GOON_STORAGE_KEYS.intro) === 'true'
}

function writeIntroSeen(): void {
  safeStorage()?.setItem(GOON_STORAGE_KEYS.intro, 'true')
}

/**
 * Always-on-top widget pinned to the bottom-right corner, serving one random
 * tweet per user per local day. Collapsed on first run; once opened it
 * reopens that way on reload, and closing it (X) keeps it closed across
 * reloads until reopened from the ghost button.
 */
export function GoonCorner() {
  const allIds = useMemo(() => goonIds(), [])
  const [open, setOpen] = useState(readOpen)
  const [dismissed, setDismissed] = useState(readDismissed)
  const [pick, setPick] = useState<GoonState | null>(null)
  const [status, setStatus] = useState<EmbedStatus>('idle')
  const [card, setCard] = useState<GoonStatusCard | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  // Fullscreen gallery: the card's media shown large in our own modal.
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStatus, setGalleryStatus] = useState<GalleryStatus>('idle')
  const [galleryItems, setGalleryItems] = useState<GoonMediaItem[]>([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryToken, setGalleryToken] = useState(0)
  // First-run gate: the intro shows until Start is pressed, then never again.
  const [introSeen, setIntroSeen] = useState(readIntroSeen)
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const galleryFooterRef = useRef<HTMLDivElement | null>(null)
  const [galleryViewerHeight, setGalleryViewerHeight] = useState<number | null>(
    null
  )

  const pickRef = useRef<GoonState | null>(null)
  const skipRef = useRef({ date: '', count: 0 })
  // Mirrors `card` for the fetch effect so reopening a cached tweet skips
  // the network without adding state to the dependency list.
  const cardRef = useRef<GoonStatusCard | null>(null)

  const syncPick = useCallback(() => {
    const storage = safeStorage()
    const state = storage ? readState(storage) : pickRef.current
    const next = resolveDailyPick({ state, allIds, today: todayKey() })
    if (storage) writeState(storage, next)
    pickRef.current = next
    setPick(next)
  }, [allIds])

  // Resolve today's tweet on mount, then again after local midnight passes
  // while the tab stays open.
  useEffect(() => {
    syncPick()
    const timer = window.setInterval(() => {
      if (pickRef.current?.current?.date !== todayKey()) syncPick()
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [syncPick])

  useEffect(() => {
    writeOpen(open)
  }, [open])

  useEffect(() => {
    writeDismissed(dismissed)
  }, [dismissed])

  const toggleOpen = () => {
    setOpen(!open)
  }

  const startGoon = () => {
    writeIntroSeen()
    setIntroSeen(true)
  }

  const currentId = pick?.current?.id ?? null
  const tweetUrl = currentId ? `https://x.com/i/status/${currentId}` : null
  const likeUrl = currentId
    ? `https://x.com/intent/like?tweet_id=${encodeURIComponent(currentId)}`
    : null
  const galleryItem = galleryItems[galleryIndex] ?? null
  // Measure at runtime: the viewer gets exactly the space between its top and
  // the footer, so no viewport-height guessing is needed regardless of theme
  // padding or control rows.
  const fitGalleryViewer = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const top = viewer.getBoundingClientRect().top
    const footer = galleryFooterRef.current?.getBoundingClientRect().height ?? 0
    setGalleryViewerHeight(
      Math.max(200, Math.floor(window.innerHeight - top - footer - 16))
    )
  }, [])
  const galleryPrev = () =>
    setGalleryIndex((index) =>
      galleryItems.length > 0
        ? (index - 1 + galleryItems.length) % galleryItems.length
        : 0
    )
  const galleryNext = () =>
    setGalleryIndex((index) =>
      galleryItems.length > 0 ? (index + 1) % galleryItems.length : 0
    )

  useEffect(() => {
    // `dismissed` is a dependency so closing and reopening re-runs the
    // cache check above for the current pick.
    if (!open || dismissed || !currentId || !introSeen) return
    const state = pickRef.current
    if (!state) return

    const date = state.current?.date ?? todayKey()
    if (skipRef.current.date !== date) skipRef.current = { date, count: 0 }

    const wanted = currentId
    // Collapse keeps the card: reopening the same tweet reuses the cache
    // instead of refetching. Only a new pick (or Retry) hits the network.
    if (cardRef.current?.id === wanted) return
    let cancelled = false
    setStatus('loading')
    setCard(null)
    cardRef.current = null

    void (async () => {
      try {
        const fetched = await fetchGoonStatus(wanted, fetch, STATUS_TIMEOUT_MS)
        if (cancelled) return
        skipRef.current.count = 0
        setCard(fetched)
        cardRef.current = fetched
        setStatus('ready')
        return
      } catch {
        // Gone or transient — distinguished below.
      }
      if (cancelled) return
      const gone = await isGoonTweetGone(wanted, fetch, GONE_CHECK_TIMEOUT_MS)
      if (cancelled) return
      if (gone && skipRef.current.count < MAX_SKIPS) {
        skipRef.current.count += 1
        const latest = pickRef.current
        if (!latest) {
          setStatus('empty')
          return
        }
        const next = markCurrentInvalid({
          state: latest,
          allIds,
          today: date,
        })
        const storage = safeStorage()
        if (storage) writeState(storage, next)
        pickRef.current = next
        setPick(next)
        return
      }
      setStatus(gone ? 'empty' : 'error')
    })()

    return () => {
      cancelled = true
    }
  }, [open, dismissed, currentId, allIds, retryToken, introSeen])

  // Gallery fetch: runs when the modal opens (or Retry is hit), scoped to the
  // tweet it opened for. A stale response from a previous tweet is dropped.
  useEffect(() => {
    if (!galleryOpen || !currentId) return
    const wanted = currentId
    let cancelled = false
    setGalleryStatus('loading')
    setGalleryItems([])
    setGalleryIndex(0)
    void fetchGoonMedia(wanted).then(
      (items) => {
        if (cancelled) return
        setGalleryItems(items)
        setGalleryStatus(items.length > 0 ? 'ready' : 'empty')
      },
      () => {
        if (cancelled) return
        setGalleryStatus('error')
      }
    )
    return () => {
      cancelled = true
    }
  }, [galleryOpen, currentId, galleryToken])

  // Refit once the media is on screen (and on resize / image load) so the
  // viewer fills the modal down to the footer row.
  useEffect(() => {
    if (!galleryOpen || galleryStatus !== 'ready') return
    fitGalleryViewer()
    window.addEventListener('resize', fitGalleryViewer)
    return () => window.removeEventListener('resize', fitGalleryViewer)
  }, [galleryOpen, galleryStatus, galleryItems.length, fitGalleryViewer])

  if (dismissed) {
    return (
      <Portal>
        <ActionIcon
          aria-label="open goon corner"
          radius="xl"
          size="lg"
          variant="filled"
          color="grape"
          style={{
            position: 'fixed',
            right: VIEWPORT_MARGIN,
            bottom: VIEWPORT_MARGIN,
            zIndex: Z_INDEX,
          }}
          onClick={() => {
            setDismissed(false)
            setOpen(true)
          }}
        >
          <IconGhost size={18} />
        </ActionIcon>
      </Portal>
    )
  }

  return (
    <Portal>
      <Paper
        withBorder
        shadow="md"
        style={{
          position: 'fixed',
          right: VIEWPORT_MARGIN,
          bottom: VIEWPORT_MARGIN,
          width: open
            ? `min(${WIDGET_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`
            : COLLAPSED_WIDTH,
          height: open ? undefined : HEADER_HEIGHT,
          maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
          zIndex: Z_INDEX,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: HEADER_HEIGHT,
            flex: '0 0 auto',
            padding: '0 4px 0 6px',
            background: 'var(--mantine-color-dark-6)',
          }}
        >
          <Text size="sm" fw={600} c="white" style={{ flex: 1 }}>
            Goon Corner
          </Text>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="view tweet media fullscreen"
            title="View media fullscreen"
            disabled={!open || !currentId || !introSeen}
            onClick={() => setGalleryOpen(true)}
          >
            <IconPhoto size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label={open ? 'collapse goon corner' : 'expand goon corner'}
            onClick={toggleOpen}
          >
            {open ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="close goon corner"
            onClick={() => setDismissed(true)}
          >
            <IconX size={16} />
          </ActionIcon>
        </Box>

        {open ? (
          introSeen ? (
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                padding: 'clamp(8px, 2cqw, 12px)',
                // Children size themselves in `cqw` so the card scales
                // with the widget width instead of staying fixed-size.
                containerType: 'inline-size',
              }}
            >
              {status === 'ready' && card ? (
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2cqw',
                  }}
                >
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {card.author.avatarUrl ? (
                      <img
                        src={card.author.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: 'clamp(32px, 10cqw, 56px)',
                          aspectRatio: '1',
                          borderRadius: '50%',
                        }}
                      />
                    ) : null}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        fw={600}
                        truncate
                        style={{ fontSize: 'clamp(13px, 4.2cqw, 17px)' }}
                      >
                        {card.author.name}
                      </Text>
                      <Text
                        c="dimmed"
                        truncate
                        style={{ fontSize: 'clamp(11px, 3.4cqw, 13px)' }}
                      >
                        {`@${card.author.screenName}${formatGoonDate(card.createdAt) ? ` · ${formatGoonDate(card.createdAt)}` : ''}`}
                      </Text>
                    </Box>
                    {card.sensitive ? (
                      <Text
                        c="dimmed"
                        style={{ fontSize: 'clamp(11px, 3.4cqw, 13px)' }}
                      >
                        Sensitive
                      </Text>
                    ) : null}
                  </Box>
                  {card.text ? (
                    <Text
                      style={{
                        fontSize: 'clamp(13px, 4cqw, 15px)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {renderGoonText(card.text)}
                    </Text>
                  ) : null}
                  {card.media.length === 1 ? (
                    <Box
                      component="button"
                      type="button"
                      aria-label="open media viewer"
                      onClick={() => setGalleryOpen(true)}
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        borderRadius: 12,
                        overflow: 'hidden',
                        width: '100%',
                      }}
                    >
                      <img
                        src={goonThumb(card.media[0])}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: '100%',
                          ...(card.media[0].width && card.media[0].height
                            ? {
                                aspectRatio: `${card.media[0].width} / ${card.media[0].height}`,
                              }
                            : {}),
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      {card.media[0].type !== 'photo' ? (
                        <GoonPlayBadge />
                      ) : null}
                    </Box>
                  ) : card.media.length === 2 ? (
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        aspectRatio: '2 / 1',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {card.media.slice(0, 2).map((item) => (
                        <GoonMosaicItem
                          key={item.url}
                          item={item}
                          onOpen={() => setGalleryOpen(true)}
                        />
                      ))}
                    </Box>
                  ) : card.media.length === 3 ? (
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 2fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: 2,
                        aspectRatio: '7 / 5',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {card.media.slice(0, 3).map((item, index) => (
                        <GoonMosaicItem
                          key={item.url}
                          item={item}
                          onOpen={() => setGalleryOpen(true)}
                          spanRows={index === 0}
                        />
                      ))}
                    </Box>
                  ) : card.media.length >= 4 ? (
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: 2,
                        aspectRatio: '1 / 1',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {card.media.slice(0, 4).map((item) => (
                        <GoonMosaicItem
                          key={item.url}
                          item={item}
                          onOpen={() => setGalleryOpen(true)}
                        />
                      ))}
                    </Box>
                  ) : null}
                  <Text
                    c="dimmed"
                    style={{ fontSize: 'clamp(11px, 3.4cqw, 13px)' }}
                  >
                    {`${card.likes.toLocaleString()} likes · ${card.reposts.toLocaleString()} reposts · ${card.replies.toLocaleString()} replies`}
                  </Text>
                  <Box style={{ display: 'flex', gap: 8 }}>
                    {likeUrl ? (
                      <Button
                        size="xs"
                        variant="light"
                        component="a"
                        href={likeUrl}
                        target="_blank"
                        rel="noreferrer"
                        leftSection={<IconHeart size={14} />}
                      >
                        Like
                      </Button>
                    ) : null}
                    <Button
                      size="xs"
                      variant="subtle"
                      component="a"
                      href={card.url}
                      target="_blank"
                      rel="noreferrer"
                      leftSection={<IconExternalLink size={14} />}
                    >
                      Open post on X
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: '100%',
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  {!pick || status === 'loading' ? <Loader size="sm" /> : null}
                  {pick && !currentId ? (
                    <Text size="sm" c="dimmed">
                      {pick.invalid.length + pick.seen.length > 0
                        ? 'No more tweets to show today.'
                        : 'No bookmarks yet. Export your X data archive, then run gen-file.'}
                    </Text>
                  ) : status === 'error' ? (
                    <>
                      <Text size="sm" c="dimmed">
                        Couldn't load this tweet.
                      </Text>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconRefresh size={14} />}
                        onClick={() => setRetryToken((token) => token + 1)}
                      >
                        Retry
                      </Button>
                      {tweetUrl ? (
                        <Button
                          size="xs"
                          variant="subtle"
                          component="a"
                          href={tweetUrl}
                          target="_blank"
                          rel="noreferrer"
                          leftSection={<IconExternalLink size={14} />}
                        >
                          Open post on X
                        </Button>
                      ) : null}
                    </>
                  ) : status === 'empty' ? (
                    <Text size="sm" c="dimmed">
                      No more tweets to show today.
                    </Text>
                  ) : null}
                </Box>
              )}
            </Box>
          ) : (
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <Text size="md" fw={600}>
                Welcome to Goon Corner
              </Text>
              <Text size="sm" c="dimmed">
                Optimize your X feed by liking the provided tweets, including
                NSFW! New tweet everyday. Enjoy your X having more useful
                content!
              </Text>
              <Button
                size="sm"
                variant="filled"
                color="grape"
                onClick={startGoon}
              >
                Start
              </Button>
            </Box>
          )
        ) : null}

        <Modal
          opened={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          fullScreen
          withCloseButton={false}
          zIndex={GALLERY_Z_INDEX}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Text size="lg" fw={600} style={{ flex: 1 }}>
              Goon Corner media
            </Text>
            <ActionIcon
              aria-label="close media viewer"
              title="Close"
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => setGalleryOpen(false)}
            >
              <IconX size={20} />
            </ActionIcon>
          </Box>
          {galleryStatus === 'loading' || galleryStatus === 'idle' ? (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: '50vh',
              }}
            >
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading media…
              </Text>
            </Box>
          ) : galleryStatus === 'error' ? (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 24,
                minHeight: '50vh',
                textAlign: 'center',
              }}
            >
              <Text size="sm" c="dimmed">
                Couldn't load media for this tweet.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={() => setGalleryToken((token) => token + 1)}
              >
                Retry
              </Button>
            </Box>
          ) : galleryStatus === 'empty' || !galleryItem ? (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 24,
                minHeight: '50vh',
                textAlign: 'center',
              }}
            >
              <Text size="sm" c="dimmed">
                This tweet has no images or videos.
              </Text>
              {tweetUrl ? (
                <Button
                  size="xs"
                  variant="light"
                  component="a"
                  href={tweetUrl}
                  target="_blank"
                  rel="noreferrer"
                  leftSection={<IconExternalLink size={14} />}
                >
                  Open post on X
                </Button>
              ) : null}
            </Box>
          ) : (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <Box
                ref={viewerRef}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: galleryViewerHeight ?? undefined,
                  minHeight: 200,
                  background: 'black',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {galleryItems.length > 1 ? (
                  <ActionIcon
                    aria-label="previous media"
                    variant="filled"
                    color="primary"
                    onClick={galleryPrev}
                    style={{
                      position: 'absolute',
                      left: 8,
                      zIndex: 1,
                    }}
                  >
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                ) : null}
                {galleryItem.type === 'photo' ? (
                  <img
                    src={galleryItem.url}
                    alt={`Tweet media ${galleryIndex + 1}`}
                    referrerPolicy="no-referrer"
                    onLoad={fitGalleryViewer}
                    style={{
                      width: 'auto',
                      height: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <GoonVideoPlayer
                    key={galleryItem.url}
                    url={galleryItem.url}
                    poster={galleryItem.thumbnailUrl}
                    onReady={fitGalleryViewer}
                  />
                )}
                {galleryItems.length > 1 ? (
                  <ActionIcon
                    aria-label="next media"
                    variant="filled"
                    color="primary"
                    onClick={galleryNext}
                    style={{
                      position: 'absolute',
                      right: 8,
                      zIndex: 1,
                    }}
                  >
                    <IconChevronRight size={18} />
                  </ActionIcon>
                ) : null}
              </Box>
              <Box
                ref={galleryFooterRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {galleryItems.length > 1 ? (
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      {galleryIndex + 1} / {galleryItems.length}
                    </Text>
                    <Box style={{ display: 'flex', gap: 4 }}>
                      {galleryItems.map((item, index) => (
                        <Box
                          key={item.url}
                          component="button"
                          type="button"
                          aria-label={`show media ${index + 1}`}
                          onClick={() => setGalleryIndex(index)}
                          style={{
                            width: 48,
                            height: 48,
                            padding: 0,
                            borderRadius: 6,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border:
                              index === galleryIndex
                                ? '2px solid var(--mantine-color-grape-5)'
                                : '2px solid transparent',
                            background: 'black',
                          }}
                        >
                          <img
                            src={
                              item.type === 'photo'
                                ? item.url
                                : (item.thumbnailUrl ?? item.url)
                            }
                            alt=""
                            referrerPolicy="no-referrer"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null}
                {tweetUrl ? (
                  <Button
                    size="xs"
                    variant="subtle"
                    component="a"
                    href={tweetUrl}
                    target="_blank"
                    rel="noreferrer"
                    leftSection={<IconExternalLink size={14} />}
                    style={{ alignSelf: 'center' }}
                  >
                    Open post on X
                  </Button>
                ) : null}
              </Box>
            </Box>
          )}
        </Modal>
      </Paper>
    </Portal>
  )
}
