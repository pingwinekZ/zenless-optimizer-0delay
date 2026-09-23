import { Modal, Skeleton } from '@mantine/core'
import { IconTriangleInvertedFilled } from '@tabler/icons-react'
import { Suspense } from 'react'
import modalClasses from './DiscEditorModal.module.css'
import { DiscEditorModalContent } from './DiscEditorModalContent'
import { useDiscEditorModalStore } from './discEditorModalStore'

export function DiscEditorModal() {
  const open = useDiscEditorModalStore((s) => s.open)
  const closeOverlay = useDiscEditorModalStore((s) => s.closeOverlay)
  const config = useDiscEditorModalStore((s) => s.config)
  const prev = useDiscEditorModalStore((s) => s.config?.prev)
  const next = useDiscEditorModalStore((s) => s.config?.next)

  return (
    <div>
      <Modal size={560} centered opened={open} onClose={closeOverlay}>
        {open && (
          <Suspense fallback={<Skeleton height={400} />}>
            <DiscEditorModalContent
              key={
                config?.selectedDisc?.id ??
                `${config?.slotKey ?? 'new'}_${config?.characterKey ?? ''}`
              }
            />
          </Suspense>
        )}
      </Modal>
      {open && prev && (
        <IconTriangleInvertedFilled
          size={24}
          onClick={prev}
          className={modalClasses['navArrowLeft']}
        />
      )}
      {open && next && (
        <IconTriangleInvertedFilled
          size={24}
          onClick={next}
          className={modalClasses['navArrowRight']}
        />
      )}
    </div>
  )
}
