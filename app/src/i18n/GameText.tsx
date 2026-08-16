import { ColorText, ImgIcon } from '@zenless-optimizer/common/ui'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { commonDefIcon } from '../assets'

const COND_GREEN = '#2BAD00'

const textComponents = {
  ct: <ColorText />,
  IconNormal: <ImgIcon src={commonDefIcon('basicFlat')} size={1.5} />,
  IconEvade: <ImgIcon src={commonDefIcon('dodgeFlat')} size={1.5} />,
  IconSpecial: <ImgIcon src={commonDefIcon('specialFlat')} size={1.5} />,
  IconSpecialReady: (
    <ImgIcon src={commonDefIcon('specialReadyFlat')} size={1.5} />
  ),
  IconSpecialReadyRp: (
    <ImgIcon src={commonDefIcon('specialRpReadyFlat')} size={1.5} />
  ),
  IconUltimateReady: (
    <ImgIcon src={commonDefIcon('chainReadyFlat')} size={1.5} />
  ),
  IconSwitch: <ImgIcon src={commonDefIcon('assistFlat')} size={1.5} />,
}

// Matches numbers (int, decimal, comma-formatted) optionally followed by %
const NUM_RE = /\d+(?:[,.]\d+)*(?:%)?/g

function highlightNumbers(text: string): string {
  // Split into tags and text runs, wrap bare numbers in text runs with gold
  const TAG_RE = /(<[^>]+>[^<]*<\/[^>]+>|<[^/]+\/>)/g
  return text
    .split(TAG_RE)
    .map((part) => {
      if (part.startsWith('<')) return part
      return part.replace(NUM_RE, (m) => `<ct color=${COND_GREEN}>${m}</ct>`)
    })
    .join('')
}

export function GameText({ text }: { text: string }) {
  const processed = useMemo(() => highlightNumbers(text), [text])
  return (
    <Trans i18nKey="invalid" defaults={processed} components={textComponents} />
  )
}

/**
 * Loads a locale string from a generated locale file (e.g. char_Miyabi_gen)
 * and renders it with full in-game formatting + number highlighting.
 *
 * @example
 * <GameDesc ns="char_Miyabi_gen" key18="mindscapes.1.desc" />
 */
export function GameDesc({ ns, key18 }: { ns: string; key18: string }) {
  const { t } = useTranslation(ns)
  const textKey = `${ns}:${key18}`
  const obj = t(textKey, { returnObjects: true })

  if (typeof obj === 'string') return <GameText text={obj} />
  // Multiple paragraphs — render each separately with spacing
  const paragraphs = Object.values(obj as Record<string, string>).filter(
    (v): v is string => typeof v === 'string'
  )
  return (
    <>
      {paragraphs.map((para, i) => (
        <div
          key={i}
          style={{ marginBottom: i < paragraphs.length - 1 ? 8 : 0 }}
        >
          <GameText text={para} />
        </div>
      ))}
    </>
  )
}
