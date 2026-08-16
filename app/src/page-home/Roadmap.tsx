import { CardSection, List, Title } from '@mantine/core'
import { ZCard } from '../ui'

const items = [
  'Refactor 1.0-1.6 characters',
  'Maybe multiopt if its not pointless',
  'Recommended Presets for all characters',
  'Clean up any slop left',
]

export function Roadmap() {
  return (
    <ZCard>
      <CardSection>
        <Title order={5}>
          <span role="img" aria-label="rocket">
            🚀
          </span>{' '}
          Roadmap
        </Title>
        <List>
          {items.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
      </CardSection>
    </ZCard>
  )
}
