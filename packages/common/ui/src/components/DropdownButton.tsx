import type { ButtonProps } from '@mantine/core'
import { Button, Menu, Skeleton } from '@mantine/core'
import { Suspense, useCallback, useState } from 'react'

export type DropdownButtonProps = Omit<ButtonProps, 'title'> & {
  title: React.ReactNode
  id?: string
  children: React.ReactNode
}

export function DropdownButton({
  title,
  children,
  id = 'dropdownbtn',
  ...props
}: DropdownButtonProps) {
  const [opened, setOpened] = useState(false)
  const handleClose = useCallback(() => setOpened(false), [setOpened])

  return (
    <Suspense
      fallback={
        <Button
          rightSection={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          }
          {...props}
        >
          <Skeleton width={50} />
        </Button>
      }
    >
      <Menu opened={opened} onChange={setOpened} withinPortal zIndex={1500}>
        <Menu.Target>
          <Button
            {...props}
            id={id}
            rightSection={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            }
          >
            {title}
          </Button>
        </Menu.Target>
        <Menu.Dropdown
          style={{ maxHeight: '50vh', overflow: 'auto' }}
          onClick={handleClose}
        >
          <Suspense fallback={<Skeleton width="100%" height={1000} />}>
            {children}
          </Suspense>
        </Menu.Dropdown>
      </Menu>
    </Suspense>
  )
}
