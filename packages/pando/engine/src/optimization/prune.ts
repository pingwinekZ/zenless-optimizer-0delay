import type { AnyNode, NumNode, OP as TaggedOP } from '../node'
import {
  calculation,
  constant,
  mapBottomUp,
  max,
  min,
  read,
  sum,
  traverse,
} from '../node'
import type { Monotonicity, Range } from '../util'
import { ArrayMap, assertUnreachable, customOps, isDebug } from '../util'
import { simplify } from './simplify'

const { arithmetic, branching } = calculation

type OP = Exclude<TaggedOP, 'tag' | 'dtag' | 'vtag'>

// The downside of this is that object literal will not work if `ID` is not `number`, you need to cast it
export type Candidate<ID = number> = { id: ID } & Record<string, number>

type CndRanges = Record<string, Range>[]
type NodeRanges = Map<AnyNode<OP>, Range>
type Monotonicities = Map<string, Monotonicity>

type PruneResult<I extends OP, ID> = {
  nodes: NumNode<I>[]
  minimum: number[]
  candidates: Candidate<ID>[][]

  cndRanges: CndRanges
  monotonicities: Monotonicities
}

/**
 * Reduce the complexity of the optimization problem
 *
 *     maximize constraints[0]
 *     s.t. constraints[0..minimum.length] >= minimum
 *
 * returning a new optimization with the same `topN` builds
 * @param nodes
 *    A set of nodes used for minimum constraints, objective function, and other calculations.
 *    The nodes must be in the order [minConstraints, other calc], and `minConstraint[0]` is
 *    the obj function.
 * @param candidates Candidates used to construct the builds. Keys in `candidates` except 'id' may be removed in the results.
 * @param dynTagCat Tag category used by `compile` in the actual computation
 * @param minimum Minimum values for min constraint nodes.
 * @param topN The number of top builds to keep.
 * @returns
 *    A new values for `nodes`, `candidates`, and `minimum`. The returned values are incompatible
 *    with the passed-in arguments (DO NOT mix them). Candidates may also change, so all related
 *    computation needs to pass in to `nodes` as well, else they'll become unusable. `minConstraints`
 *    in `nodes` may be removed, excepts for `minConstraints[0]` if the constraint is always satisfied.
 */
export function prune<I extends OP, ID>(
  nodes: NumNode<I>[],
  candidates: Candidate<ID>[][],
  dynTagCat: string,
  minimum: number[],
  topN: number
): PruneResult<I, ID> {
  const state = new State(nodes, minimum, candidates, dynTagCat)

  // Diagnostic dump only. This walks every candidate of every slot, so it must
  // never run in production: on a theoretical-max recipe pool it is a full
  // extra pass over millions of candidates whose only consumer is the console.
  if (isDebug('prune')) {
    const slot1range = computeCndRanges(candidates[1])
    console.debug(
      '[PruneEntry] cat=' + dynTagCat + ', min(' + minimum.length + '):',
      minimum
        .slice(0, 10)
        .map((m) => (m === -Infinity ? '-Inf' : m))
        .join(',')
    )
    console.debug(
      '[PruneEntry] slot1 range keys:',
      Object.keys(slot1range)
        .filter((k) => k !== 'id' && k !== 'hp' && k !== 'atk' && k !== 'def')
        .join(',')
    )
    const tempRanges = computeNodeRanges(
      nodes.slice(0, minimum.length),
      dynTagCat,
      candidates.map(computeCndRanges)
    )
    console.debug('[PruneEntry] constraint node ranges:')
    nodes.slice(0, minimum.length).forEach((n, i) => {
      const r = tempRanges.get(n)
      const tagInfo = n.op === 'read' ? JSON.stringify(n.tag) : ''
      console.debug(
        '[PruneEntry]   nodes[' +
          i +
          '] op=' +
          n.op +
          ' tag=' +
          tagInfo +
          ' range=[' +
          (r ? r.min + '..' + r.max : 'no-range') +
          '] min=' +
          minimum[i]
      )
    })
  }

  while (state.progress) {
    state.progress = false
    pruneBranches(state)
    pruneRange(state, 1)
    reaffine(state)
    pruneBottom(state, topN)
  }
  state.nodes = simplify(state.nodes)
  return state
}

export class State<I extends OP, ID> implements PruneResult<I, ID> {
  #nodes: NumNode<I>[]
  minimum: number[]
  #candidates: Candidate<ID>[][]
  cat: string

  progress = true
  #cndRanges: CndRanges | undefined
  #nodeRanges: NodeRanges | undefined
  #monotonicities: Monotonicities | undefined

  constructor(
    nodes: NumNode<I>[],
    minimum: number[],
    candidates: Candidate<ID>[][],
    cat: string
  ) {
    this.#nodes = nodes
    this.minimum = minimum
    this.#candidates = candidates
    this.cat = cat
  }

  get nodes(): NumNode<I>[] {
    return this.#nodes
  }
  set nodes(nodes: NumNode<I>[]) {
    if (this.#nodes === nodes) return
    this.progress = true
    this.#nodes = nodes
    this.#nodeRanges = this.#monotonicities = undefined
  }

  get candidates(): Candidate<ID>[][] {
    return this.#candidates
  }
  set candidates(candidates: Candidate<ID>[][]) {
    if (this.candidates === candidates) return
    this.progress = true
    this.#candidates = candidates
    this.#cndRanges = this.#nodeRanges = this.#monotonicities = undefined
  }

  get cndRanges(): CndRanges {
    return (this.#cndRanges ??= this.candidates.map(computeCndRanges))
  }
  set cndRanges(cndRanges: CndRanges) {
    this.#cndRanges = cndRanges
  }
  get nodeRanges(): NodeRanges {
    return (this.#nodeRanges ??= computeNodeRanges(
      this.nodes,
      this.cat,
      this.cndRanges
    ))
  }
  get monotonicities(): Monotonicities {
    return (this.#monotonicities ??= getMonotonicities(
      this.nodes.slice(0, this.minimum.length),
      this.cat,
      this.nodeRanges
    ))
  }
}

/** Remove branches that are never chosen */
export function pruneBranches<ID>(state: State<OP, ID>) {
  const { nodes, nodeRanges } = state
  const result = mapBottomUp(nodes, (n, o) => {
    const r = nodeRanges.get(o)!
    if (r.min === r.max) return o.op === 'const' ? n : constant(r.min)
    switch (o.op) {
      case 'thres': {
        const [value, threshold] = o.br.map((n) => nodeRanges.get(n)!)
        if (value.min >= threshold.max) return n.x[0]
        if (value.max < threshold.min) return n.x[1]
        break
      }
      case 'min': {
        const x = n.x.filter((_, i) => nodeRanges.get(o.x[i])!.min <= r.max)
        if (x.length === 1) return x[0]
        if (x.length !== n.x.length) return min(...(x as any)) as NumNode<OP>
        break
      }
      case 'max': {
        const x = n.x.filter((_, i) => nodeRanges.get(o.x[i])!.max >= r.min)
        if (x.length === 1) return x[0]
        if (x.length !== n.x.length) return max(...(x as any)) as NumNode<OP>
        break
      }
      case 'match':
      case 'lookup':
        if (n.br.every((n) => n.op === 'const')) {
          const br = n.br.map((n) => n.ex)
          return n.x[branching[o.op](br, o.ex)]
        }
        break
      case 'subscript':
        if (n.br[0].op === 'const') return constant(n.ex[n.br[0].ex])
        break
    }
    return n
  })
  state.nodes = result
}

/**
 * - Remove candidates that do not meet the `minimum` requirements in any builds
 * - Remove top-level nodes whose `minimum` requirements are met by every build
 */
export function pruneRange<ID>(state: State<OP, ID>, numReq: number) {
  const { nodeRanges, minimum: oldMin, cat } = state
  const candidates = [...state.candidates]
  const cndRanges = [...state.cndRanges]
  const debug = isDebug('prune')

  const nodes: NumNode<OP>[] = []
  const minimum: number[] = []
  let hasNonTrivialConstraint = false
  state.nodes.forEach((n, i) => {
    if (i < oldMin.length) {
      const r = nodeRanges.get(n)
      const nodeMin = r ? r.min : NaN
      if (debug)
        console.debug(
          '[PruneRange] i=' +
            i +
            ', op=' +
            n.op +
            ', min=' +
            oldMin[i] +
            ', nodeRange=[' +
            (r ? r.min + '..' + r.max : 'no_range') +
            ']'
        )
      if (oldMin[i] > nodeMin) {
        hasNonTrivialConstraint = true
      } else if (i >= numReq) {
        return
      }
      minimum.push(oldMin[i])
    }
    nodes.push(n)
  })
  if (minimum.length != oldMin.length) {
    state.nodes = nodes
    state.minimum = minimum
  }

  if (!hasNonTrivialConstraint) return

  let progress = false
  candidates.forEach((cnds, i) => {
    const oldCndRange = cndRanges[i]
    const before = cnds.length
    // Fast path: evaluate the constraint nodes into reused scratch buffers.
    // The general path below allocates a per-candidate range record plus a
    // full `Map` of node ranges for every single candidate, which dominates
    // the whole prune on large pools; this does the same arithmetic with zero
    // per-candidate allocation. `null` means the node graph uses an op the
    // fast path does not model, and the general path takes over.
    const check = fastPathEnabled
      ? compileCandidateCheck<ID>(nodes, minimum, cat, cndRanges, i)
      : null
    const newCnds = check
      ? cnds.filter((c) => check(c))
      : cnds.filter((c) => {
          cndRanges[i] = computeCndRanges([c])
          const ranges = computeNodeRanges(nodes, cat, cndRanges)
          const ok = minimum.every((m, j) => {
            const max = ranges.get(nodes[j])!.max
            return isNaN(max) || max >= m
          })
          if (!ok && debug) {
            const constraintVals = minimum.map((m, j) => {
              const r = ranges.get(nodes[j])
              return `[${r ? r.min.toFixed(1) : '?'}..${r ? r.max.toFixed(1) : '?'}] >= ${m.toFixed(1)}`
            })
            console.debug(
              `[PruneRange] REJECT slot=${i} c.id=${c.id} constraints=${JSON.stringify(constraintVals)}`
            )
          }
          return ok
        })
    if (newCnds.length != cnds.length) {
      if (debug)
        console.debug(
          `[PruneRange] slot=${i} before=${before} after=${newCnds.length} removed=${before - newCnds.length}`
        )
      candidates[i] = newCnds
      cndRanges[i] = computeCndRanges(newCnds)
      progress = true
    } else cndRanges[i] = oldCndRange
  })
  if (progress) {
    state.candidates = candidates
    state.cndRanges = cndRanges
  }
}

/** Remove candidates that are never in the `topN` builds */
export function pruneBottom<ID>(state: State<OP, ID>, topN: number) {
  const monotonicities = [...state.monotonicities]

  // Skip the whole pass when there is no candidate to inspect (the sample used
  // to be materialized just to detect this).
  if (state.candidates[0]?.[0] === undefined) return

  // The categorisation is identical for every candidate — it is derived from
  // the same monotonicity list in the same order — so it is computed once here
  // instead of rebuilding an `inc` record (and an `incomp` array, and an
  // `ArrayMap` key) for each of possibly millions of candidates. Those records
  // were the largest source of allocation in prune, and the per-comparison
  // string lookups they required dominated the dominance scan below.
  const cats: string[] = []
  const signs: number[] = []
  const incompCats: string[] = []
  for (const [cat, m] of monotonicities) {
    if (m.inc) {
      cats.push(cat) // increasing
      signs.push(1)
    } else if (m.dec) {
      cats.push(cat) // decreasing
      signs.push(-1)
    } else incompCats.push(cat) // incomparable
  }
  const k = cats.length
  const hasIncomp = incompCats.length > 0

  const slots = state.candidates
  const result: Candidate<ID>[][] = new Array(slots.length)
  let changed = false

  for (let s = 0; s < slots.length; s++) {
    const comp = slots[s] as Candidate<ID>[]
    const n = comp.length
    if (n === 0) {
      result[s] = comp
      continue
    }

    // Flat, sign-applied copy of every monotonic coord, so the sort and the
    // dominance scan read contiguous doubles instead of resolving string keys
    // on every comparison. Released with the iteration.
    const flat = new Float64Array(n * k)
    for (let i = 0; i < n; i++) {
      const c = comp[i] as unknown as Record<string, number>
      const base = i * k
      for (let q = 0; q < k; q++) flat[base + q] = (c[cats[q]] ?? 0) * signs[q]
    }

    const rows = new Array<number>(n)
    for (let i = 0; i < n; i++) rows[i] = i

    // Same grouping (and therefore the same output order) as before, but the
    // groups hold row indices rather than per-candidate records.
    const groups = new ArrayMap<number, number[]>()
    if (hasIncomp) {
      for (let i = 0; i < n; i++) {
        const c = comp[i] as unknown as Record<string, number>
        const key: number[] = new Array(incompCats.length)
        for (let q = 0; q < incompCats.length; q++)
          key[q] = c[incompCats[q]] ?? 0
        const ref = groups.ref(key)
        if (ref.value) ref.value.push(i)
        else ref.value = [i]
      }
    } else groups.ref([]).value = rows

    const kept: number[] = []
    for (const group of groups.values()) {
      // Descending by the most significant differing coord, scanning the
      // coords in reverse order — identical to the previous `revCats.find`.
      group.sort((ia, ib) => {
        const ba = ia * k
        const bb = ib * k
        for (let q = k - 1; q >= 0; q--) {
          const a = flat[ba + q]
          const b = flat[bb + q]
          if (a !== b) return b - a // assume non-NaN
        }
        return 0
      })
      for (let i = 0; i < group.length; i++) {
        const bi = group[i] * k
        let betterCount = 0
        let dropped = false
        for (let j = 0, extra = i - topN; j <= extra + betterCount; j++) {
          const bj = group[j] * k
          let dominates = true
          for (let q = 0; q < k; q++) {
            if (flat[bj + q] < flat[bi + q]) {
              dominates = false
              break
            }
          }
          if (dominates && ++betterCount >= topN) {
            dropped = true
            break
          }
        }
        if (!dropped) kept.push(group[i])
      }
    }

    result[s] = kept.map((row) => comp[row])
    if (kept.length !== n) changed = true
  }

  if (changed) state.candidates = result
}

const offset = Symbol()
/**
 * Replace `read`/`sum`/`prod` combinations with smaller `read` nodes. If changes are made,
 * `candidates` will be replaced with new values with all string keys replaced, maintaining only 'id'.
 */
export function reaffine<ID>(state: State<OP, ID>) {
  const { nodes, cat, candidates } = state
  type Weight = Record<string | typeof offset, number>
  const weights = new Map<AnyNode<OP>, Weight>()
  traverse(nodes, (n, visit) => {
    n.x.forEach(visit)
    n.br.forEach(visit)

    if (n.br.length) return
    const x = n.x.map((n) => weights.get(n)!)
    if (x.some((w) => !w)) return

    let weight: Weight
    switch (n.op) {
      case 'sum': {
        weight = { [offset]: x.reduce((acu, w) => acu + w[offset], 0) }
        for (const w of x)
          for (const [k, v] of Object.entries(w))
            weight[k] = (weight[k] ?? 0) + v
        break
      }
      case 'prod': {
        const idx = n.x.findIndex((n) => n.op !== 'const')
        if (n.x.find((n, i) => n.op !== 'const' && i !== idx)) return // multiple non-const terms
        weight = idx !== -1 ? { ...x[idx] } : { [offset]: 1 }
        const factor = x.reduce((f, w, i) => (i === idx ? f : f * w[offset]), 1)
        if (factor != 1) {
          Object.keys(weight).forEach((k) => (weight[k] *= factor))
          weight[offset] *= factor
        }
        break
      }
      case 'read':
        weight = { [n.tag[cat]!]: 1, [offset]: 0 }
        break
      case 'const':
        if (typeof n.ex !== 'number') return
        weight = { [offset]: n.ex }
        break
      default:
        return
    }
    weights.set(n, weight)
  })

  const topWeights = new Map<AnyNode<OP>, Weight>()
  traverse(nodes, (n, visit) => {
    const w = weights.get(n)
    // Make sure `n` contains a variable, i.e., `w` has some string keys
    if (w && Object.keys(w).length) topWeights.set(n, w)
    else {
      n.x.forEach(visit)
      n.br.forEach(visit)
    }
  })
  const shouldChange = [...topWeights.keys()].some((n) => {
    if (n.op === 'const' || n.op === 'read') return false
    if (n.op === 'sum' && n.x.length === 2)
      if (n.x[0].op === 'const' && n.x[1].op === 'read') return false
      else if (n.x[1].op === 'const' && n.x[0].op === 'read') return false
    return true
  })
  if (!shouldChange) return

  // { cat1:w1 cat2:w2 .. } => "!cat1:<w1>:cat2:<w2>:.." with PUA chars
  // instead of `!` and `:` to minimize the chance of them being in some `cat`s
  let readNames = new Map(
    [...topWeights.values()].map((w) => {
      const keys = Object.keys(w).sort()
      if (keys.length === 1 && w[keys[0]] === 1) return [w, keys[0]]
      // skip `w[offset]` because it doesn't go into the new `Read` nodes
      return [w, '\u{F33D}' + keys.flatMap((k) => [k, w[k]]).join('\u{F00D}')]
    })
  )
  if (!isDebug('calc')) {
    // "!cat1:<w1>:cat2:<w2>:.." => "cX" (skipped in debug mode)
    const map = new Map([...readNames.values()].map((id, i) => [id, `c${i}`]))
    readNames = new Map([...readNames].map(([w, id]) => [w, map.get(id)!]))
  }

  const weightNodes = new Map<Weight, NumNode<OP>>()
  for (const [w, name] of readNames) {
    const node = read({ [cat]: name })
    weightNodes.set(w, w[offset] !== 0 ? sum(w[offset], node) : node)
  }
  // Flatten each weight map once. The loop below touches every candidate in the
  // pool, and `Object.entries(w)` was allocating an entries array per weight map
  // per candidate. Key order (and therefore the summation order, and therefore
  // the floating-point result) is preserved exactly.
  const flatWeights = [...readNames].map(([w, name]) => {
    const keys: string[] = []
    const vals: number[] = []
    for (const k in w) {
      keys.push(k)
      vals.push(w[k])
    }
    return { name, keys, vals }
  })

  state.candidates = candidates.map((cnds) =>
    cnds.map((c) => {
      const result = { id: c['id'] } as Candidate<ID>
      const record = c as unknown as Record<string, number>
      for (const { name, keys, vals } of flatWeights) {
        if (name in result) continue // same weight, different offsets
        let acc = 0
        for (let t = 0; t < keys.length; t++)
          acc += (record[keys[t]] ?? 0) * vals[t]
        result[name] = acc
      }
      return result
    })
  )
  state.nodes = mapBottomUp(nodes, (n, o) => {
    const w = topWeights.get(o)
    return w ? weightNodes.get(w)! : n
  })
}

/** Get range assuming any item in `cnds` can be selected */
function computeCndRanges<ID>(cnds: Candidate<ID>[]): CndRanges[number] {
  // CAUTION:
  // This is the only place where `id` is treated as non-opaque (comparable)
  // objects. If `c1.id < c2.id` may crash, we have to change the algorithm
  // or exclude `id` specifically. We don't care if the comparison result is
  // gibberish, though, so long as it succeeds.
  //
  // This runs once per slot but over *every* candidate in it, so it must not
  // allocate per candidate. The obvious formulation
  // (`for (const [k, r] of Object.entries(range))`) allocates an entries array
  // and a `[key, range]` pair per key for each of possibly millions of
  // candidates; the accumulators below are flat arrays instead.
  const n = cnds.length
  if (n === 0) return {}
  const first = cnds[0] as Candidate
  const keys = Object.keys(first)
  const index = new Map<string, number>()
  const mins: number[] = []
  const maxs: number[] = []
  for (let j = 0; j < keys.length; j++) {
    const v = first[keys[j]] as number
    index.set(keys[j], j)
    mins.push(v)
    maxs.push(v)
  }
  for (let i = 1; i < n; i++) {
    const c = cnds[i] as Candidate
    // Keys already known: a candidate missing one contributes 0.
    for (let j = 0; j < keys.length; j++) {
      const v = (c[keys[j]] as number) ?? 0
      if (mins[j] > v) mins[j] = v
      if (maxs[j] < v) maxs[j] = v
    }
    // Keys seen for the first time start from a range that includes 0.
    for (const k in c) {
      if (index.has(k)) continue
      const v = c[k] as number
      index.set(k, keys.length)
      keys.push(k)
      mins.push(Math.min(0, v))
      maxs.push(Math.max(0, v))
    }
  }
  const result: CndRanges[number] = {}
  for (let j = 0; j < keys.length; j++)
    result[keys[j]] = { min: mins[j], max: maxs[j] }
  return result
}

/** Get possible ranges of each node */
function computeNodeRanges(
  nodes: NumNode<OP>[],
  cat: string,
  cndRanges: CndRanges
): NodeRanges {
  const result = new Map<AnyNode<OP>, Range>()
  traverse(nodes, (n, visit) => {
    n.x.forEach(visit)
    n.br.forEach(visit)
    const ranges = n.x.map((n) => result.get(n)!)
    const mins = ranges.map((r) => r.min)
    const maxs = ranges.map((r) => r.max)

    function cornerRange(
      op: keyof typeof arithmetic,
      [x0, x1]: [Range, Range]
    ): Range {
      const calc = arithmetic[op]
      const vals = [
        calc([x0.min, x1.min]),
        calc([x0.min, x1.max]),
        calc([x0.max, x1.min]),
        calc([x0.max, x1.max]),
      ]
      return { min: Math.min(...vals), max: Math.max(...vals) }
    }

    let r: Range
    switch (n.op) {
      case 'const':
        if (typeof n.ex === 'number') r = { min: n.ex, max: n.ex }
        else r = { min: NaN, max: NaN }
        break
      case 'sum':
        r = {
          min: mins.reduce((a, b) => a + b, 0),
          max: maxs.reduce((a, b) => a + b, 0),
        }
        break
      case 'prod':
        r = { min: 1, max: 1 }
        r = ranges.reduce((r, xr) => cornerRange(n.op, [r, xr]), r)
        break
      case 'min':
      case 'max':
        r = { min: Math[n.op](...mins), max: Math[n.op](...maxs) }
        break
      case 'match':
      case 'thres':
        r = { min: Math.min(...mins), max: Math.max(...maxs) }
        break
      case 'sumfrac':
        if (mins[0] + mins[1] > 0 || maxs[0] + maxs[1] < 0)
          r = cornerRange(n.op, ranges as [Range, Range])
        // Degenerate if `x + c` touches zero
        else r = { min: NaN, max: NaN }
        break
      case 'read': {
        r = { min: 0, max: 0 }
        for (const { [n.tag[cat]!]: range } of cndRanges)
          if (range) {
            r.min += range.min
            r.max += range.max
          }
        break
      }
      case 'subscript': {
        if (typeof n.ex[0] !== 'number') r = { min: NaN, max: NaN }
        else {
          // Note: this assumes there is no NaN in the array
          r = { min: Infinity, max: -Infinity }
          let { min: start, max: last } = result.get(n.br[0])!
          start = Math.max(0, Math.ceil(start))
          last = Math.min(last, n.ex.length - 1)
          for (let i = start; i <= last; i++) {
            const v = n.ex[i] as number
            if (r.min > v) r.min = v
            if (r.max < v) r.max = v
          }
          if (r.min > r.max) r = { min: NaN, max: NaN }
        }
        break
      }
      case 'lookup':
        // Note: this assumes that `default` branch is never reached if not presented
        if (isNaN(mins[0]) && isNaN(maxs[0])) {
          mins.splice(0, 1)
          maxs.splice(0, 1)
        }
        r = { min: Math.min(...mins), max: Math.max(...maxs) }
        break
      case 'custom':
        r = customOps[n.ex]!.range(ranges)
        break
      default:
        assertUnreachable(n)
    }
    result.set(n, r)
  })
  return result
}

/**
 * When false, `pruneRange` uses the general per-candidate implementation even
 * where the compiled fast path applies. Only a test hook: it exists so the two
 * implementations can be pinned against each other on identical inputs.
 */
let fastPathEnabled = true

export function setPruneFastPathEnabled(enabled: boolean) {
  fastPathEnabled = enabled
}

/**
 * Integer opcodes for the node ops `compileCandidateCheck` can evaluate. A
 * numeric switch is what lets the per-candidate loop compile to a jump table
 * instead of a chain of string comparisons.
 */
const OP = {
  const: 0,
  read: 1,
  sum: 2,
  prod: 3,
  min: 4,
  max: 5,
  thres: 6,
  match: 7,
  sumfrac: 8,
  subscript: 9,
  lookup: 10,
  custom: 11,
} as const
const OPCODES: Record<string, number | undefined> = {
  const: OP.const,
  read: OP.read,
  sum: OP.sum,
  prod: OP.prod,
  min: OP.min,
  max: OP.max,
  thres: OP.thres,
  match: OP.match,
  sumfrac: OP.sumfrac,
  subscript: OP.subscript,
  lookup: OP.lookup,
  custom: OP.custom,
}

/**
 * Post-order walk of a node list: children before parents, each node once.
 * Mirrors the order `traverse` produces for `computeNodeRanges`.
 */
function nodeEvaluationOrder(nodes: NumNode<OP>[]): NumNode<OP>[] {
  const order: NumNode<OP>[] = []
  const seen = new Set<AnyNode<OP>>()
  const visit = (n: AnyNode<OP>) => {
    if (seen.has(n)) return
    seen.add(n)
    for (const c of n.x) visit(c)
    for (const c of n.br) visit(c)
    order.push(n as NumNode<OP>)
  }
  for (const n of nodes) visit(n)
  return order
}

/**
 * Compile the per-candidate constraint test used by `pruneRange`.
 *
 * The general implementation (`computeCndRanges([c])` + `computeNodeRanges`)
 * allocates a range record and a `Map` of node ranges for every candidate,
 * which makes pruning quadratic-ish in allocation terms on pools of millions of
 * candidates. This evaluates exactly the same ranges into reused buffers.
 *
 * The candidate takes the place of `slot`'s range contribution while every
 * other slot keeps its merged range; a `read` node sums across all slots, so
 * its range here is the candidate's own value plus the other slots' totals.
 *
 * Returns `null` when the node graph uses an op this does not model (or when
 * there is nothing to check), leaving the caller on the general path.
 */
function compileCandidateCheck<ID>(
  nodes: NumNode<OP>[],
  minimum: number[],
  cat: string,
  cndRanges: CndRanges,
  slot: number
): ((c: Candidate<ID>) => boolean) | null {
  if (minimum.length === 0) return null

  // A constraint with a `-Infinity` minimum can never reject a candidate
  // (`max >= -Infinity` holds for every number, and NaN is accepted too), so
  // its subtree is pure overhead here. The objective is normally exactly such
  // a node (`minimum[0] === -Infinity`), and on a real damage formula it dwarfs
  // the actual constraints — evaluating it per candidate is the difference
  // between a usable and an unusable prune.
  const relevant: NumNode<OP>[] = []
  const relevantMinimum: number[] = []
  for (let j = 0; j < minimum.length; j++) {
    if (minimum[j] === -Infinity) continue
    relevant.push(nodes[j])
    relevantMinimum.push(minimum[j])
  }
  if (relevant.length === 0) return () => true

  const order = nodeEvaluationOrder(relevant)
  const index = new Map<AnyNode<OP>, number>()
  order.forEach((n, i) => index.set(n, i))

  // Merged range of every slot except `slot`, per coord. Collected first as
  // string-keyed sums, then flattened to arrays indexed by coord so the
  // per-candidate loop never hashes a string.
  const otherMinByKey = new Map<string, number>()
  const otherMaxByKey = new Map<string, number>()
  cndRanges.forEach((ranges, s) => {
    if (s === slot) return
    for (const key in ranges) {
      const r = ranges[key]
      otherMinByKey.set(key, (otherMinByKey.get(key) ?? 0) + r.min)
      otherMaxByKey.set(key, (otherMaxByKey.get(key) ?? 0) + r.max)
    }
  })
  const keyIndex = new Map<string, number>()
  const otherMin: number[] = []
  const otherMax: number[] = []
  for (const [key, v] of otherMinByKey) {
    keyIndex.set(key, otherMin.length)
    otherMin.push(v)
    otherMax.push(otherMaxByKey.get(key) ?? 0)
  }

  // Precompile the graph into flat per-node metadata plus an integer opcode, so
  // the per-candidate loop is a numeric switch over typed arrays rather than
  // re-walking node objects and dispatching on op strings for every candidate.
  // Every op `computeNodeRanges` knows is modelled here; a graph using anything
  // else (or an unregistered custom op) falls back to the general path.
  const count = order.length
  const opcode = new Int8Array(count)
  const childX = new Array<Int32Array>(count)
  const childBr = new Array<Int32Array>(count)
  const nodeEx = new Array<unknown>(count)
  const constantValue = new Float64Array(count)
  const readName = new Array<string | undefined>(count)
  const readKey = new Int32Array(count).fill(-1)
  const customRange = new Array<((r: Range[]) => Range) | undefined>(count)
  const customArgs = new Array<Range[]>(count)

  for (let i = 0; i < count; i++) {
    const n = order[i]
    const code = OPCODES[n.op as keyof typeof OPCODES]
    if (code === undefined) return null
    opcode[i] = code
    childX[i] = Int32Array.from(n.x, (c) => index.get(c)!)
    childBr[i] = Int32Array.from(n.br, (c) => index.get(c)!)
    nodeEx[i] = n.ex
    if (code === OP.const) {
      constantValue[i] = typeof n.ex === 'number' ? (n.ex as number) : NaN
    } else if (code === OP.read) {
      const key = n.tag?.[cat]
      if (key != null) {
        readName[i] = key
        readKey[i] = keyIndex.get(key) ?? -1
      }
    } else if (code === OP.custom) {
      const op = customOps[n.ex as string]
      if (!op) return null
      customRange[i] = op.range
      // Reused across candidates; `range` implementations only read the bounds.
      customArgs[i] = n.x.map(() => ({ min: 0, max: 0 }))
    }
  }

  // Only the constraints that can actually reject are evaluated (see above).
  const constraintIndex = new Int32Array(relevant.length)
  for (let j = 0; j < relevant.length; j++) {
    constraintIndex[j] = index.get(relevant[j])!
  }

  const minScratch = new Float64Array(count)
  const maxScratch = new Float64Array(count)
  const prod = arithmetic.prod
  const sumfrac = arithmetic.sumfrac

  return (c: Candidate<ID>): boolean => {
    const record = c as unknown as Record<string, number>
    for (let i = 0; i < count; i++) {
      let mn: number
      let mx: number
      switch (opcode[i]) {
        case OP.const: {
          mn = constantValue[i]
          mx = mn
          break
        }
        case OP.read: {
          const name = readName[i]
          const v = name === undefined ? 0 : (record[name] ?? 0)
          const ki = readKey[i]
          if (ki < 0) {
            // The coord exists only in this slot, so the candidate's own value
            // *is* the whole range contribution.
            mn = v
            mx = v
          } else {
            mn = v + otherMin[ki]
            mx = v + otherMax[ki]
          }
          break
        }
        case OP.sum: {
          const cx = childX[i]
          let a = 0
          let b = 0
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            a += minScratch[ci]
            b += maxScratch[ci]
          }
          mn = a
          mx = b
          break
        }
        case OP.prod: {
          // Same corner-wise reduction as `computeNodeRanges`.
          const cx = childX[i]
          let a = 1
          let b = 1
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            const c0 = minScratch[ci]
            const c1 = maxScratch[ci]
            const v0 = prod([a, c0])
            const v1 = prod([a, c1])
            const v2 = prod([b, c0])
            const v3 = prod([b, c1])
            a = Math.min(v0, v1, v2, v3)
            b = Math.max(v0, v1, v2, v3)
          }
          mn = a
          mx = b
          break
        }
        case OP.min:
        case OP.max: {
          // `computeNodeRanges` applies `Math[min|max]` to the mins and to the
          // maxes independently, not a single min/max pair.
          const cx = childX[i]
          const isMin = opcode[i] === OP.min
          let a = isMin ? Infinity : -Infinity
          let b = isMin ? Infinity : -Infinity
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            a = isMin
              ? Math.min(a, minScratch[ci])
              : Math.max(a, minScratch[ci])
            b = isMin
              ? Math.min(b, maxScratch[ci])
              : Math.max(b, maxScratch[ci])
          }
          mn = a
          mx = b
          break
        }
        case OP.thres:
        case OP.match: {
          // `computeNodeRanges` treats both as the hull of their `x` children.
          const cx = childX[i]
          let a = Infinity
          let b = -Infinity
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            a = Math.min(a, minScratch[ci])
            b = Math.max(b, maxScratch[ci])
          }
          mn = a
          mx = b
          break
        }
        case OP.sumfrac: {
          const cx = childX[i]
          const x0 = minScratch[cx[0]]
          const x1 = maxScratch[cx[0]]
          const c0 = minScratch[cx[1]]
          const c1 = maxScratch[cx[1]]
          if (c0 + x0 > 0 || c1 + x1 < 0) {
            const v0 = sumfrac([x0, c0])
            const v1 = sumfrac([x0, c1])
            const v2 = sumfrac([x1, c0])
            const v3 = sumfrac([x1, c1])
            mn = Math.min(v0, v1, v2, v3)
            mx = Math.max(v0, v1, v2, v3)
          } else {
            mn = NaN
            mx = NaN
          }
          break
        }
        case OP.subscript: {
          const ex = nodeEx[i] as unknown[]
          if (typeof ex[0] !== 'number') {
            mn = NaN
            mx = NaN
            break
          }
          const idx = childBr[i][0]
          const start = Math.max(0, Math.ceil(minScratch[idx]))
          const last = Math.min(maxScratch[idx], ex.length - 1)
          let a = Infinity
          let b = -Infinity
          for (let t = start; t <= last; t++) {
            const v = ex[t] as number
            if (a > v) a = v
            if (b < v) b = v
          }
          if (a > b) {
            mn = NaN
            mx = NaN
          } else {
            mn = a
            mx = b
          }
          break
        }
        case OP.lookup: {
          const cx = childX[i]
          let a = Infinity
          let b = -Infinity
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            // A fully-NaN first child is dropped before the hull is taken.
            if (t === 0 && isNaN(minScratch[ci]) && isNaN(maxScratch[ci]))
              continue
            if (a > minScratch[ci]) a = minScratch[ci]
            if (b < maxScratch[ci]) b = maxScratch[ci]
          }
          mn = a
          mx = b
          break
        }
        case OP.custom: {
          const cx = childX[i]
          const args = customArgs[i]
          for (let t = 0; t < cx.length; t++) {
            const ci = cx[t]
            args[t].min = minScratch[ci]
            args[t].max = maxScratch[ci]
          }
          const r = customRange[i]!(args)
          mn = r.min
          mx = r.max
          break
        }
        default:
          assertUnreachable(opcode[i] as never)
      }
      minScratch[i] = mn
      maxScratch[i] = mx
    }
    for (let j = 0; j < constraintIndex.length; j++) {
      const m = maxScratch[constraintIndex[j]]
      if (!(isNaN(m) || m >= relevantMinimum[j])) return false
    }
    return true
  }
}

function getMonotonicities(
  nodes: NumNode<OP>[],
  cat: string,
  nodeRanges: NodeRanges
): Monotonicities {
  const mon = new Map<AnyNode<OP>, Monotonicity>()
  const toVisit: { node: AnyNode<OP>; inc: boolean }[] = []
  const result = new Map<string, Monotonicity>()

  // `inc` if `node` is strictly increasing in *some* valid regions.
  // `!inc` if `node` is strictly decreasing in *some* valid regions.
  // Consequently, if both `inc` and `!inc` are called on the same
  // node, the node itself is non-monotonic.
  function visit(node: AnyNode<OP>, inc: boolean) {
    if (!mon.has(node)) mon.set(node, { inc: true, dec: true })
    const m = mon.get(node)!
    if (inc && m.dec) m.dec = false
    else if (!inc && m.inc) m.inc = false
    else return // no update
    toVisit.push({ node, inc })
  }

  nodes.forEach((node) => visit(node, true))
  // Cannot use `traverse` because each node is visited twice, once for `inc` and once for `dec`
  while (toVisit.length) {
    const { node, inc } = toVisit.pop()!
    switch (node.op) {
      case 'read':
        result.set(node.tag[cat]!, mon.get(node)!)
        break
      case 'const':
        break
      case 'sum':
      case 'min':
      case 'max':
        node.x.forEach((n) => visit(n, inc))
        break
      case 'thres': {
        node.x.forEach((n) => visit(n, inc))
        const ge = nodeRanges.get(node.x[0])!
        const lt = nodeRanges.get(node.x[1])!
        // if `br` is not visited, both branches are constants and equal
        if (ge.max > lt.min) {
          visit(node.br[0], inc)
          visit(node.br[1], !inc)
        }
        if (ge.min < lt.max) {
          visit(node.br[0], !inc)
          visit(node.br[1], inc)
        }
        break
      }
      case 'sumfrac': {
        const [x, c] = node.x.map((n) => nodeRanges.get(n)!)
        // if `x` is not visited, `c == 0` and `node == 1`
        if (c.min < 0) visit(node.x[0], !inc)
        if (c.max > 0) visit(node.x[0], inc)
        // if `c` is not visited, `x == 0` and `node == 0`
        if (x.min < 0) visit(node.x[1], inc)
        if (x.max > 0) visit(node.x[1], !inc)
        break
      }
      case 'prod': {
        const r = nodeRanges.get(node)!
        if (r.min < 0 && r.max > 0) {
          // unsupported zero-crossing
          node.x.forEach((n) => visit(n, true))
          node.x.forEach((n) => visit(n, false))
        } else {
          const absInc = inc === r.max > 0 // |node| is increasing in some regions
          node.x.forEach((n) => visit(n, absInc === nodeRanges.get(n)!.max > 0))
        }
        break
      }
      case 'match':
      case 'lookup':
        node.x.forEach((n) => visit(n, inc))
        node.br.forEach((n) => visit(n, true))
        node.br.forEach((n) => visit(n, false))
        break
      case 'subscript': {
        const {
          br: [br],
          ex: arr,
        } = node
        if (typeof arr[0] === 'number') {
          let { min: start, max: last } = nodeRanges.get(br)!
          start = Math.max(0, Math.ceil(start))
          last = Math.min(last, arr.length - 1)
          for (let i = start + 1; i <= last; i++)
            if (arr[i - 1] < arr[i]) {
              visit(br, inc)
              break
            }
          for (let i = start + 1; i <= last; i++)
            if (arr[i - 1] > arr[i]) {
              visit(br, !inc)
              break
            }
        } else {
          visit(br, true)
          visit(br, false)
        }
        break
      }
      case 'custom':
        customOps[node.ex]
          .monotonicity(node.x.map((n) => nodeRanges.get(n)!))
          .forEach((t, i) => {
            if (!t.inc) visit(node.x[i], !inc)
            if (!t.dec) visit(node.x[i], inc)
          })
        break
      default:
        assertUnreachable(node)
    }
  }
  return result
}
