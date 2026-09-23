import { Switch } from '@mantine/core'

export function MindscapesSwitch(props: React.ComponentProps<typeof Switch>) {
  return (
    <Switch
      styles={{
        root: { padding: '4px', width: '167px', height: '62px' },
        track: {
          borderRadius: 12,
          background: 'var(--layer-2) !important',
          opacity: '1 !important',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
          },
          '&::before': {
            content: '""',
            left: 20,
            background: 'var(--mantine-color-mindscapeActive-filled)',
            borderRadius: '50%',
          },
          '&::after': {
            content: '""',
            right: 20,
            background: 'var(--mantine-color-mindscapeInactive-filled)',
            borderRadius: '50%',
          },
          '&[data-checked]': {
            background: '#1B263B !important',
            opacity: 1,
          },
        },
        thumb: {
          width: '100px',
          height: '52px',
          borderRadius: '30px',
          margin: '2px',
          background: 'var(--layer-2)',
        },
      }}
      {...props}
    />
  )
}
