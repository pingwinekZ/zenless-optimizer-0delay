import {
  ActionIcon,
  Box,
  Button,
  Loader,
  Modal,
  Paper,
  Portal,
  Text,
  useComputedColorScheme,
} from '@mantine/core'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconExternalLink,
  IconGhost,
  IconGripVertical,
  IconPhoto,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
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
import type { GoonMediaItem } from './goonMedia'
import { fetchGoonMedia } from './goonMedia'
import type { GoonGeometry, ViewportSize } from './widgetGeometry'
import {
  COLLAPSED_WIDTH,
  clampDragPosition,
  defaultGeometry,
  fitIntoView,
  HEADER_HEIGHT,
  MIN_HEIGHT,
  MIN_WIDTH,
  VIEWPORT_MARGIN,
} from './widgetGeometry'

const Z_INDEX = 1000
/** The gallery modal must sit above the always-on-top widget. */
const GALLERY_Z_INDEX = 2000
/** Deleted-tweet skips allowed per day before giving up on the list. */
const MAX_SKIPS = 10

function viewportSize(): ViewportSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

type EmbedStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty'
type GalleryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
type EmbedTheme = 'light' | 'dark'

/** Rounded corners for the embed area, matching X's own card. */
const EMBED_RADIUS = 16

interface TwitterWidgets {
  widgets: {
    createTweet: (
      id: string,
      el: HTMLElement,
      options?: Record<string, unknown>
    ) => Promise<HTMLElement | undefined>
  }
}

declare global {
  interface Window {
    twttr?: TwitterWidgets
  }
}

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js'
let widgetsPromise: Promise<TwitterWidgets> | null = null

function waitForWidgets(timeoutMs = 15_000): Promise<TwitterWidgets> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const tick = () => {
      if (window.twttr?.widgets) {
        resolve(window.twttr)
        return
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('twitter widgets timed out'))
        return
      }
      window.setTimeout(tick, 100)
    }
    tick()
  })
}

/** Inject `widgets.js` once and resolve with the global it publishes. */
function loadTwitterWidgets(): Promise<TwitterWidgets> {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr)
  if (widgetsPromise) return widgetsPromise
  if (!document.querySelector(`script[src="${WIDGETS_SRC}"]`)) {
    const script = document.createElement('script')
    script.src = WIDGETS_SRC
    script.async = true
    document.head.appendChild(script)
  }
  widgetsPromise = waitForWidgets()
  widgetsPromise.catch(() => {
    widgetsPromise = null
  })
  return widgetsPromise
}

async function renderTweet(
  id: string,
  el: HTMLElement,
  theme: EmbedTheme
): Promise<boolean> {
  const twttr = await loadTwitterWidgets()
  el.replaceChildren()
  const node = await twttr.widgets.createTweet(id, el, {
    theme,
    dnt: true,
    align: 'center',
  })
  if (!node || el.childElementCount === 0) return false
  // Stretch the embed to the full embed-area width immediately (the CSS rule
  // in components.css keeps it applied across X's re-measures; this covers
  // the first paint before stylesheets are re-evaluated).
  node.style.setProperty('width', '100%')
  node.shadowRoot
    ?.querySelector<HTMLIFrameElement>('iframe')
    ?.style.setProperty('width', '100%')
  return true
}

/** oEmbed answers 404/403 for deleted, private or suspended tweets. */
async function isTweetDeleted(id: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        `https://twitter.com/i/status/${id}`
      )}`
    )
    return response.status === 404 || response.status === 403
  } catch {
    return false
  }
}

/**
 * Embed one tweet: `createTweet` both rejects and silently renders nothing
 * depending on why it failed, so try twice and only then ask oEmbed whether
 * the tweet is actually gone. A network failure is never treated as deleted —
 * the caller keeps the id and offers Retry.
 */
async function embedTweet(
  id: string,
  el: HTMLElement,
  theme: EmbedTheme
): Promise<'ok' | 'deleted' | 'error'> {
  try {
    if (await renderTweet(id, el, theme)) return 'ok'
  } catch {
    // Either "not found" or a transient network error; verify below.
  }
  try {
    if (await renderTweet(id, el, theme)) return 'ok'
  } catch {
    // Still failing — fall through to the oEmbed check.
  }
  if (await isTweetDeleted(id)) return 'deleted'
  return 'error'
}

function safeStorage(): GoonStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
function readGeometry(): GoonGeometry | null {
  const storage = safeStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(GOON_STORAGE_KEYS.geom)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<GoonGeometry>
    if (
      typeof value.x === 'number' &&
      typeof value.y === 'number' &&
      typeof value.w === 'number' &&
      typeof value.h === 'number' &&
      [value.x, value.y, value.w, value.h].every((n) => Number.isFinite(n))
    ) {
      return {
        x: value.x,
        y: value.y,
        w: Math.max(MIN_WIDTH, value.w),
        h: Math.max(MIN_HEIGHT, value.h),
      }
    }
    return null
  } catch {
    return null
  }
}

function writeGeometry(geometry: GoonGeometry): void {
  safeStorage()?.setItem(GOON_STORAGE_KEYS.geom, JSON.stringify(geometry))
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
 * Always-on-top floating widget serving one random tweet per user per local
 * day. Collapsed on first run; once opened it reopens that way on reload, and
 * closing it (X) keeps it closed across reloads until reopened from the ghost
 * button.
 */
export function GoonCorner() {
  const allIds = useMemo(() => goonIds(), [])
  // Follow the app's scheme rather than hardcoding one, so the tweet card
  // always matches the surface it sits on.
  const colorScheme = useComputedColorScheme('dark', {
    // Read the real scheme on the first render so we don't embed twice.
    getInitialValueInEffect: false,
  })
  const embedTheme: EmbedTheme = colorScheme === 'dark' ? 'dark' : 'light'
  const [open, setOpen] = useState(readOpen)
  const [dismissed, setDismissed] = useState(readDismissed)
  // A persisted geometry may come from a larger window, so fit it on load.
  const [geometry, setGeometry] = useState(() =>
    fitIntoView(
      readGeometry() ?? defaultGeometry(viewportSize()),
      viewportSize()
    )
  )
  const [pick, setPick] = useState<GoonState | null>(null)
  const [status, setStatus] = useState<EmbedStatus>('idle')
  const [retryToken, setRetryToken] = useState(0)
  // Fullscreen gallery (hybrid): media fetched from FxEmbed, shown in our own
  // modal because clicks inside the official iframe cannot be intercepted.
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
  const embedRef = useRef<HTMLDivElement | null>(null)
  const skipRef = useRef({ date: '', count: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const resizeRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originW: number
    originH: number
  } | null>(null)

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

  useEffect(() => {
    writeGeometry(geometry)
  }, [geometry])

  // A window that shrinks can leave the box off screen.
  useEffect(() => {
    const handleResize = () =>
      setGeometry((current) => fitIntoView(current, viewportSize()))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Expanding from a corner would otherwise render the body off screen.
  const toggleOpen = () => {
    if (!open) setGeometry((current) => fitIntoView(current, viewportSize()))
    setOpen(!open)
  }

  const startGoon = () => {
    writeIntroSeen()
    setIntroSeen(true)
  }

  const currentId = pick?.current?.id ?? null
  const tweetUrl = currentId ? `https://x.com/i/status/${currentId}` : null
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
    // `dismissed` is a dependency because closing unmounts the embed host:
    // reopening has to mount the embed again.
    if (!open || dismissed || !currentId || !introSeen) return
    const host = embedRef.current
    const state = pickRef.current
    if (!host || !state) return

    const date = state.current?.date ?? todayKey()
    if (skipRef.current.date !== date) skipRef.current = { date, count: 0 }

    // Each run owns its node: StrictMode mounts effects twice in dev and the
    // widget script appends after an await, so a shared node would collect
    // iframes from both runs.
    const target = document.createElement('div')
    host.replaceChildren(target)
    let cancelled = false
    setStatus('loading')

    void embedTweet(currentId, target, embedTheme).then((result) => {
      if (cancelled) return
      if (result === 'ok') {
        skipRef.current.count = 0
        setStatus('ready')
        return
      }
      if (result === 'deleted' && skipRef.current.count < MAX_SKIPS) {
        skipRef.current.count += 1
        const latest = pickRef.current
        if (!latest) return
        const next = markCurrentInvalid({ state: latest, allIds, today: date })
        const storage = safeStorage()
        if (storage) writeState(storage, next)
        pickRef.current = next
        setPick(next)
        return
      }
      setStatus(result === 'deleted' ? 'empty' : 'error')
    })

    return () => {
      cancelled = true
      target.remove()
    }
  }, [open, dismissed, currentId, allIds, retryToken, embedTheme, introSeen])

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

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // Let the header's buttons receive their own clicks.
    if ((event.target as HTMLElement).closest('button')) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: geometry.x,
      originY: geometry.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = clampDragPosition(
      drag.originX + (event.clientX - drag.startX),
      drag.originY + (event.clientY - drag.startY),
      viewportSize()
    )
    setGeometry((current) => ({ ...current, x: next.x, y: next.y }))
  }

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.stopPropagation()
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originW: geometry.w,
      originH: geometry.h,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    const maxW = Math.max(MIN_WIDTH, window.innerWidth - geometry.x - 16)
    const maxH = Math.max(MIN_HEIGHT, window.innerHeight - geometry.y - 16)
    setGeometry((current) => ({
      ...current,
      w: Math.min(
        Math.max(MIN_WIDTH, resize.originW + (event.clientX - resize.startX)),
        maxW
      ),
      h: Math.min(
        Math.max(MIN_HEIGHT, resize.originH + (event.clientY - resize.startY)),
        maxH
      ),
    }))
  }

  const handleResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current
    if (!resize || resize.pointerId !== event.pointerId) return
    resizeRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

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
            setGeometry((current) => fitIntoView(current, viewportSize()))
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
          left: geometry.x,
          top: geometry.y,
          width: open ? geometry.w : COLLAPSED_WIDTH,
          height: open ? geometry.h : HEADER_HEIGHT,
          zIndex: Z_INDEX,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: HEADER_HEIGHT,
            flex: '0 0 auto',
            padding: '0 4px 0 6px',
            background: 'var(--mantine-color-dark-6)',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <IconGripVertical size={14} opacity={0.6} />
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
              className="goon-embed-area"
              style={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                borderRadius: EMBED_RADIUS,
                // The iframe gets its own compositing layer, and Chrome can skip
                // a `border-radius` clip on those; `clip-path` always applies.
                clipPath: `inset(0 round ${EMBED_RADIUS}px)`,
                // No background fill: the iframe is transparent (see below), so
                // the widget's own surface shows through everywhere the tweet
                // card doesn't cover — corner arcs included.
                //
                // Deliberately NOT inheriting the app's dark `color-scheme`.
                // Mantine sets `color-scheme: dark` on the page, and for a
                // cross-origin iframe Chrome then paints an opaque fallback
                // canvas behind it (crbug 40157837) — which is what showed up as
                // white corner arcs around the tweet card. Keeping a light scheme
                // here leaves the iframe transparent. The tweet itself still
                // renders dark via `theme`.
                colorScheme: 'light',
              }}
            >
              {/* No padding here on purpose: the iframe has to sit flush with
                the clipping box for its corners to be clipped away. */}
              <Box
                ref={embedRef}
                style={{ height: '100%', overflow: 'auto' }}
              />
              {!pick ||
              !currentId ||
              status === 'loading' ||
              status === 'error' ||
              status === 'empty' ? (
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: 16,
                    textAlign: 'center',
                    background: 'var(--mantine-color-body)',
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
                    </>
                  ) : status === 'empty' ? (
                    <Text size="sm" c="dimmed">
                      No more tweets to show today.
                    </Text>
                  ) : null}
                </Box>
              ) : null}
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

        {open ? (
          <Box
            aria-hidden
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 16,
              height: 16,
              cursor: 'nwse-resize',
              touchAction: 'none',
              background:
                'linear-gradient(135deg, transparent 50%, var(--mantine-color-dark-4) 50%)',
            }}
          />
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
                    color="gray"
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
                    onLoad={fitGalleryViewer}
                    style={{
                      width: 'auto',
                      height: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <video
                    key={galleryItem.url}
                    src={galleryItem.url}
                    poster={galleryItem.thumbnailUrl}
                    controls
                    preload="metadata"
                    onLoadedMetadata={fitGalleryViewer}
                    style={{
                      width: 'auto',
                      height: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                )}
                {galleryItems.length > 1 ? (
                  <ActionIcon
                    aria-label="next media"
                    variant="filled"
                    color="gray"
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
