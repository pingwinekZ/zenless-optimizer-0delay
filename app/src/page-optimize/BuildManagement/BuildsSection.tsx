import { Button, Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CharacterKey } from '../../consts'
import type { GeneratedBuild } from '../../db'
import { useCharacterContext } from '../../db-ui'
import { HeaderText, TooltipImage } from '../layout'
import { LoadBuildModal } from './LoadBuildModal'
import { SaveBuildModal } from './SaveBuildModal'

const defaultGap = 5

export const BuildsSection = memo(function BuildsSection({
  isFullSize,
  selectedBuild = null,
  characterKey = null,
}: {
  isFullSize?: boolean
  selectedBuild?: GeneratedBuild | null
  characterKey?: CharacterKey | null
}) {
  const { t } = useTranslation('page_optimize')
  const [saveOpened, { open: openSave, close: closeSave }] =
    useDisclosure(false)
  const [loadOpened, { open: openLoad, close: closeLoad }] =
    useDisclosure(false)

  const contextKey = useCharacterContext()?.key
  const key = characterKey ?? contextKey ?? null

  if (!isFullSize || !key) return null

  return (
    <>
      <Flex direction="column">
        <Flex justify="space-between" align="center">
          <HeaderText>{t('buildsSection.header', 'Builds')}</HeaderText>
          <TooltipImage
            type={{
              title: t('buildsSection.hintTitle', 'Builds'),
              content: (
                <Flex direction="column" gap={10}>
                  <p>
                    {t(
                      'buildsSection.hintSave',
                      'Save - Save the currently selected build as well as all the optimizer settings'
                    )}
                  </p>
                  <p>
                    {t(
                      'buildsSection.hintLoad',
                      'Load - Load a saved build into the optimizer. This includes teammates, conditionals, and combo settings'
                    )}
                  </p>
                </Flex>
              ),
            }}
          />
        </Flex>
        <Flex gap={defaultGap} justify="space-around">
          <Button variant="default" style={{ flex: 1 }} onClick={openSave}>
            {t('buildsSection.save', 'Save')}
          </Button>
          <Button variant="default" style={{ flex: 1 }} onClick={openLoad}>
            {t('buildsSection.load', 'Load')}
          </Button>
        </Flex>
      </Flex>

      <SaveBuildModal
        opened={saveOpened}
        onClose={closeSave}
        selectedBuild={selectedBuild}
        characterKey={key}
      />
      <LoadBuildModal
        opened={loadOpened}
        onClose={closeLoad}
        characterKey={key}
      />
    </>
  )
})
