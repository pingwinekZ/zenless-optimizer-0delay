import { UnstyledButton } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import {
  allCharacterKeys,
  type CharacterKey,
} from '@zenless-optimizer/zzz/consts'
import { useDatabaseContext } from '@zenless-optimizer/zzz/db-ui'
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router'
import { useNavigateContext } from './NavigateContext'
import { RELEASE_TIME } from './SunbringerCountdown'

/** One-time-per-browser flag; set the moment the entrance is shown. */
const SEEN_KEY = 'sunbringer_entrance_seen'

/**
 * "Enter the site" opens the optimizer on Sunbringer. Her roster key is not in
 * the bundled data yet, so it is kept as a plain string and only used once
 * `allCharacterKeys` actually contains it; until then the button just opens
 * the optimizer tab on the current character.
 */
const SUNBRINGER_KEY = 'Sunbringer'

function isKnownCharacter(key: string): key is CharacterKey {
  return (allCharacterKeys as readonly string[]).includes(key)
}

const AUDIO_SRC = `${import.meta.env.BASE_URL ?? '/'}sunbringer-entrance.mp3`
const ART_URL = 'https://static.nanoka.cc/assets/zzz/IconRole1601.webp'

/** Hype segment of "Know My Name ft. True Damage": 162s → 226s. */
const CLIP_START = 162
const CLIP_END = 226

/**
 * `?sunbringer=preview` (query or hash) forces the entrance immediately and
 * never touches the seen-flag, so it can be replayed during development.
 */
function isPreview(): boolean {
  const probe = `${window.location.search}#${window.location.hash}`
  return probe.includes('sunbringer=preview')
}

/** Sparse dust motes — deliberately tiny and dim, no glow. */
const DUST = [
  { left: '8%', bottom: '16%', delay: '0s', dur: '17s', size: 2, o: 0.35 },
  { left: '17%', bottom: '58%', delay: '3.4s', dur: '21s', size: 3, o: 0.22 },
  { left: '24%', bottom: '30%', delay: '7.1s', dur: '19s', size: 2, o: 0.3 },
  { left: '33%', bottom: '74%', delay: '1.8s', dur: '23s', size: 2, o: 0.18 },
  { left: '41%', bottom: '20%', delay: '9.2s', dur: '18s', size: 3, o: 0.26 },
  { left: '56%', bottom: '78%', delay: '4.6s', dur: '22s', size: 2, o: 0.2 },
  { left: '63%', bottom: '27%', delay: '11.4s', dur: '20s', size: 3, o: 0.3 },
  { left: '71%', bottom: '64%', delay: '6.2s', dur: '24s', size: 2, o: 0.2 },
  { left: '80%', bottom: '13%', delay: '2.5s', dur: '17s', size: 2, o: 0.32 },
  { left: '88%', bottom: '49%', delay: '8.7s', dur: '21s', size: 3, o: 0.22 },
  { left: '94%', bottom: '25%', delay: '13.1s', dur: '19s', size: 2, o: 0.28 },
  { left: '50%', bottom: '9%', delay: '5.5s', dur: '23s', size: 2, o: 0.18 },
]

const styles = `
@keyframes se-flash {
  from { opacity: 0.38; }
  to { opacity: 0; }
}
@keyframes se-sweep {
  from { transform: translateX(-150%) skewX(-14deg); }
  to { transform: translateX(260%) skewX(-14deg); }
}
@keyframes se-art-in {
  from { clip-path: inset(100% 0 0 0); transform: translateY(26px) scale(1.04); }
  to { clip-path: inset(0 0 0 0); transform: none; }
}
@keyframes se-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes se-title-in {
  from { transform: translateY(112%); }
  to { transform: none; }
}
@keyframes se-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes se-ring {
  from { transform: scale(0.84); opacity: 0.6; }
  to { transform: scale(1.55); opacity: 0; }
}
@keyframes se-dust {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  14% { opacity: var(--o); }
  100% { opacity: 0; transform: translate3d(20px, -120px, 0); }
}

.se-root {
  position: fixed; inset: 0; z-index: 2000; overflow: hidden;
  background: #07070a; color: #f5f2ec;
  --mx: 0; --my: 0;
}
.se-bg { position: absolute; inset: 0; pointer-events: none; }
.se-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(115% 85% at 50% 44%, transparent 38%, rgba(0, 0, 0, 0.78) 100%);
}
.se-grain {
  position: absolute; inset: -25%; opacity: 0.14; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>");
}
.se-sweep {
  position: absolute; top: -25%; left: 0; width: 26%; height: 150%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  animation: se-sweep 1.6s 0.1s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.se-flash {
  position: absolute; inset: 0; background: #fbf7f0;
  animation: se-flash 0.5s ease-out forwards;
  pointer-events: none;
}
.se-dust {
  position: absolute; border-radius: 50%; background: rgba(255, 216, 176, 0.55);
  animation-name: se-dust; animation-timing-function: linear; animation-iteration-count: infinite;
  pointer-events: none;
}
.se-center {
  position: relative; height: 100%;
  display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; gap: 8px;
  padding: 14px 16px 16px; text-align: center;
}
.se-ghost {
  position: absolute; left: 50%; top: 45%;
  translate: calc(-50% + var(--mx) * 22px) calc(-50% + var(--my) * 12px);
  transition: translate 700ms cubic-bezier(0.16, 1, 0.3, 1);
  font-size: clamp(2.6rem, 13vw, 11rem); font-weight: 900;
  letter-spacing: 0.05em; text-indent: 0.05em; text-transform: uppercase;
  white-space: nowrap; color: transparent;
  -webkit-text-stroke: 1px rgba(245, 242, 236, 0.075);
  user-select: none; animation: se-rise 1.6s 0.15s ease-out both;
}
.se-sun {
  position: absolute; left: 50%; top: 44%;
  translate: -50% -50%;
  width: min(74vh, 640px); aspect-ratio: 1;
  border: 1px solid rgba(245, 242, 236, 0.09); border-radius: 50%;
}
.se-sun::after {
  content: ''; position: absolute; inset: 9%;
  border: 1px solid rgba(245, 242, 236, 0.05); border-radius: 50%;
}
/* The stage owns all remaining height so the art can grow to fit the page;
   the lockup stays pinned to the bottom of it. Grid (not flex) on purpose: a
   minmax(0, 1fr) track gives the art area a definite height, which is what
   lets the image resolve its 100% height and actually scale with the page. */
.se-stage {
  position: relative; width: 100%;
  flex: 1 1 auto; min-height: 0;
  display: grid; grid-template-rows: minmax(0, 1fr) auto;
  justify-items: center;
}
.se-art-wrap {
  position: relative; width: 100%; height: 100%; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  translate: calc(var(--mx) * -10px) calc(var(--my) * -6px);
  transition: translate 700ms cubic-bezier(0.16, 1, 0.3, 1);
  animation: se-rise 1s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.se-art {
  display: block; width: 100%; height: 100%;
  object-fit: contain; object-position: center bottom;
  animation: se-art-in 1.15s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  filter: drop-shadow(0 30px 44px rgba(0, 0, 0, 0.7));
}
.se-ring {
  position: absolute; left: 50%; top: 50%;
  translate: -50% -50%;
  height: 74%; aspect-ratio: 1;
  border: 1px solid rgba(255, 122, 46, 0.75); border-radius: 50%;
  animation: se-ring 1.4s 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  pointer-events: none;
}
.se-lockup { position: relative; flex: 0 0 auto; margin-top: 10px; }
.se-title {
  margin: 0; overflow: hidden; padding: 0 0.08em;
  font-size: clamp(2.4rem, 7.5vw, 5.2rem);
  font-weight: 900; line-height: 1.04;
  letter-spacing: 0.07em; text-indent: 0.07em; text-transform: uppercase;
  color: #f7f4ee;
}
.se-title span { display: block; animation: se-title-in 0.95s 0.75s cubic-bezier(0.16, 1, 0.3, 1) both; }
.se-rule {
  width: 100%; height: 2px; margin-top: 12px; background: #ff5c1f;
  transform-origin: center; animation: se-draw 0.8s 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.se-sub {
  margin: 10px 0 0; font-size: 11px; font-weight: 600;
  color: rgba(245, 242, 236, 0.5);
  letter-spacing: 0.42em; text-indent: 0.42em; text-transform: uppercase;
  animation: se-rise 0.7s 1.25s ease-out both;
}
.se-lower { display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
.se-enter {
  appearance: none; background: none; border: 0; cursor: pointer;
  padding: 6px; color: #f5f2ec;
  font: inherit; font-size: 12px; font-weight: 700;
  letter-spacing: 0.3em; text-indent: 0.3em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 12px;
  animation: se-rise 0.7s 1.4s ease-out both;
}
.se-enter span {
  display: block; width: 30px; height: 1px; background: #ff5c1f;
  transition: width 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
.se-enter:hover span { width: 52px; }
.se-close {
  position: absolute; top: 16px; right: 16px;
  display: grid; place-items: center;
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid rgba(245, 242, 236, 0.2);
  background: rgba(255, 255, 255, 0.03); color: rgba(245, 242, 236, 0.7);
  animation: se-rise 0.6s 1.55s ease-out both;
}
.se-close:hover { color: #fff; border-color: rgba(245, 242, 236, 0.55); }
@media (prefers-reduced-motion: reduce) {
  .se-root *, .se-root *::before, .se-root *::after {
    animation-duration: 0.001s !important; animation-delay: 0s !important;
    transition: none !important;
  }
}
`

/**
 * One-time full-screen entrance celebrating Sunbringer's release: a
 * cinematic title card — oversized outline wordmark, hairline sun ring,
 * character art revealed bottom-up, a masked title reveal and a single
 * accent rule, over film grain and a vignette. Music is the 162s→226s clip
 * of "Know My Name" (bundled in public/).
 *
 * Shows once per browser after RELEASE_TIME (localStorage), or on demand via
 * `?sunbringer=preview` for development. The clip autoplays on its own; if
 * the browser blocks that, the first click/keypress anywhere starts it — no
 * play button is shown.
 */
export function SunbringerEntrance() {
  const [show, setShow] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const startedRef = useRef(false)
  const { database } = useDatabaseContext()
  const { navigateToOptimize } = useNavigateContext()
  const navigate = useNavigate()

  // One-time trigger: after release, the first visit per browser shows it.
  useEffect(() => {
    if (isPreview()) {
      setShow(true)
      return
    }
    if (Date.now() < RELEASE_TIME) return
    if (window.localStorage.getItem(SEEN_KEY)) return
    window.localStorage.setItem(SEEN_KEY, '1')
    setShow(true)
  }, [])

  // Transport listener living for the whole app lifetime (this component is
  // always mounted — only the overlay is conditional), so the clip keeps
  // playing after the entrance closes and still stops at the clip end.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTimeUpdate = () => {
      if (a.currentTime >= CLIP_END) {
        a.pause()
        a.currentTime = CLIP_START
      }
    }
    a.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [])

  // First time the entrance shows: seek to the clip start and autoplay.
  // Deliberately does NOT pause on cleanup — closing the window leaves the
  // music running. If the browser refuses autoplay (no user gesture yet), the
  // first click/keypress anywhere in the app starts the clip instead.
  useEffect(() => {
    if (!show) return
    const a = audioRef.current
    if (!a || startedRef.current) return
    startedRef.current = true

    const seekToStart = () => {
      try {
        a.currentTime = CLIP_START
      } catch {
        // seeking can throw before metadata is ready — loadedmetadata retries
      }
    }
    const start = () => {
      if (a.currentTime < CLIP_START || a.currentTime >= CLIP_END) {
        seekToStart()
      }
      a.play().catch(() => {})
    }
    const onBlocked = () => {
      window.addEventListener('pointerdown', start, { once: true })
      window.addEventListener('keydown', start, { once: true })
    }

    if (a.readyState >= 1) seekToStart()
    else a.addEventListener('loadedmetadata', seekToStart, { once: true })
    a.play().catch(onBlocked)

    return () => {
      a.removeEventListener('loadedmetadata', seekToStart)
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [show])

  // Subtle pointer parallax: the art drifts against the oversized outline
  // word behind it. Two CSS variables keep the entry animations untouched.
  useEffect(() => {
    if (!show) return
    const root = rootRef.current
    if (!root) return
    const onMove = (e: PointerEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2
      const my = (e.clientY / window.innerHeight - 0.5) * 2
      root.style.setProperty('--mx', mx.toFixed(3))
      root.style.setProperty('--my', my.toFixed(3))
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [show])

  const close = useCallback(() => {
    // No pause here: the entrance music runs to the end of the clip even
    // after the window is dismissed.
    if (!isPreview()) window.localStorage.setItem(SEEN_KEY, '1')
    setShow(false)
  }, [])

  // "Enter the site" drops the visitor straight into Sunbringer's optimizer.
  const enterSite = useCallback(() => {
    close()
    if (!isKnownCharacter(SUNBRINGER_KEY)) {
      navigate('/optimize')
      return
    }
    // The optimize page only lists characters already in the database, so the
    // record has to exist or it falls back to whichever character is first.
    database.chars.getOrCreate(SUNBRINGER_KEY)
    navigateToOptimize(SUNBRINGER_KEY)
  }, [close, database.chars, navigate, navigateToOptimize])

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [show, close])

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />
      {show && (
        <div className="se-root" ref={rootRef}>
          <style>{styles}</style>
          <div className="se-bg">
            <span className="se-sun" />
            <span className="se-ghost">Sunbringer</span>
            <span className="se-sweep" />
            <span className="se-vignette" />
            <span className="se-grain" />
          </div>
          <div className="se-flash" />
          {DUST.map((d, i) => (
            <span
              key={i}
              className="se-dust"
              style={
                {
                  left: d.left,
                  bottom: d.bottom,
                  width: d.size,
                  height: d.size,
                  animationDelay: d.delay,
                  animationDuration: d.dur,
                  '--o': String(d.o),
                } as CSSProperties
              }
            />
          ))}

          <div className="se-center">
            <div className="se-stage">
              <div className="se-art-wrap">
                <img className="se-art" src={ART_URL} alt="Sunbringer" />
                <span className="se-ring" />
              </div>
              <div className="se-lockup">
                <h1 className="se-title">
                  <span>Sunbringer</span>
                </h1>
                <div className="se-rule" />
                <p className="se-sub">has arrived</p>
              </div>
            </div>

            <div className="se-lower">
              <button className="se-enter" type="button" onClick={enterSite}>
                Enter the site
                <span />
              </button>
            </div>
          </div>

          <UnstyledButton
            className="se-close"
            onClick={close}
            aria-label="Close"
          >
            <IconX size={24} />
          </UnstyledButton>
        </div>
      )}
    </>
  )
}
