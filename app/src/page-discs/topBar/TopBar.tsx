import { Button, Divider } from '@mantine/core'
import { IconEraser, IconPlus, IconSettings } from '@tabler/icons-react'
import { useBoolState } from '@zenless-optimizer/common/react-util'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import { characterAsset } from '../../assets'
import { CharacterName, CharacterSingleSelectionModal } from '../../ui'
import { useDiscTabStore } from '../discGrid/useDiscTabStore'
import { FilterPillBar } from './FilterPillBar'
import { StatWeightEditorModal } from './StatWeightEditorModal'
import classes from './topBar.module.css'

export function TopBar() {
  const focusCharacter = useDiscTabStore((s) => s.focusCharacter)
  const setFocusCharacter = useDiscTabStore((s) => s.setFocusCharacter)
  const resetFilters = useDiscTabStore((s) => s.resetFilters)
  const [charSelectOpen, onOpenCharSelect, onCloseCharSelect] = useBoolState()
  const [editorOpen, onOpenEditor, onCloseEditor] = useBoolState()
  const { t } = useTranslation('discTab')

  return (
    <div className={classes.topBar}>
      <CharacterSingleSelectionModal
        show={charSelectOpen}
        onHide={onCloseCharSelect}
        onSelect={(ck) => {
          setFocusCharacter(ck)
          onCloseCharSelect()
        }}
      />
      <StatWeightEditorModal opened={editorOpen} onClose={onCloseEditor} />
      <div className={classes.avatarBox}>
        {focusCharacter ? (
          <ImgIcon
            size={4}
            src={characterAsset(focusCharacter, 'circle')}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px solid var(--border-default)',
              background: 'var(--layer-1)',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
            onClick={onOpenCharSelect}
          />
        ) : (
          <div className={classes.avatarEmpty} onClick={onOpenCharSelect}>
            <IconPlus size={24} />
          </div>
        )}
      </div>

      <div className={classes.selectColumn}>
        <Button
          variant="default"
          fullWidth
          onClick={onOpenCharSelect}
          leftSection={
            focusCharacter ? (
              <ImgIcon
                size={2}
                src={characterAsset(focusCharacter, 'circle')}
              />
            ) : undefined
          }
        >
          {focusCharacter ? (
            <CharacterName characterKey={focusCharacter} />
          ) : (
            t('RelicFilterBar.SelectCharacter')
          )}
        </Button>
        <Button
          variant="default"
          size="xs"
          fullWidth
          onClick={onOpenEditor}
          leftSection={<IconSettings size={14} />}
        >
          {t('RelicFilterBar.ScoringButton')}
        </Button>
      </div>

      <Divider orientation="vertical" />

      <FilterPillBar />

      <div className={classes.clearColumn}>
        <Button
          variant="subtle"
          size="xs"
          onClick={resetFilters}
          color="dimmed"
          leftSection={<IconEraser size={12} />}
          h="100%"
          style={{ border: 'var(--border-subtle)' }}
        >
          {t('RelicFilterBar.Clear')}
        </Button>
      </div>
    </div>
  )
}
