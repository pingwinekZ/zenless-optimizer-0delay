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
const shiyuDir = join(root, 'app/src/dm/NanokaData/shiyu')
const outDir = join(root, 'app/src/page-optimize')
const outFile = join(outDir, 'shiyuSeasons_gen.json')

if (!existsSync(shiyuDir)) {
  console.error(`Shiyu data directory not found: ${shiyuDir}`)
  process.exit(1)
}

function extractElement(element) {
  if (!element) return {}
  const resists = {}
  const weak = {}
  for (const [elem, val] of Object.entries(element)) {
    const key = elem.toLowerCase()
    if (val === -1) resists[key] = 40
    else if (val === 1) weak[key] = 20
  }
  return {
    enemyResists: Object.keys(resists).length ? resists : undefined,
    enemyWeak: Object.keys(weak).length ? weak : undefined,
  }
}

function extractRooms(zone, allZones) {
  if (!zone) return []
  if (zone.GoalType === 3 && zone.Child?.length) {
    return zone.Child.flatMap((childId) =>
      extractRooms(allZones[childId], allZones)
    )
  }
  const { LayerRoom, LayerBuff, MonsterLevel, Name } = zone
  if (!LayerRoom) return []

  return Object.entries(LayerRoom).flatMap(([roomId, room]) => {
    const monsterList = room.MonsterList ? Object.values(room.MonsterList) : []
    if (!monsterList.length) return []

    const bigMonster = monsterList.reduce((a, b) =>
      (a.Stats?.Hp ?? 0) > (b.Stats?.Hp ?? 0) ? a : b
    )

    const imagePath = room.MonsterIcon || bigMonster.Image || ''
    const imageFile = imagePath.split('/').pop() ?? ''
    const monsterImage = imageFile
      .replace(/\.png$/, '')
      .replace(/^IconMonster_/, '')
      .replace(/^Monster_/, '')

    const buffs = LayerBuff ? Object.entries(LayerBuff) : []
    const buffEntry = buffs.find(([, b]) => b.Title && b.Title.trim()) ?? null

    return {
      id: roomId,
      name: Name || '',
      monsterLevel: MonsterLevel ?? 0,
      ...extractElement(bigMonster.Element),
      bigMonster: {
        id: String(bigMonster.Id ?? ''),
        name: bigMonster.Name ?? '',
        image: monsterImage,
        stats: {
          Hp: bigMonster.Stats?.Hp ?? 0,
          Attack: bigMonster.Stats?.Attack ?? 0,
          Defence: bigMonster.Stats?.Defence ?? 0,
          Stun: bigMonster.Stats?.Stun ?? 0,
        },
      },
      buff: buffEntry
        ? {
            id: buffEntry[0],
            title: buffEntry[1].Title,
            desc: buffEntry[1].Desc,
          }
        : null,
    }
  })
}

const files = readdirSync(shiyuDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
const seasons = files.map((f) => {
  const raw = JSON.parse(readFileSync(join(shiyuDir, f), 'utf-8'))
  const rooms = Object.values(raw.Zone ?? {}).flatMap((zone) =>
    zone.GoalType === 3 ? extractRooms(zone, raw.Zone) : []
  )
  return {
    id: raw.Id,
    name: raw.Name,
    beginTime: raw.BeginTime,
    endTime: raw.EndTime,
    rooms,
  }
})

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, JSON.stringify(seasons, null, 2))
console.log(`Generated ${outFile} with ${seasons.length} seasons`)
