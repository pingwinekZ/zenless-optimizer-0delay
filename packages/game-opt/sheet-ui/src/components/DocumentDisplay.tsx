import { Box, Text } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import type { CardBackgroundColor } from '@zenless-optimizer/common/ui'
import { CardThemed } from '@zenless-optimizer/common/ui'
import { evalIfFunc } from '@zenless-optimizer/common/util'
import { CalcContext, TagContext } from '@zenless-optimizer/game-opt/formula-ui'
import { useContext, useState } from 'react'
import type { Document, FieldsDocument, TextDocument } from '../types'
import { ConditionalsDisplay } from './ConditionalDisplay'
import { FieldsDisplay } from './FieldDisplay'
import { HeaderDisplay } from './HeaderDisplay'

export function DocumentDisplay({
  document,
  bgt = 'normal',
  collapse = false,
  typoVariant = 'body1' as any,
}: {
  document: Document
  bgt?: CardBackgroundColor
  collapse?: boolean
  typoVariant?: string
}) {
  switch (document.type) {
    case 'fields':
      return <FieldsSectionDisplay fieldsDocument={document} bgt={bgt} />
    case 'text':
      return collapse ? (
        <TextSectionDisplayCollapse
          textDocument={document}
          typoVariant={typoVariant}
        />
      ) : (
        <TextSectionDisplay textDocument={document} typoVariant={typoVariant} />
      )
    case 'conditional':
      return (
        <ConditionalsDisplay
          conditional={document.conditional}
          // hideDesc={hideDesc}
          // hideHeader={hideHeader}
          // disabled={disabled}
          bgt={bgt}
        />
      )
    default:
      return null
  }
}

function FieldsSectionDisplay({
  fieldsDocument,
  bgt = 'normal',
}: {
  fieldsDocument: FieldsDocument
  bgt?: CardBackgroundColor
}) {
  return (
    <CardThemed bgt={bgt}>
      {fieldsDocument.header && (
        <HeaderDisplay
          header={fieldsDocument.header}
          hideDivider={fieldsDocument.fields.length === 0}
        />
      )}
      <FieldsDisplay bgt={bgt} fields={fieldsDocument.fields} />
    </CardThemed>
  )
}

function TextSectionDisplay({
  textDocument,
  typoVariant,
}: {
  textDocument: TextDocument
  typoVariant?: string
}) {
  const calculator = useContext(CalcContext)
  const tag = useContext(TagContext)
  if (!calculator) return null
  return (
    <Text style={{ fontSize: typoVariant === 'h6' ? undefined : undefined }}>
      {textDocument.header && <HeaderDisplay header={textDocument.header} />}
      {evalIfFunc(textDocument.text, calculator.withTag(tag))}
    </Text>
  )
}
function TextSectionDisplayCollapse({
  textDocument,
  typoVariant,
}: {
  textDocument: TextDocument
  typoVariant?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      {!expanded && (
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            height: '100%',
            alignItems: 'flex-end',
            zIndex: 10,
            transition: 'transform 0.3s ease',
            transform: hover ? 'translate(0,-5px)' : undefined,
          }}
        >
          <IconChevronDown />
        </div>
      )}
      <Box
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setExpanded((e) => !e)}
        style={{
          cursor: 'pointer',
          position: 'relative',
          maxHeight: expanded ? 'none' : '55px',
          overflow: 'hidden',
          ...(!expanded
            ? {
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, transparent 100%)',
                maskImage:
                  'linear-gradient(to bottom, black 0%, transparent 100%)',
              }
            : {}),
        }}
      >
        <TextSectionDisplay
          textDocument={textDocument}
          typoVariant={typoVariant}
        />
      </Box>
    </div>
  )
}
