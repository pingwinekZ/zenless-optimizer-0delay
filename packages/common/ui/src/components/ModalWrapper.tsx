import type { ModalProps } from '@mantine/core'
import { Box, Modal } from '@mantine/core'

type ModalWrapperProps = ModalProps & {
  containerProps?: Record<string, any>
}

export function ModalWrapper({
  children,
  containerProps,
  ...props
}: ModalWrapperProps) {
  const { style: containerStyle, ...restContainerProps } = containerProps ?? {}
  return (
    <Modal
      styles={{
        body: { overflow: 'auto' },
      }}
      {...props}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh',
          ...containerStyle,
        }}
        p={{ base: 'xs' } as any}
        {...restContainerProps}
      >
        {children}
      </Box>
    </Modal>
  )
}

export type { ModalWrapperProps }
