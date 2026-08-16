import { ColorText } from './ColorText'

export function StarsDisplay<S extends number>({
  stars = 1 as S,
  colored = false,
  inline = false,
}: {
  stars?: S
  colored?: boolean
  inline?: boolean
}) {
  return (
    <ColorText color={colored ? 'warning' : undefined}>
      {inline ? (
        <span style={{ whiteSpace: 'nowrap' }}>
          {[...Array(stars).keys()].map((_, i) => (
            <svg
              key={i}
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ verticalAlign: 'text-top' }}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </span>
      ) : (
        [...Array(stars).keys()].map((_, i) => (
          <svg
            key={i}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))
      )}
    </ColorText>
  )
}
