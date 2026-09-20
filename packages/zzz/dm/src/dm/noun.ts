import { readNanokaJSON } from '../util'

export type NounEntry = {
  Name: string
  Desc: string
  Skill: string
}

export const nounData: Record<string, NounEntry> = (() => {
  const raw = readNanokaJSON('noun.json')
  return JSON.parse(raw) as Record<string, NounEntry>
})()
