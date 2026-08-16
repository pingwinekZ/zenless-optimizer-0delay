/**
 * Bounded min-heap keeping the `topN` largest values.
 *
 * The heap root is the current threshold: the smallest value kept so far. When
 * full, inserting a value below the root is a no-op.
 */
export class FixedSizeNumericMinQueue<T> {
  private heap: { value: number; item: T }[] = []
  private readonly limit: number

  constructor(topN: number) {
    this.limit = topN
  }

  /** current minimum of the heap, or `-Infinity` when empty / not full */
  get threshold(): number {
    return this.heap.length >= this.limit ? this.heap[0].value : -Infinity
  }

  /** all items, sorted in descending order of value */
  toArray(): T[] {
    return this.toEntries().map(({ item }) => item)
  }

  /** all {value, item} pairs, sorted in descending order of value */
  toEntries(): { value: number; item: T }[] {
    return [...this.heap].sort((a, b) => b.value - a.value)
  }

  push(value: number, item: T) {
    const { heap, limit } = this
    if (heap.length < limit) {
      heap.push({ value, item })
      this.bubbleUp(heap.length - 1)
      return
    }
    if (value <= heap[0].value) return
    heap[0] = { value, item }
    this.bubbleDown(0)
  }

  private bubbleUp(index: number) {
    const { heap } = this
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (heap[parent].value <= heap[index].value) return
      ;[heap[parent], heap[index]] = [heap[index], heap[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number) {
    const { heap } = this
    for (;;) {
      const left = index * 2 + 1
      const right = left + 1
      let smallest = index
      if (left < heap.length && heap[left].value < heap[smallest].value)
        smallest = left
      if (right < heap.length && heap[right].value < heap[smallest].value)
        smallest = right
      if (smallest === index) return
      ;[heap[smallest], heap[index]] = [heap[index], heap[smallest]]
      index = smallest
    }
  }
}
