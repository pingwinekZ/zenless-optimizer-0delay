import { execSync } from 'child_process'

export async function fetchJsonFromUrl(url: string) {
  const raw = execSync(`curl -s ${url}`).toString()
  return JSON.parse(raw)
}
