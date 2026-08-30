import {
  compile,
  compileTagMapValues,
  detach,
  setDebugMode,
} from '@zenless-optimizer/pando/engine'
import type { WengineKey } from '../consts'
import {
  charTagMapNodeEntries,
  discTagMapNodeEntries,
  teamData,
  wengineTagMapNodeEntries,
  withMember,
} from '../formula'
import { Calculator } from '../formula/calculator'
import { data, keys, values } from '../formula/data'
import type { TagMapNodeEntries } from '../formula/data/util'
import {
  conditionalEntries,
  convert,
  enemy,
  enemyDebuff,
  own,
  ownTag,
  Read,
  type Tag,
} from '../formula/data/util'
import { allStats } from '../stats/allStats'
import { getCharStat } from '../stats/char'

// Must be called before Calculator creation
setDebugMode(true)
Object.assign(values, compileTagMapValues(keys, data))

describe('Zhao HP debug', () => {
  it('shows Zhao base stats and character data', () => {
    const charDatum = getCharStat('Zhao')
    console.log('Zhao stats:', JSON.stringify(charDatum.stats, null, 2))
    console.log(
      'Zhao promo stats:',
      JSON.stringify(charDatum.promotionStats, null, 2)
    )
    console.log(
      'Zhao core stats:',
      JSON.stringify(charDatum.coreStats, null, 2)
    )
    console.log('Zhao specialty:', charDatum.specialty)
    console.log('Zhao attribute:', charDatum.attribute)
    console.log('Zhao id:', charDatum.id)

    const wengineStat = allStats.wengine['HalfSugarBunny']
    console.log('HalfSugarBunny:', JSON.stringify(wengineStat, null, 2))
  })

  it('computes Zhao HP without discs/wengine', () => {
    const charKey = 'Zhao'

    const entries: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 0,
          basic: 0,
          dodge: 0,
          special: 0,
          chain: 0,
          assist: 0,
          mindscape: 0,
        })
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
    ]

    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entries)
    )
    const ownReader = convert(ownTag, { et: 'own', src: charKey })

    const baseHP = calc.compute(ownReader.base.hp).val
    const initialHP = calc.compute(ownReader.initial.hp).val
    console.log('Zhao base HP (char-only, no core):', baseHP)
    console.log('Zhao initial HP (char-only, no core):', initialHP)
  })

  it('computes Zhao HP with wengine (no discs)', () => {
    const charKey = 'Zhao'
    const wengineKey = 'HalfSugarBunny'
    const wengineStat = allStats.wengine[wengineKey]
    console.log('wengine second_statkey:', wengineStat.second_statkey)
    console.log('wengine second_statvalue:', wengineStat.second_statvalue)

    const entries: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 6,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          mindscape: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: wengineKey,
          level: 60,
          modification: 5,
          phase: 1,
        }),
        // Enable wengine conditionals
        // Always-on wengine passive buffs are active automatically via wengineTagMapNodeEntries.
        // The only toggleable conditional for HalfSugarBunny is activateExtendEtherVeil (-> cond_crit_dmg_).
        ...[
          conditionalEntries(
            wengineKey,
            charKey,
            null
          )('activateExtendEtherVeil', 1),
        ]
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
    ]

    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entries)
    )
    const ownReader = convert(ownTag, { et: 'own', src: charKey })
    const combatReader = convert(ownTag, {
      et: 'own',
      src: charKey,
      preset: 'preset0',
    })

    const initialHP = calc.compute(ownReader.initial.hp).val
    const baseHP = calc.compute(ownReader.base.hp).val
    const finalHP = calc.compute(combatReader.final.hp).val

    console.log('Zhao base HP:', baseHP)
    console.log('Zhao initial HP (character + wengine):', initialHP)
    console.log('Zhao final HP (with combat buffs):', finalHP)
  })

  it('reproduces real build with Bunny in Wonderland 2p, compares display vs solver for initial AND final HP', () => {
    const charKey = 'Zhao'
    const wengineKey = 'HalfSugarBunny'

    // User's exact build: Bunny in Wonderland 4pc + 2pc ER
    // Main stats: Slot1=HP, Slot2=ATK, Slot3=DEF, Slot4=HP%, Slot5=HP%, Slot6=ER
    // Substat HP%: 72%, HP flat: 1008
    const discStats = {
      hp: 4468 + 1008, // slot1 main (4468) + substat flat HP (1008)
      hp_: 0.24 + 0.24 + 0.72, // slot4 (24%) + slot5 (24%) + substats (72%)
      atk: 0, // ATK substats not needed for HP test
      atk_: 0.3,
      def: 0,
      def_: 0.384,
      crit_: 0.072,
      enerRegen_: 0.2,
    }

    const entries: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 6,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          mindscape: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: wengineKey,
          level: 60,
          modification: 5,
          phase: 1,
        }),
        // Bunny in Wonderland 4pc (count=4 auto-enables 2p + 4p effects)
        // The 4p effect requires Zhao (defense specialty) and stacks conditional
        ...discTagMapNodeEntries(discStats, { BunnyInWonderland: 4 }),
        ...[
          conditionalEntries(
            wengineKey,
            charKey,
            null
          )('activateExtendEtherVeil', 1),
        ]
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
      enemyDebuff.common.stun_.add(1.5),
    ]

    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entries)
    )

    // ====== Display path ======
    const ownReader = convert(ownTag, { et: 'own', src: charKey })
    const combatReader = convert(ownTag, {
      et: 'own',
      src: charKey,
      preset: 'preset0',
    })

    const displayBaseHP = calc.compute(ownReader.base.hp).val
    const displayInitialHP = calc.compute(ownReader.initial.hp).val
    const displayFinalHP = calc.compute(combatReader.final.hp).val
    console.log('')
    console.log('=== Display path ===')
    console.log(`base HP:     ${displayBaseHP.toFixed(1)}`)
    console.log(`initial HP:  ${displayInitialHP.toFixed(1)}`)
    console.log(`final HP:    ${displayFinalHP.toFixed(1)}`)

    // ====== Solver constraint path: final.hp (qt: 'final' is the default for StatFilterTag) ======
    const solverFinalTag: Tag = {
      qt: 'final',
      q: 'hp',
      et: 'own',
      sheet: 'agg',
      src: charKey,
      preset: 'preset0',
    }
    const solverFinalRead = new Read(solverFinalTag, undefined)
    const solverFinalHP = calc.compute(solverFinalRead).val
    console.log('')
    console.log('=== Solver constraint (final.hp, preset0) ===')
    console.log(`solver compute final HP: ${solverFinalHP.toFixed(1)}`)

    // ====== Also test initial.hp as solver read ======
    const solverInitTag: Tag = {
      qt: 'initial',
      q: 'hp',
      et: 'own',
      sheet: 'agg',
      src: charKey,
      preset: 'preset0',
    }
    const solverInitRead = new Read(solverInitTag, undefined)
    const solverInitHP = calc.compute(solverInitRead).val
    expect(displayInitialHP).toBeCloseTo(solverInitHP)
    console.log(`solver compute initial HP: ${solverInitHP.toFixed(1)}`)

    // ====== Detach final.hp (what the solver actually detaches) ======
    const allDiscSetKeys = new Set([
      'SwingJazz',
      'AstralVoice',
      'BranchBladeSong',
      'BunnyInWonderland',
      'ChaosJazz',
      'ChaoticMetal',
      'DawnsBloom',
      'FangedMetal',
      'FreedomBlues',
      'HormonePunk',
      'InfernoMetal',
      'KingOfTheSummit',
      'MoonlightLullaby',
      'PhaethonsMelody',
      'PolarMetal',
      'ProtoPunk',
      'PufferElectro',
      'ShadowHarmony',
      'ShiningAria',
      'ShockstarDisco',
      'SoulRock',
      'TheSkyAblaze',
      'ThunderMetal',
      'WhiteWaterBallad',
      'WoodpeckerElectro',
      'WutheringSalon',
      'YunkuiTales',
      'NotesFromTheChained',
    ])
    const allWengineKeys = new Set(['HalfSugarBunny', 'VortexRevolver'])

    const nodes = detach([solverFinalRead], calc, (tag: Tag) => {
      if (tag['src'] !== charKey) return undefined
      if (tag['et'] !== 'own') return undefined
      if (tag['sheet'] === 'dyn' && tag['qt'] === 'initial')
        return { q: tag['q']! }
      if (tag['q'] === 'count' && allDiscSetKeys.has(tag['sheet'] as any))
        return { q: tag['sheet']! }
      if (
        tag['qt'] === 'wengine' &&
        ['lvl', 'phase', 'modification'].includes(tag['q'] as string)
      )
        return { q: tag['q']! }
      if (tag['q'] === 'count' && allWengineKeys.has(tag['sheet'] as any))
        return { q: tag['sheet']! }
      return undefined
    })
    const detachedFinal = nodes[0]
    console.log('')
    console.log('=== Detached final.hp tree ===')
    console.log('root op:', detachedFinal.op)

    // Log the full formula tree
    function logNode(node: any, indent = '  ') {
      if (node.op === 'const') {
        console.log(`${indent}const ${node.ex}`)
      } else if (node.op === 'read') {
        console.log(`${indent}read(${JSON.stringify(node.tag)})`)
      } else if (node.op === 'sum') {
        console.log(`${indent}sum:`)
        for (const child of node.x ?? []) logNode(child, indent + '  ')
      } else if (node.op === 'prod') {
        console.log(`${indent}prod:`)
        for (const child of node.x ?? []) logNode(child, indent + '  ')
      } else {
        console.log(
          `${indent}${node.op}`,
          JSON.stringify(node.x ?? '').slice(0, 100)
        )
      }
    }
    logNode(detachedFinal)

    console.log('')
    console.log(`Display initial HP: ${displayInitialHP.toFixed(1)}`)
    console.log(`Display final HP:   ${displayFinalHP.toFixed(1)}`)
    console.log(`Solver final HP:    ${solverFinalHP.toFixed(1)}`)
    console.log(`final HP > 27000?   ${displayFinalHP > 27000 ? 'YES' : 'NO'}`)
    console.log(
      `initial HP > 27000? ${displayInitialHP > 27000 ? 'YES' : 'NO'}`
    )
  })

  it('tests HP with varying disc amounts + BunnyInWonderland 2p to find the 27k+ threshold', () => {
    const charKey = 'Zhao'
    const wengineKey = 'HalfSugarBunny'

    for (const flatHP of [3000, 4000, 5000, 6000, 8000, 10000]) {
      for (const hpPercent of [0.24, 0.48, 0.72, 1.0]) {
        const entries: TagMapNodeEntries = [
          ...teamData([charKey]),
          ...withMember(
            charKey,
            ...charTagMapNodeEntries({
              key: charKey,
              level: 60,
              promotion: 5,
              core: 6,
              basic: 11,
              dodge: 11,
              special: 11,
              chain: 11,
              assist: 11,
              mindscape: 0,
            }),
            ...wengineTagMapNodeEntries({
              key: wengineKey,
              level: 60,
              modification: 5,
              phase: 1,
            }),
            ...discTagMapNodeEntries(
              { hp: flatHP, hp_: hpPercent, atk: 316, def: 184 },
              { BunnyInWonderland: 2 }
            ),
            ...[
              conditionalEntries(
                wengineKey,
                charKey,
                null
              )('activateExtendEtherVeil', 1),
            ]
          ),
          own.common.critMode.add('avg'),
          enemy.common.def.add(635),
          enemyDebuff.common.stun_.add(1.5),
        ]

        const calc = new Calculator(
          keys,
          values,
          compileTagMapValues(keys, entries)
        )
        const ownReader = convert(ownTag, { et: 'own', src: charKey })
        const ini = calc.compute(ownReader.initial.hp).val
        const fin = calc.compute(
          convert(ownTag, { et: 'own', src: charKey, preset: 'preset0' }).final
            .hp
        ).val
        console.log(
          `flat=${flatHP.toFixed(0).padStart(5)} hp%=${(hpPercent * 100).toFixed(0).padStart(3)}%  => initial=${ini.toFixed(0).padStart(6)}  final=${fin.toFixed(0).padStart(6)}  ok27=${ini > 27000 ? '✓' : ''}`
        )
      }
    }
  })

  it('logs each HP component separately to trace the formula', () => {
    const charKey = 'Zhao'
    const wengineKey = 'HalfSugarBunny'
    const discStats = { hp: 4468, hp_: 0.24, atk: 316, def: 184 }

    const entries: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 6,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          mindscape: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: wengineKey,
          level: 60,
          modification: 5,
          phase: 1,
        }),
        ...discTagMapNodeEntries(discStats, { BunnyInWonderland: 2 }),
        ...[
          conditionalEntries(
            wengineKey,
            charKey,
            null
          )('activateExtendEtherVeil', 1),
        ]
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
      enemyDebuff.common.stun_.add(1.5),
    ]

    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entries)
    )
    const ownReader = convert(ownTag, { et: 'own', src: charKey })

    const base = calc.compute(ownReader.base.hp).val
    const initHP_ = calc.compute(ownReader.initial.hp_).val
    const initHP = calc.compute(ownReader.initial.hp).val
    console.log('')
    console.log('=== HP Component Breakdown ===')
    console.log(`base.hp:        ${base.toFixed(4)}`)
    console.log(`base.hp * 1:    ${(base * 1).toFixed(4)}`)
    console.log(`initial.hp_:    ${initHP_.toFixed(4)}  (total HP% as decimal)`)
    console.log(`initial.hp:     ${initHP.toFixed(4)}`)
    console.log(`base * (1+hp_): ${(base * (1 + initHP_)).toFixed(4)}`)
    console.log(`flat component: ${(initHP - base * (1 + initHP_)).toFixed(4)}`)

    // Total HP_ contributors
    console.log('')
    console.log('Reading HP_ from each sheet:')
    for (const sheet of ['agg', 'disc', 'dyn', 'char'] as const) {
      const reader = convert(ownTag, { et: 'own', src: charKey, sheet })
      const hp_ = calc.compute(reader.initial.hp_).val
      const flat = calc.compute(reader.initial.hp).val
      console.log(`  sheet:${sheet}  hp_=${hp_}  hp=${flat}`)
    }
  })

  it('detaches initial.hp stat filter and evaluates with recipe candidates', async () => {
    const charKey = 'Zhao'
    const wengineKey: WengineKey = 'HalfSugarBunny'

    // Setup calc with Zhao + HalfSugarBunny (no discs, we'll use recipe candidates)
    const entries: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 6,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          mindscape: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: wengineKey,
          level: 60,
          modification: 5,
          phase: 1,
        }),
        ...[
          conditionalEntries(
            wengineKey,
            charKey,
            null
          )('activateExtendEtherVeil', 1),
        ]
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
      enemyDebuff.common.stun_.add(1.5),
    ]
    const calc = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entries)
    )

    // Stat filter tag: initial.hp >= 27000 (WITHOUT preset to test if preset causes the issue)
    const statFilterTag: Tag = {
      qt: 'initial',
      q: 'hp',
      et: 'own',
      sheet: 'agg',
      src: charKey,
    }
    const statFilterTagWithPreset: Tag = {
      ...statFilterTag,
      preset: 'preset0' as any,
    }

    const allDiscSetKeys = new Set([
      'SwingJazz',
      'AstralVoice',
      'BranchBladeSong',
      'BunnyInWonderland',
      'ChaosJazz',
      'ChaoticMetal',
      'DawnsBloom',
      'FangedMetal',
      'FreedomBlues',
      'HormonePunk',
      'InfernoMetal',
      'KingOfTheSummit',
      'MoonlightLullaby',
      'PhaethonsMelody',
      'PolarMetal',
      'ProtoPunk',
      'PufferElectro',
      'ShadowHarmony',
      'ShiningAria',
      'ShockstarDisco',
      'SoulRock',
      'TheSkyAblaze',
      'ThunderMetal',
      'WhiteWaterBallad',
      'WoodpeckerElectro',
      'WutheringSalon',
      'YunkuiTales',
      'NotesFromTheChained',
    ])
    const allWengineKeys = new Set(['HalfSugarBunny', 'VortexRevolver'])

    function logTreeNode(node: any, indent = '') {
      if (node.op === 'const') {
        console.log(`${indent}const ${node.ex}`)
      } else if (node.op === 'read') {
        console.log(
          `${indent}read(q=${JSON.stringify(node.tag?.q ?? node.tag)})`
        )
      } else if (node.op === 'sum') {
        console.log(`${indent}sum:`)
        for (const child of node.x ?? []) logTreeNode(child, indent + '  ')
      } else if (node.op === 'prod') {
        console.log(`${indent}prod:`)
        for (const child of node.x ?? []) logTreeNode(child, indent + '  ')
      } else if (node.op === 'thres') {
        console.log(`${indent}thres:`)
        console.log(`${indent}  x[0] (ge):`)
        if (node.x?.[0]) logTreeNode(node.x[0], indent + '    ')
        console.log(`${indent}  x[1] (lt):`)
        if (node.x?.[1]) logTreeNode(node.x[1], indent + '    ')
        console.log(`${indent}  br[0] (v1):`)
        if (node.br?.[0]) logTreeNode(node.br[0], indent + '    ')
        console.log(`${indent}  br[1] (v2):`)
        if (node.br?.[1]) logTreeNode(node.br[1], indent + '    ')
      } else {
        console.log(
          `${indent}${node.op}`,
          JSON.stringify(node.ex ?? '').slice(0, 80)
        )
      }
    }

    function detachAndLog(label: string, tag: Tag) {
      const read = new Read(tag, undefined)
      const [node] = detach([read], calc, (tag: Tag) => {
        if (tag['src'] !== charKey) return undefined
        if (tag['et'] !== 'own') return undefined
        if (tag['sheet'] === 'dyn' && tag['qt'] === 'initial')
          return { q: tag['q']! }
        if (tag['q'] === 'count' && allDiscSetKeys.has(tag['sheet'] as any))
          return { q: tag['sheet']! }
        if (
          tag['qt'] === 'wengine' &&
          ['lvl', 'phase', 'modification'].includes(tag['q'] as string)
        )
          return { q: tag['q']! }
        if (tag['q'] === 'count' && allWengineKeys.has(tag['sheet'] as any))
          return { q: tag['sheet']! }
        return undefined
      })

      // Count read nodes in the formula tree
      let readCount = 0
      function countReads(n: any) {
        if (n.op === 'read') readCount++
        for (const arr of [n.x ?? [], n.br ?? []])
          for (const child of arr) countReads(child)
      }
      countReads(node)
      console.log(`\n=== ${label} ===`)
      console.log(`Total read nodes: ${readCount}`)
      logTreeNode(node)
    }

    // Test BOTH: without preset (like display) and with preset (like solver)
    detachAndLog('Without preset', statFilterTag)
    detachAndLog('With preset=preset0', statFilterTagWithPreset)

    // Compare what calc.gather() returns for initial.hp vs detached formula
    console.log('\n=== Calculator gather results (WITHOUT discs) ===')
    const initHPReader = convert(ownTag, { et: 'own', src: charKey })
    const hpValues = calc.gather(initHPReader.initial.hp.tag)
    console.log(
      `gather initial.hp: ${JSON.stringify(hpValues.map((v) => v.val))}`
    )

    const hpValues_ = calc.gather(initHPReader.initial.hp_.tag)
    console.log(
      `gather initial.hp_: ${JSON.stringify(hpValues_.map((v) => v.val))}`
    )
    console.log(
      `compute initial.hp = ${calc.compute(initHPReader.initial.hp).val}`
    )
    console.log(
      `compute initial.hp_ = ${calc.compute(initHPReader.initial.hp_).val}`
    )
    console.log(`compute base.hp = ${calc.compute(initHPReader.base.hp).val}`)

    // Now test WITH discs
    console.log('\n=== WITH discs ===')
    const discStats = { hp: 5476, hp_: 1.2 }
    const discEntries = discTagMapNodeEntries(discStats, {
      BunnyInWonderland: 4,
    })
    const entriesWithDiscs: TagMapNodeEntries = [
      ...teamData([charKey]),
      ...withMember(
        charKey,
        ...charTagMapNodeEntries({
          key: charKey,
          level: 60,
          promotion: 5,
          core: 6,
          basic: 11,
          dodge: 11,
          special: 11,
          chain: 11,
          assist: 11,
          mindscape: 0,
        }),
        ...wengineTagMapNodeEntries({
          key: wengineKey,
          level: 60,
          modification: 5,
          phase: 1,
        }),
        ...discEntries,
        ...[
          conditionalEntries(
            wengineKey,
            charKey,
            null
          )('activateExtendEtherVeil', 1),
        ]
      ),
      own.common.critMode.add('avg'),
      enemy.common.def.add(635),
      enemyDebuff.common.stun_.add(1.5),
    ]
    const calcWithDiscs = new Calculator(
      keys,
      values,
      compileTagMapValues(keys, entriesWithDiscs)
    )
    const reader = convert(ownTag, { et: 'own', src: charKey })

    const hpGather = calcWithDiscs.gather(reader.initial.hp.tag)
    console.log(
      `gather initial.hp: ${JSON.stringify(hpGather.map((v) => v.val))}`
    )
    const hpGather_ = calcWithDiscs.gather(reader.initial.hp_.tag)
    console.log(
      `gather initial.hp_: ${JSON.stringify(hpGather_.map((v) => v.val))}`
    )
    console.log(
      `compute initial.hp = ${calcWithDiscs.compute(reader.initial.hp).val}`
    )
    console.log(
      `compute initial.hp_ = ${calcWithDiscs.compute(reader.initial.hp_).val}`
    )

    // Compare with initial.atk having discs
    const atkGather = calcWithDiscs.gather(reader.initial.atk.tag)
    console.log(`\ninitial.atk (with discs):`)
    console.log(
      `gather initial.atk: ${JSON.stringify(atkGather.map((v) => v.val))}`
    )
    console.log(
      `compute initial.atk = ${calcWithDiscs.compute(reader.initial.atk).val}`
    )
    console.log(
      `compute initial.atk_ = ${calcWithDiscs.compute(reader.initial.atk_).val}`
    )

    // Now test DETACH with discs — this mimics what the solver does
    console.log('\n=== Detach initial.hp WITH discs ===')
    const detachedWithDiscs = detach(
      [
        new Read(
          { ...initHPReader.initial.hp.tag, preset: 'preset0' as any },
          undefined
        ),
      ],
      calcWithDiscs,
      (tag: any) => {
        // Same dynTag logic as the solver
        if (tag['et'] !== 'own') return undefined
        if (tag['sheet'] === 'dyn' && tag['qt'] === 'initial')
          return { q: tag['q']! }
        if (tag['q'] === 'count') return { q: tag['sheet']! }
        return undefined
      }
    )
    function serializeNode(n: any, depth = 0): string {
      if (!n || typeof n !== 'object') return `${n}`
      if (n.op === 'const') return `const ${n.ex}`
      if (n.op === 'read') return `read(q=${n.tag?.q ?? '?'})`
      if (n.op === 'sum' || n.op === 'prod') {
        const children = (n.x ?? []).map((c: any) =>
          serializeNode(c, depth + 1)
        )
        return `${n.op}(${children.join(', ')})`
      }
      if (n.op === 'thres') {
        const ge = n.x?.[0] ? serializeNode(n.x[0], depth + 1) : '?'
        const lt = n.x?.[1] ? serializeNode(n.x[1], depth + 1) : '?'
        return `thres(${ge} >= ${lt})`
      }
      return `${n.op}(${(n.x ?? []).map((c: any) => serializeNode(c, depth + 1)).join(', ')})`
    }
    console.log(`detached with discs: ${serializeNode(detachedWithDiscs[0])}`)

    // Now evaluate the detached tree with recipe-style candidates
    // Build candidate arrays like the solver does (flat array of objects, one per slot)
    const candidates = [
      {
        id: 'HalfSugarBunny' as any,
        lvl: 60,
        modification: 5,
        phase: 1,
        HalfSugarBunny: 1,
      },
      {
        id: 'recipe_test' as any,
        hp: 5476,
        hp_: 1.2,
        atk: 316,
        atk_: 0.3,
        def: 184,
        def_: 0.384,
        crit_: 0.072,
        enerRegen_: 0.2,
        BunnyInWonderland: 4,
      },
      { id: 'empty_2' as any, __empty: 0 },
      { id: 'empty_3' as any, __empty: 0 },
      { id: 'empty_4' as any, __empty: 0 },
      { id: 'empty_5' as any, __empty: 0 },
      { id: 'empty_6' as any, __empty: 0 },
    ]
    const compiledFn = compile(detachedWithDiscs, 'q', candidates.length)
    const result = compiledFn(candidates as any)
    // Also check individual read values manually
    function manualRead(tag: string, cnds: any[]): number {
      let sum = 0
      for (const c of cnds) sum += (c as any)[tag] ?? 0
      return sum
    }
    console.log(`\nManual read(q=hp): ${manualRead('hp', candidates)}`)
    console.log(`Manual read(q=hp_): ${manualRead('hp_', candidates)}`)
    console.log(
      `Manual read(q=BunnyInWonderland): ${manualRead('BunnyInWonderland', candidates)}`
    )
    console.log(
      `Manual read(q=modification): ${manualRead('modification', candidates)}`
    )
    console.log(`\n=== Evaluated detached tree with recipe candidates ===`)
    console.log(`initial.hp from compiled tree: ${result[0]?.toFixed(1)}`)
    console.log(`expected: 30822.4`)
    console.log(`match: ${Math.abs(result[0] - 30822.4) < 1 ? 'YES' : 'NO'}`)
    console.log(`constraint >= 27000: ${result[0] >= 27000 ? 'PASS' : 'FAIL'}`)
    // Debug: check the compiled function body
    const fnStr = compiledFn.toString().slice(0, 800)
    console.log(`\nCompiled function (truncated): ${fnStr}`)
    console.log(
      `\nCandidate slot 0 keys: ${Object.keys(candidates[0]).join(', ')}`
    )
    console.log(
      `Candidate slot 1 keys: ${Object.keys(candidates[1]).join(', ')}`
    )
    console.log(`Candidate slot 0 hp: ${(candidates[0] as any)['hp']}`)
    console.log(`Candidate slot 1 hp: ${(candidates[1] as any)['hp']}`)
    console.log(`Candidate slot 1 hp_: ${(candidates[1] as any)['hp_']}`)
  })
})
