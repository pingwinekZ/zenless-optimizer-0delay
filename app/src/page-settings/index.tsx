import { Flex } from '@mantine/core'
import { DatabaseCard, DiscScannerCard } from '../ui'
import { LiveImportCard } from '../websocket/LiveImportCard'

export default function PageSettings() {
  return (
    <Flex direction="column" gap="md" maw={1400} w="100%" mx="auto">
      <DatabaseCard />
      <LiveImportCard />
      <DiscScannerCard />
    </Flex>
  )
}
