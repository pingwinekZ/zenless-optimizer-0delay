import { readHakushinJSON } from '../util'

export type NounEntry = {
  Name: string
  Desc: string
  Skill: string
}

export const nounData: Record<string, NounEntry> = (() => {
  const raw = readHakushinJSON('noun.json')
  return JSON.parse(raw) as Record<string, NounEntry>
})()
