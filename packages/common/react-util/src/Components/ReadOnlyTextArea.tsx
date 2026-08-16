export function ReadOnlyTextArea({
  value,
}: {
  value: string | number | string[]
}) {
  return (
    <textarea
      readOnly
      value={value}
      onClick={(e) => {
        const target = e.target as HTMLTextAreaElement
        target.selectionStart = 0
        target.selectionEnd = target.value.length
      }}
      style={{
        width: '100%',
        fontFamily: 'monospace',
        resize: 'vertical',
        minHeight: '5em',
      }}
    />
  )
}
