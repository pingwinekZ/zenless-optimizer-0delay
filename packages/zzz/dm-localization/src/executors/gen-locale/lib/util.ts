import { nounData } from '../../../../dm'

export function processText(text: string) {
  const processedText = text
    .replaceAll('<color=', '<ct color=')
    .replaceAll('</color>', '</ct>')
    // Process IconMap input buttons like <IconMap:Icon_Normal> to be <IconNormal />
    .replace(
      /<IconMap:([a-zA-Z_]*?)>/g,
      (_match, capture: string) => `<${capture.replaceAll('_', '')} />`
    )
    // Resolve <Term:ID>Content</Term> tags to the noun's Name, e.g. <Term:1000017>Chromatic Tint</Term> -> Chromatic Tint
    .replace(
      /<Term:(\d+)>[^<]*<\/Term>/g,
      (_match, id) => nounData[id]?.Name ?? _match
    )
    // Clean up object coercion artifacts from structured Term objects
    .replace(/\s*\[object Object\]\s*/g, ' ')

  // Convert \n to real breaks
  if (processedText.includes('\n'))
    return Object.fromEntries(
      processedText.split('\n').map((str, index) => [index, str])
    )

  return processedText
}
