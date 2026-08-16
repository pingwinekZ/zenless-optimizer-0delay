import { ActionIcon, Affix, Transition } from '@mantine/core'
import { useWindowScroll } from '@mantine/hooks'

export function ScrollTop() {
  const [scroll] = useWindowScroll()

  const handleClick = () => {
    const anchor = document.querySelector('#back-to-top-anchor')
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }

  return (
    <Affix position={{ bottom: 100, right: 16 }}>
      <Transition mounted={scroll.y > 100} transition="slide-up" duration={200}>
        {(transitionStyle) => (
          <div style={transitionStyle}>
            <ActionIcon
              variant="filled"
              color="gray"
              size="md"
              aria-label="scroll back to top"
              onClick={handleClick}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
              </svg>
            </ActionIcon>
          </div>
        )}
      </Transition>
    </Affix>
  )
}
