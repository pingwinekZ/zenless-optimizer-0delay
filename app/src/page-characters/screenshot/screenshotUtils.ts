/**
 * Screenshot Utilities for Character Card Capture
 *
 * Ported 1:1 from hsr-optimizer (`src/lib/utils/screenshotUtils.ts`), which uses
 * `@zumer/snapdom` for DOM-to-image capture. Only the HSR-specific branches were
 * dropped, because the corresponding features do not exist in ZZZ:
 *
 * - **Spine/L2D portraits** (`data-portrait-spine`): HSR renders the portrait as a
 *   canvas animation whose pixels are cleared after presentation, so snapdom
 *   captured a blank frame and the live DOM had to be patched with a static
 *   portrait first. ZZZ portraits are plain `<img>` cutouts, which capture
 *   natively — `prepareLiveDomForCapture` and its `data-portrait-*` attributes
 *   are therefore unnecessary.
 * - **Cross-origin custom portraits** (`data-fallback-src`): HSR lets users upload
 *   portraits from foreign hosts that taint the canvas. ZZZ has no custom
 *   portraits, so tainted images just fall back to snapdom's own fetch.
 * - **Pre-baked background blur**: HSR blurs a full-bleed portrait `<img>` with a
 *   CSS filter, which iOS Safari renders unreliably. ZZZ's background wash is a
 *   plain CSS gradient (`ShowcaseBackgroundBlur`), so there is no filtered image
 *   to bake.
 * - **Portrait hover buttons**: HSR hides `.character-build-portrait-button` in the
 *   clone; ZZZ's preview has no hover affordances over the portrait.
 *
 * ## Capture Flow
 *
 * 1. Pre-fetch the card's images and convert them to data URIs (live DOM stays
 *    untouched; the plugin rewrites `src` on the clone only)
 * 2. `snapdom()` capture with a retry loop (up to 3x, break when blob > 1.5 MB)
 * 3. Hand the blob to download / clipboard / Web Share
 *
 * ## Why images are inlined
 *
 * snapdom re-fetches every `<img src>` on the clone, which can lose a race with
 * the rasterizer and comes back blank. Handing it data URIs removes that
 * failure mode entirely.
 *
 * ## Mobile-specific Handling
 *
 * - `navigator.clipboard.write` is unsupported on mobile Safari, so the clipboard
 *   action uses the Web Share API there.
 */

import { Message } from '@zenless-optimizer/zzz/ui'
import { type SnapdomPlugin, snapdom } from '@zumer/snapdom'
import i18next from 'i18next'
import { cardTotalW, parentH } from '../constantsUi'

const SCREENSHOT_IMAGE_TYPE = 'png'
const SCREENSHOT_EXPORT_DPR = 2

function isMobileOrSafari(): boolean {
  const userAgent = navigator.userAgent
  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|BlackBerry/i.test(
      userAgent
    )
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
  return isMobile || isSafari
}

/**
 * Convert loaded images to data URIs so snapdom doesn't re-fetch them.
 *
 * Images that taint the canvas (cross-origin without CORS headers) are skipped —
 * snapdom then falls back to its own fetch for those.
 */
async function buildImageDataUriCache(
  root: Element
): Promise<Map<string, string>> {
  const cache = new Map<string, string>()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return cache

  for (const img of root.querySelectorAll<HTMLImageElement>('img')) {
    if (
      !img.complete ||
      !img.naturalWidth ||
      img.src.startsWith('data:') ||
      cache.has(img.src)
    )
      continue
    try {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      cache.set(img.src, canvas.toDataURL())
    } catch {
      // Tainted canvas (cross-origin image) — leave it for snapdom to fetch.
    }
  }

  return cache
}

/** Snapdom plugin that replaces img srcs on the clone with pre-built data URIs. */
function buildImageInliningPlugin(cache: Map<string, string>): SnapdomPlugin {
  return {
    name: 'image-inlining',
    afterClone({ clone }) {
      if (!clone) return
      for (const img of clone.querySelectorAll<HTMLImageElement>('img')) {
        const dataUrl = cache.get(img.src)
        if (dataUrl) img.src = dataUrl
      }
    },
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Screenshot attempt timed out after ${ms}ms`)),
      ms
    )
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}

/**
 * Captures a screenshot of the element and either copies it to the clipboard or
 * downloads it.
 *
 * @param elementId - DOM element ID to capture
 * @param action - `'clipboard'` uses the Web Share API on mobile and
 *   `navigator.clipboard.write` on desktop; `'download'` saves a `.png`
 * @param characterName - Optional name used in the downloaded file
 */
export async function screenshotElementById(
  elementId: string,
  action: 'clipboard' | 'download',
  characterName?: string | null
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    console.warn(`screenshotElementById: element "${elementId}" not found`)
    return
  }

  const mobile = isMobileOrSafari()

  const repeatLoadBlob = async (): Promise<Blob> => {
    const maxAttempts = 3
    const attemptTimeoutMs = 8000

    // The card renders in "Maven Pro" — make sure the faces are in before we
    // serialize the document, or snapdom embeds a fallback.
    await Promise.all([
      document.fonts.load('400 1em "Maven Pro"'),
      document.fonts.load('500 1em "Maven Pro"'),
    ]).catch(() => {
      /* best-effort */
    })

    // v3 embeds the card's web fonts automatically and caches resources
    // internally, so no preCache / manual font dance is needed beyond this
    // best-effort wait for "Maven Pro" before serializing.
    const imageCache = await buildImageDataUriCache(element)

    let blob: Blob | null = null
    let lastError: unknown = null
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const capture = await withTimeout(
          snapdom(element, {
            // v3: width/height take precedence over scale, and font embedding
            // is automatic ('auto'), so neither scale nor embedFonts is passed.
            dpr: SCREENSHOT_EXPORT_DPR,
            width: cardTotalW,
            height: parentH,
            backgroundColor: 'transparent',
            outerShadows: true,
            fallbackURL:
              'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            plugins: [buildImageInliningPlugin(imageCache)],
          }),
          attemptTimeoutMs
        )
        blob = await capture.toBlob({
          format: SCREENSHOT_IMAGE_TYPE,
          quality: 1.0,
        })
        // A small blob means the rasterizer dropped content — retry.
        if (blob && blob.size > 1_500_000) break
      } catch (e) {
        lastError = e
      }
    }

    if (!blob) {
      const msg =
        lastError instanceof Error ? lastError.message : 'unknown error'
      throw new Error(`Screenshot failed after ${maxAttempts} attempts: ${msg}`)
    }
    return blob
  }

  function handleBlob(blob: Blob): void {
    const prefix = characterName || 'Zenless-optimizer'
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `${prefix}-${date}-${time}.png`

    if (action === 'clipboard') {
      if (mobile) {
        const file = new File([blob], filename, { type: blob.type })
        const canShareFiles =
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })
        if (canShareFiles) {
          navigator
            .share({ files: [file], title: '', text: '' })
            .catch((e: unknown) => {
              // Don't show an error toast when the user cancels the share dialog
              if (e instanceof Error && e.name === 'AbortError') return
              Message.error(i18next.t('page_characters:screenshot.failed'))
            })
        } else {
          Message.error(i18next.t('page_characters:screenshot.failed'))
        }
      } else {
        const data = [new ClipboardItem({ [blob.type]: blob })]
        void navigator.clipboard
          .write(data)
          .then(() =>
            Message.success(i18next.t('page_characters:screenshot.success'))
          )
          .catch((e) => {
            if (e instanceof DOMException && e.name === 'NotAllowedError') {
              Message.error(i18next.t('page_characters:screenshot.notAllowed'))
            } else {
              Message.error(i18next.t('page_characters:screenshot.failed'))
            }
            console.error(e)
          })
      }
    }

    if (action === 'download') {
      const fileUrl = window.URL.createObjectURL(blob)
      const anchorElement = document.createElement('a')
      anchorElement.href = fileUrl
      anchorElement.download = filename
      anchorElement.style.display = 'none'
      document.body.appendChild(anchorElement)
      anchorElement.click()
      anchorElement.remove()
      window.URL.revokeObjectURL(fileUrl)
      Message.success(i18next.t('page_characters:screenshot.downloadSuccess'))
    }
  }

  let blob
  try {
    blob = await repeatLoadBlob()
  } catch (e) {
    Message.error(i18next.t('page_characters:screenshot.failed'))
    console.error(e)
    return
  }
  handleBlob(blob)
}
