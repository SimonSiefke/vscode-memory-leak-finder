import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'

export const parseHeapSnapshotStrings = (id: number): readonly string[] => {
  const heapsnapshot = HeapSnapshotState.get(id)
  if (!heapsnapshot) {
    throw new Error(`snapshot not found`)
  }

  const { strings } = heapsnapshot
  if (!Array.isArray(strings)) {
    throw new TypeError('no strings found')
  }
  return strings
}
