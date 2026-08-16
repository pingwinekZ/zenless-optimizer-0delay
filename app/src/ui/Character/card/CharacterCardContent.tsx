import { Box, Flex, Text, Title } from '@mantine/core'
import { ImgIcon } from '@zenless-optimizer/common/ui'
import { useTranslation } from 'react-i18next'
import {
  commonDefIcon,
  rarityDefIcon,
  specialityDefIcon,
} from '../../../assets'
import { allSkillKeys, type CharacterKey } from '../../../consts'
import { useCharacter } from '../../../db-ui'
import { getCharStat } from '../../../stats'
import { ElementIcon } from '../../../svgicons'
import { CharacterName } from '../CharacterTrans'

export function CharacterCardContent({
  characterKey,
}: {
  characterKey: CharacterKey
}) {
  const { t } = useTranslation('page_characters')
  const character = useCharacter(characterKey)!
  const { rarity, specialty, attribute } = getCharStat(characterKey)
  const { level, core } = character
  return (
    <>
      <Flex gap={1.5} align="center">
        <ImgIcon size={2} src={rarityDefIcon(rarity)} />
        <Title order={4}>
          <CharacterName characterKey={characterKey} />
        </Title>
        <ElementIcon ele={attribute} />
        <ImgIcon size={2} src={specialityDefIcon(specialty)} />
      </Flex>

      <Flex gap={3} align="center">
        <Box>
          <Text
            component="span"
            style={{
              whiteSpace: 'nowrap',
              fontStyle: 'italic',
              fontWeight: 'bold',
              fontSize: '1.625rem',
              textShadow: 'none',
            }}
          >
            <strong>{t('characterCard.charLevel', { level: level })}</strong>
          </Text>
        </Box>
        <Flex gap={1.5} ml="14px" align="center">
          {allSkillKeys.map((item, index) => (
            <Box key={index} style={{ position: 'relative' }}>
              <ImgIcon size={2} src={commonDefIcon(item)} />
              <Flex
                align="center"
                justify="center"
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '-4px',
                  width: '1.7em',
                  height: '1.7em',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  background: '#1C1C1C',
                }}
              >
                {character[item]}
              </Flex>
            </Box>
          ))}
          <Box style={{ position: 'relative' }}>
            <ImgIcon size={2} src={commonDefIcon('core')} />
            <Flex
              align="center"
              justify="center"
              style={{
                position: 'absolute',
                bottom: '-10px',
                left: '-4px',
                width: '1.7em',
                height: '1.7em',
                borderRadius: '1rem',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                background: '#1C1C1C',
              }}
            >
              {core}
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </>
  )
}
