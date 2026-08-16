import { Box } from '@mantine/core'

export function CodeBlock({ text }: { text: string }) {
  const lines = text.split(/\r\n|\r|\n/)

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: '0.25rem',
        paddingBottom: '0.25rem',
      }}
    >
      <Box
        component="code"
        spellCheck="false"
        aria-label="Code Sample"
        style={{
          lineHeight: 1,
          width: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '80%',
          border: 'none',
          padding: '1em',
          whiteSpace: 'pre-wrap',
          backgroundColor: 'transparent',
          resize: 'none',
          color: 'var(--mantine-color-blue-light)',
          background: 'var(--mantine-color-dark-filled)',
          marginTop: 0,
          paddingTop: 0,
        }}
      >
        <Box style={{ display: 'flex' }}>
          <Box style={{ flexGrow: 1 }} />
          <button
            type="button"
            style={{
              opacity: 0.5,
              padding: 0,
              marginTop: '0.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
            }}
            onClick={() => navigator.clipboard.writeText(text)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </Box>{' '}
        {lines.map((l, index) => {
          const numSpaces = l.search(/\S/)
          return (
            <span
              key={index}
              className="codeLine"
              style={{
                counterIncrement: 'lineNumber',
                margin: 0,
                display: 'block',
                paddingLeft: `${numSpaces * 7.5 + 20}px`,
                textIndent: `-${numSpaces * 7.5 + 20}px`,
              }}
            >
              {l}
            </span>
          )
        })}
      </Box>
    </Box>
  )
}
