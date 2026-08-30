// Validates the live-import pipeline end to end without a browser:
// feeds a capturer-shaped ZOD snapshot (no ids, source "ZZZ Packet Capture")
// through the real site import path (sandbox clone -> importZOOD ->
// swapStorage), and checks replace semantics: new/unchanged/removed counts,
// db totals, and that null categories leave existing data untouched.
//   bun run tools/live_import_test.ts
import { SandboxStorage } from '@zenless-optimizer/common/database'
import {
  allDiscMainStatKeys,
  allDiscSetKeys,
  allDiscSlotKeys,
  allDiscSubStatKeys,
} from '../app/src/consts'
import { ZzzDatabase } from '../app/src/db'

const setKey = allDiscSetKeys[0]
const slotKey = allDiscSlotKeys[0]
const mainStatKey = 'def_' // main-stat only key (substats must differ from main stat)
const subKey = 'atk'

const makeDisc = (level: number, location: string) => ({
  setKey,
  slotKey,
  level,
  rarity: 'S',
  mainStatKey,
  location,
  lock: false,
  trash: false,
  substats: [{ key: subKey, upgrades: 2 }],
})

const liveZod = (discs: unknown[]) => ({
  format: 'ZOD',
  version: 1,
  source: 'ZZZ Packet Capture',
  characters: null,
  discs,
  wengines: null,
})

const index = 0
const db = new ZzzDatabase(
  (index + 1) as 1 | 2 | 3 | 4,
  new SandboxStorage(undefined, 'zzz')
)

// Seed the DB the way the real app would (manual upload of disc1 + disc2).
const seedResult = db.importZOOD(
  liveZod([makeDisc(5, 'A1'), makeDisc(10, 'A2')]) as any,
  false,
  false
)
const seedIds = db.discs.values.map((d) => d.id)
console.log('seed:')
console.log(
  `  discs: ${seedResult.discs.import} imported (${seedIds.length} in db)`
)
console.log(`  characters: ${seedResult.characters.import} imported`)

// Simulate a live snapshot: disc2 upgraded (level 11), disc3 new, disc1 gone.
const snapshot = liveZod([makeDisc(11, 'A2'), makeDisc(3, 'A3')])

const copyStorage = new SandboxStorage(undefined, 'zzz')
copyStorage.copyFrom(db.storage)
const imported = new ZzzDatabase((index + 1) as 1 | 2 | 3 | 4, copyStorage)
const result = imported.importZOOD(snapshot as any, false, false)

const r = result.discs
console.log('live import:')
console.log(
  `  total: ${r.import} | new: ${r.new.length} | unchanged: ${r.unchanged.length} | upgraded: ${r.upgraded.length} | removed: ${r.remove.length} | beforeMerge: ${r.beforeMerge}`
)

imported.swapStorage(db)

const finalIds = imported.discs.values.map((d) => d.id)
console.log(`  db total after swap: ${imported.discs.values.length}`)

const makeChar = (wengineKey: string, wenginePhase: number) => ({
  id: 'ZhuYuan',
  key: 'ZhuYuan',
  level: 60,
  promotion: 5,
  mindscape: 2,
  core: 6,
  dodge: 11,
  basic: 11,
  chain: 11,
  special: 11,
  assist: 11,
  wengineKey,
  wenginePhase,
})

// Simulate the reported bug: replace-semantics live imports must carry each
// character's equipped w-engine (wengineKey/wenginePhase), or the character's
// w-engine gets wiped by every in-game disc change.
const zodWithChars = (chars: unknown[]) => ({
  format: 'ZOD',
  version: 1,
  source: 'ZZZ Packet Capture',
  characters: chars,
  discs: [makeDisc(5, 'ZhuYuan')],
  wengines: null,
})

const wdb = new ZzzDatabase(
  (index + 1) as 1 | 2 | 3 | 4,
  new SandboxStorage(undefined, 'zzz')
)
wdb.importZOOD(
  zodWithChars([makeChar('GildedBlossom', 3)]) as any,
  false,
  false
)

// Disc change in-game -> new live snapshot, same character + w-engine.
const wcopy = new SandboxStorage(undefined, 'zzz')
wcopy.copyFrom(wdb.storage)
const wimported = new ZzzDatabase((index + 1) as 1 | 2 | 3 | 4, wcopy)
wimported.importZOOD(
  zodWithChars([makeChar('GildedBlossom', 3)]) as any,
  false,
  false
)

const wchar = wimported.chars.get('ZhuYuan')
console.log('wengine live import:')
console.log(
  `  wengineKey: ${wchar?.wengineKey} | wenginePhase: ${wchar?.wenginePhase}`
)

const ok =
  r.import === 2 &&
  r.new.length === 1 &&
  r.unchanged.length === 0 &&
  r.upgraded.length === 1 &&
  r.remove.length === 1 &&
  r.beforeMerge === 2 &&
  imported.discs.values.length === 2 &&
  finalIds.length === 2 &&
  wchar?.wengineKey === 'GildedBlossom' &&
  wchar?.wenginePhase === 3

console.log(ok ? 'TEST PASSED' : 'TEST FAILED')
process.exit(ok ? 0 : 1)
