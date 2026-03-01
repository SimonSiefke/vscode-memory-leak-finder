import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

const ITEMS_PER_NODE = 7

interface HeapSnapshotWithNodes {
  readonly nodes: ArrayBuffer
  readonly snapshot: {
    readonly meta: {
      readonly node_types: readonly [readonly string[]]
    }
  }
}

export const getObjectShapeCountFromHeapSnapshot = (id: number): number => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  if (!heapsnapshot) {
    throw new Error('Heap snapshot not found')
  }
  const snapshot = heapsnapshot as unknown as HeapSnapshotWithNodes
  const { nodes } = snapshot
  const { meta } = snapshot.snapshot
  const { node_types } = meta
  const objectShapeIndex = node_types[0].indexOf('object shape')
  const nodesArray = new Uint32Array(nodes)
  let count = 0
  for (let i = 0; i < nodesArray.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i]
    if (typeIndex === objectShapeIndex) {
      count++
    }
  }
  return count
}
