import {
  Alert,
  Box,
  Button,
  Divider,
  Image,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { CardThemed, ModalWrapper } from '@zenless-optimizer/common/ui'
import { Suspense } from 'react'
import card from './card-sc.png'
import full from './full-sc.png'
export function ScanInfoModal() {
  const [show, onOpen, onClose] = useBoolState()
  return (
    <>
      <Button color="blue" onClick={onOpen} variant="default">
        <IconInfoCircle size={18} />
      </Button>
      <ModalWrapper
        opened={show}
        onClose={onClose}
        containerProps={{ maxWidth: 'sm' }}
      >
        <CardThemed>
          <Box p="sm">
            <Text fw={700}>How to Scan using screenshots</Text>
          </Box>
          <Divider />
          <Box p="sm">
            <Suspense fallback={<Skeleton width="100%" height={1000} />}>
              <Stack gap={8}>
                <Alert color="blue">
                  The on-site scanner can only scan screenshots in ENGLISH.
                </Alert>
                <Text>
                  Take a full screenshot of your game, in the inventory view.
                  You can use <strong>Alt + Print Screen</strong> to take a
                  picture of the current window.
                </Text>
                <Box>
                  <Image src={full} h={300} fit="contain" />
                </Box>
                <Text>
                  If the site is unable to detect from your screenshot, you can
                  provide a cropped image. You can use the{' '}
                  <strong>Windows Snippet tool (Windows + Shift + S)</strong>.
                </Text>
                <Box>
                  <Image src={card} h={400} fit="contain" />
                </Box>
              </Stack>
            </Suspense>
          </Box>
        </CardThemed>
      </ModalWrapper>
    </>
  )
}
