import { Divider } from '@mantine/core'
import { CardHeaderCustom } from '@zenless-optimizer/common/ui'
import type { Document, Header } from '../types'

export function HeaderDisplay({
  header,
  hideDivider,
}: {
  header: Header
  hideDivider?: boolean | ((section: Document) => boolean)
}) {
  const { icon, text: title, additional: action } = header

  return (
    <>
      <CardHeaderCustom avatar={icon} title={title} action={action} />
      {!hideDivider && <Divider />}
    </>
  )
}
