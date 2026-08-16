import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..', '..', '..')
const bossDir = join(root, 'app/src/dm/NanokaData/boss')
const outDir = join(root, 'app/src/page-optimize')
const outFile = join(outDir, 'daSeasons_gen.json')

if (!existsSync(bossDir)) {
  console.error(`Boss data directory not found: ${bossDir}`)
  process.exit(1)
}

const files = readdirSync(bossDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

const zoneTypes = new Map([[1002, 'hard']])

function mapZone(zone, extra = {}) {
  const room = Object.values(zone.LayerRoom)[0]
  const monsterList = room ? Object.values(room.MonsterList) : []
  const monster = monsterList[0] ?? {}
  const element = monster.Element ?? {}
  const enemyResists = {}
  const enemyWeak = {}
  for (const [elem, val] of Object.entries(element)) {
    const key = elem.toLowerCase()
    if (val === -1) enemyResists[key] = 40
    else if (val === 1) enemyWeak[key] = 20
  }

  const iconPath = room?.MonsterIcon ?? ''
  const iconFile = iconPath.split('/').pop() ?? ''
  const monsterImage = iconFile
    .replace(/^IconMonster_/, '')
    .replace(/\.png$/, '')

  return {
    name: zone.Name,
    monsterLevel: zone.MonsterLevel,
    monsterName: monster.Name,
    monsterDef: monster.Stats?.Defence,
    monsterImage,
    enemyResists: Object.keys(enemyResists).length ? enemyResists : undefined,
    enemyWeak: Object.keys(enemyWeak).length ? enemyWeak : undefined,
    buffs: Object.entries(zone.SelectableBuff ?? {}).map(([id, b]) => ({
      id,
      title: b.Title,
      desc: b.Desc,
    })),
    ...extra,
  }
}

const seasons = files.flatMap((f) => {
  const raw = JSON.parse(readFileSync(join(bossDir, f), 'utf-8'))

  let zones = []
  if (raw.Modes) {
    zones = raw.Modes.flatMap((mode) =>
      Object.entries(mode.Zone ?? {}).map(([zoneId, zone]) =>
        mapZone(zone, {
          hard: zoneTypes.get(mode.ZoneType) === 'hard',
        })
      )
    ).sort((a, b) => (b.hard ? 1 : 0) - (a.hard ? 1 : 0))
  } else if (raw.Zone) {
    zones = Object.entries(raw.Zone).map(([zoneId, zone]) => mapZone(zone))
  }

  if (!zones.length) return []

  return [
    {
      id: raw.Id,
      beginTime: raw.BeginTime,
      endTime: raw.EndTime,
      zones,
    },
  ]
})

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, JSON.stringify(seasons, null, 2))
console.log(`Generated ${outFile} with ${seasons.length} seasons`)
