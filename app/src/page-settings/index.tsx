import { Flex } from '@mantine/core'
import { LocalStorageUsageCard } from '@zenless-optimizer/common/react-util'
import { DatabaseCard, DiscScannerCard } from '@zenless-optimizer/zzz/ui'
import { LiveImportCard } from '@zenless-optimizer/zzz/websocket/LiveImportCard'

export default function PageSettings() {
  return (
    <Flex direction="column" gap="md" maw={1400} w="100%" mx="auto">
      <DatabaseCard />
      <LocalStorageUsageCard />
      <LiveImportCard />
      <DiscScannerCard />
    </Flex>
  )
}
