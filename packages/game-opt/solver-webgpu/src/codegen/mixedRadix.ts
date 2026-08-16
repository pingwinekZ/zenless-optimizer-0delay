/** mixed-radix digits of `index`, i.e. the per-slot candidate indices */
export function dispatchStartIndices(index: number, sizes: number[]): number[] {
  const digits: number[] = []
  let rest = index
  for (const size of sizes) {
    digits.push(rest % size)
    rest = Math.floor(rest / size)
  }
  return digits
}

/**
 * Invert the shader's carry-merge: `local` is the build offset within the
 * current dispatch, `bases` the per-slot candidate indices at dispatch start.
 * Returns the absolute per-slot candidate indices.
 */
export function decodeChunk(
  local: number,
  bases: number[],
  sizes: number[]
): number[] {
  const indices: number[] = []
  let rest = local
  let carry = 0
  for (let s = 0; s < sizes.length; s++) {
    const o = rest % sizes[s]
    rest = Math.floor(rest / sizes[s])
    const i = bases[s] + o + carry
    indices.push(i % sizes[s])
    carry = Math.floor(i / sizes[s])
  }
  return indices
}
